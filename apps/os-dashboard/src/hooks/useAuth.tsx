
import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  orgId: string | null;
  orgName: string | null;
  role: string | null;
  licenseId: string | null;
  licenseType: string | null;
  licenseStatus: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithKakao: () => Promise<{ error: any }>;
  loading: boolean;
  getDefaultDashboard: () => string;
  isNeuralTwinMaster: () => boolean;
  isOrgHQ: () => boolean;
  isOrgStore: () => boolean;
  isOrgViewer: () => boolean;
  canAccessFeature: (feature: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [licenseId, setLicenseId] = useState<string | null>(null);
  const [licenseType, setLicenseType] = useState<string | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to migrate user to organization if needed
  const ensureOrganization = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('migrate_user_to_organization', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error migrating user to organization:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error calling migrate_user_to_organization:', err);
      return null;
    }
  };

  // Function to get default dashboard based on role
  const getDefaultDashboard = () => {
    switch (role) {
      case 'NEURALTWIN_MASTER':
        return '/overview/dashboard';
      case 'ORG_HQ':
        return '/overview/dashboard';
      case 'ORG_STORE':
        return '/analysis/store';
      case 'ORG_VIEWER':
        return '/overview/dashboard';
      default:
        return '/overview/dashboard';
    }
  };

  // Role checking helpers
  const isNeuralTwinMaster = () => role === 'NEURALTWIN_MASTER';
  const isOrgHQ = () => role === 'ORG_HQ';
  const isOrgStore = () => role === 'ORG_STORE';
  const isOrgViewer = () => role === 'ORG_VIEWER';

  // Feature access control
  const canAccessFeature = (feature: string): boolean => {
    if (!role) return false;
    
    // NEURALTWIN_MASTER has access to everything
    if (role === 'NEURALTWIN_MASTER') return true;
    
    // Define feature access by role
    const featureAccess: Record<string, string[]> = {
      'hq-sync': ['ORG_HQ'],
      'advanced-analytics': ['ORG_HQ', 'ORG_STORE'],
      'simulation': ['ORG_HQ', 'ORG_STORE'],
      'data-management': ['ORG_HQ', 'ORG_STORE'],
      'basic-analytics': ['ORG_HQ', 'ORG_STORE', 'ORG_VIEWER'],
      'dashboard': ['ORG_HQ', 'ORG_STORE', 'ORG_VIEWER'],
    };
    
    const allowedRoles = featureAccess[feature];
    return allowedRoles ? allowedRoles.includes(role) : false;
  };

  // Function to fetch organization context
  const fetchOrganizationContext = async (userId: string) => {
    try {
      // Ensure user has organization
      const migrated_org_id = await ensureOrganization(userId);

      // Fetch organization membership details with license info
      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          role,
          org_id,
          license_id,
          organizations (
            org_name
          ),
          licenses (
            license_type,
            status
          )
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (memberError) {
        console.error('Error fetching organization membership:', memberError);
        await supabase.auth.signOut();
        throw new Error('NO_SUBSCRIPTION');
      }

      if (!membership) {
        console.error('No organization membership found for user');
        await supabase.auth.signOut();
        throw new Error('NO_SUBSCRIPTION');
      }

      // NEURALTWIN_MASTER bypasses subscription check
      if (membership.role !== 'NEURALTWIN_MASTER') {
        // Check subscription status for regular users
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('org_id', membership.org_id)
          .maybeSingle();

        if (subError) {
          console.error('Error fetching subscription:', subError);
        }

        // Block login if no subscription or inactive subscription
        if (!subscription || subscription.status !== 'active') {
          console.error('No active subscription found for organization');
          await supabase.auth.signOut();
          throw new Error('NO_SUBSCRIPTION');
        }
      }

      setOrgId(membership.org_id);
      setOrgName((membership.organizations as any)?.org_name || null);
      setRole(membership.role);
      setLicenseId(membership.license_id);
      
      // Set license details if available
      const licenseData = membership.licenses as any;
      if (licenseData) {
        setLicenseType(licenseData.license_type);
        setLicenseStatus(licenseData.status);
      } else {
        setLicenseType(null);
        setLicenseStatus(null);
      }
    } catch (err) {
      console.error('Error fetching organization context:', err);
      throw err;
    }
  };

  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (import.meta.env.DEV) {
          console.log("Auth state changed:", event);
        }
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch organization context when user signs in
        if (session?.user) {
          setTimeout(async () => {
            try {
              await fetchOrganizationContext(session.user.id);
              
              // Only redirect if organization context loaded successfully
              // 로그인 페이지(/auth)에서만 리다이렉트, 이미 대시보드에 있으면 무시
              if (event === "SIGNED_IN") {
                const currentPath = window.location.pathname;
                if (currentPath === "/auth") {
                  redirectTimeout = setTimeout(() => {
                    const defaultPath = getDefaultDashboard();
                    navigate(defaultPath);
                  }, 500);
                }
              }
            } catch (error) {
              // Don't redirect if organization context failed (e.g., no subscription)
              console.error('Failed to load organization context:', error);
            }
          }, 0);
        } else {
          setOrgId(null);
          setOrgName(null);
          setRole(null);
          setLicenseId(null);
          setLicenseType(null);
          setLicenseStatus(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchOrganizationContext(session.user.id)
          .then(() => {
            setLoading(false);
          })
          .catch((err) => {
            console.error('Failed to fetch organization context:', err);
            // 오류 발생 시에도 로딩 상태 해제
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) return { error };
      
      if (data.user) {
        // Check subscription status
        try {
          await fetchOrganizationContext(data.user.id);
          
          // 로그인 성공 시 활동 로깅
          setTimeout(async () => {
            try {
              const { data: membership } = await supabase
                .from('organization_members')
                .select('org_id')
                .eq('user_id', data.user.id)
                .single();

              await supabase
                .from('user_activity_logs')
                .insert({
                  user_id: data.user.id,
                  org_id: membership?.org_id || null,
                  activity_type: 'login',
                  activity_data: { 
                    timestamp: new Date().toISOString(),
                    method: 'email_password'
                  },
                });
            } catch (err) {
              console.debug('Login activity logging skipped:', err);
            }
          }, 0);
        } catch (err: any) {
          // Return specific error for no subscription
          if (err.message === 'NO_SUBSCRIPTION') {
            return { error: { message: 'NO_SUBSCRIPTION' } };
          }
          throw err;
        }
      }
      
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

const signOut = async () => {
  // 1. 먼저 로컬 스토리지 정리
  try {
    Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('sb-')).forEach(k => localStorage.removeItem(k));
    Object.keys(sessionStorage).filter(k => k.includes('supabase') || k.includes('sb-')).forEach(k => sessionStorage.removeItem(k));
  } catch (err) {
    console.debug('Storage cleanup error:', err);
  }

  // 2. 활동 로깅 (실패해도 무시)
  if (user?.id && orgId) {
    try {
      await supabase.from('user_activity_logs').insert({
        user_id: user.id,
        org_id: orgId,
        activity_type: 'logout',
        activity_data: { timestamp: new Date().toISOString() },
      });
    } catch (err) {
      console.debug('Logout activity logging skipped:', err);
    }
  }
  
  // 3. Supabase 로그아웃 (local scope로 서버 에러 방지)
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (err) {
    console.debug('SignOut API error (ignored):', err);
  }
  
  // 4. 강제 리다이렉트
  window.location.href = '/auth';
};

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signInWithKakao = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      orgId, 
      orgName, 
      role,
      licenseId,
      licenseType,
      licenseStatus,
      signIn, 
      signUp, 
      signOut, 
      resetPassword, 
      signInWithGoogle, 
      signInWithKakao, 
      loading,
      getDefaultDashboard,
      isNeuralTwinMaster,
      isOrgHQ,
      isOrgStore,
      isOrgViewer,
      canAccessFeature
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
