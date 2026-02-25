import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, UserAuthContext, OrganizationMember, Organization, License } from '@/types/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authContext, setAuthContext] = useState<UserAuthContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const LOGOUT_FLAG_KEY = 'neuraltwin_manual_logout';

  useEffect(() => {
    const logoutFlag = localStorage.getItem(LOGOUT_FLAG_KEY);

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // 로그인 성공 시 수동 로그아웃 플래그 제거
        if (event === 'SIGNED_IN' && session?.user) {
          localStorage.removeItem(LOGOUT_FLAG_KEY);
        }

        // 수동 로그아웃 상태면 어떤 세션 이벤트도 무시하고 비로그인 유지
        if (localStorage.getItem(LOGOUT_FLAG_KEY)) {
          setUser(null);
          setAuthContext(null);
          setLoading(false);
          setInitialized(true);
          return;
        }

        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer fetching user context to avoid blocking auth state change
          setTimeout(() => {
            fetchUserContext(session.user.id);
          }, 0);
        } else {
          setAuthContext(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    );

    // Then check for existing session (단, 수동 로그아웃 상태가 아니라면)
    if (!logoutFlag) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserContext(session.user.id);
        } else {
          setLoading(false);
          setInitialized(true);
        }
      });
    } else {
      // 수동 로그아웃 상태에서는 즉시 비로그인으로 처리
      setUser(null);
      setAuthContext(null);
      setLoading(false);
      setInitialized(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserContext = async (userId: string) => {
    try {
      // Fetch organization member data with role
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          role,
          org_id,
          license_id,
          organizations (
            org_name,
            metadata
          ),
          licenses (
            license_type,
            status,
            assigned_store_id
          )
        `)
        .eq('user_id', userId)
        .single();

      if (memberError) throw memberError;

      // Fetch user email
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) throw new Error('User not found');

      // Extract role-based default permissions
      const rolePermissions = {
        storeIds: [] as string[],
        features: [] as string[],
        canInvite: memberData.role === 'ORG_HQ',
        canExport: memberData.role === 'ORG_HQ' || memberData.role === 'ORG_STORE',
      };

      // If user has a store license, add assigned store to permissions
      if (memberData.licenses?.assigned_store_id) {
        rolePermissions.storeIds = [memberData.licenses.assigned_store_id];
      }

      const context: UserAuthContext = {
        userId,
        email: authUser.email || '',
        role: memberData.role as AppRole,
        orgId: memberData.org_id,
        orgName: (memberData.organizations as Organization)?.org_name || '',
        license: memberData.licenses as License | undefined,
        permissions: rolePermissions,
      };

      setAuthContext(context);
    } catch (error) {
      console.error('Error fetching user context:', error);
      setAuthContext(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const signOut = async () => {
    try {
      // 수동 로그아웃 플래그 설정 (새로 마운트되어도 비로그인 유지)
      localStorage.setItem(LOGOUT_FLAG_KEY, '1');
      
      // Supabase 전역 세션 로그아웃
      await supabase.auth.signOut();
    } catch (error) {
      // 에러가 발생해도 로컬 상태는 초기화
      console.error('Sign out error:', error);
    } finally {
      // 항상 로컬 상태 초기화
      setUser(null);
      setAuthContext(null);
      setLoading(false);
      setInitialized(true);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return authContext?.role === role;
  };

  const hasAnyRole = (roles: AppRole[]): boolean => {
    return authContext ? roles.includes(authContext.role) : false;
  };

  return {
    user,
    authContext,
    loading,
    initialized,
    signOut,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user,
  };
};
