/**
 * Unified AuthProvider — Context-based authentication for the unified platform.
 *
 * Merges Website's manual-logout flag pattern with OS Dashboard's Context approach.
 * Single Supabase auth subscription shared across all consuming components.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type {
  AppRole,
  UserAuthContext,
  License,
  Organization,
} from "@/types/auth";

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------
export interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;
  authContext: UserAuthContext | null;
  loading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;

  // Auth actions
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    options?: { redirectTo?: string },
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;

  // Role helpers
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;

  // OS Dashboard compat — flat accessors
  orgId: string | null;
  orgName: string | null;
  role: string | null;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------
const LOGOUT_FLAG_KEY = "neuraltwin_manual_logout";
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authContext, setAuthContext] = useState<UserAuthContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Guards against duplicate org-context fetches (race between signIn + onAuthStateChange)
  const orgContextFetchedRef = useRef(false);
  const orgContextFetchingRef = useRef(false);

  // ------------------------------------------------------------------
  // Fetch organization membership + license for the signed-in user
  // ------------------------------------------------------------------
  const fetchUserContext = useCallback(async (userId: string) => {
    if (orgContextFetchingRef.current) return;
    orgContextFetchingRef.current = true;

    try {
      const { data: memberData, error: memberError } = await supabase
        .from("organization_members")
        .select(
          `
          role, org_id, license_id,
          organizations ( org_name, metadata ),
          licenses ( license_type, status, assigned_store_id )
        `,
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (memberError) {
        const isPermissionError =
          memberError.code === "42501" ||
          memberError.message?.includes("permission denied") ||
          (memberError as any).status === 403;
        if (isPermissionError) {
          console.warn(
            "RLS policy issue on organization_members — allowing limited login",
          );
          return;
        }
        throw memberError;
      }

      if (!memberData) {
        // User exists but has no org membership (e.g. fresh signup before org is created)
        setAuthContext(null);
        return;
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error("User not found");

      const rolePermissions = {
        storeIds: [] as string[],
        features: [] as string[],
        canInvite: memberData.role === "ORG_HQ",
        canExport:
          memberData.role === "ORG_HQ" || memberData.role === "ORG_STORE",
      };

      const licenseData = memberData.licenses as any;
      if (licenseData?.assigned_store_id) {
        rolePermissions.storeIds = [licenseData.assigned_store_id];
      }

      setAuthContext({
        userId,
        email: authUser.email || "",
        role: memberData.role as AppRole,
        orgId: memberData.org_id,
        orgName: (memberData.organizations as Organization)?.org_name || "",
        license: licenseData as License | undefined,
        permissions: rolePermissions,
      });
    } catch (error) {
      console.error("Error fetching user context:", error);
      setAuthContext(null);
    } finally {
      orgContextFetchingRef.current = false;
    }
  }, []);

  // ------------------------------------------------------------------
  // Supabase auth listener + initial session check
  // ------------------------------------------------------------------
  useEffect(() => {
    const logoutFlag = localStorage.getItem(LOGOUT_FLAG_KEY);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Clear logout flag on successful sign-in
      if (event === "SIGNED_IN" && session?.user) {
        localStorage.removeItem(LOGOUT_FLAG_KEY);
      }

      // If manual-logout flag is set, stay signed out
      if (localStorage.getItem(LOGOUT_FLAG_KEY)) {
        setUser(null);
        setSession(null);
        setAuthContext(null);
        setLoading(false);
        setInitialized(true);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Skip org-context fetch if signIn() already did it
        if (orgContextFetchedRef.current) {
          orgContextFetchedRef.current = false;
          setLoading(false);
          setInitialized(true);
        } else {
          // OAuth / session-restore path
          setTimeout(async () => {
            try {
              await fetchUserContext(session.user.id);
            } catch (error) {
              console.error("Failed to load user context:", error);
            } finally {
              setLoading(false);
              setInitialized(true);
            }
          }, 0);
        }
      } else {
        setAuthContext(null);
        setLoading(false);
        setInitialized(true);
      }
    });

    // Check existing session (skip if manually logged out)
    if (!logoutFlag) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchUserContext(session.user.id).finally(() => {
            setLoading(false);
            setInitialized(true);
          });
        } else {
          setLoading(false);
          setInitialized(true);
        }
      });
    } else {
      setUser(null);
      setSession(null);
      setAuthContext(null);
      setLoading(false);
      setInitialized(true);
    }

    return () => subscription.unsubscribe();
  }, [fetchUserContext]);

  // ------------------------------------------------------------------
  // Auth actions
  // ------------------------------------------------------------------
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { error };

        if (data.user) {
          // Flag to prevent duplicate fetch in onAuthStateChange
          orgContextFetchedRef.current = true;
          await fetchUserContext(data.user.id);
        }
        return { error: null };
      } catch (error: any) {
        return { error };
      }
    },
    [fetchUserContext],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      options?: { redirectTo?: string },
    ) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            options?.redirectTo || `${window.location.origin}/`,
        },
      });
      return { error };
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      localStorage.setItem(LOGOUT_FLAG_KEY, "1");
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setUser(null);
      setSession(null);
      setAuthContext(null);
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    return { error };
  }, []);

  // ------------------------------------------------------------------
  // Role helpers
  // ------------------------------------------------------------------
  const hasRole = useCallback(
    (role: AppRole): boolean => authContext?.role === role,
    [authContext],
  );

  const hasAnyRole = useCallback(
    (roles: AppRole[]): boolean =>
      authContext ? roles.includes(authContext.role) : false,
    [authContext],
  );

  // ------------------------------------------------------------------
  // Context value
  // ------------------------------------------------------------------
  const value: AuthContextType = {
    user,
    session,
    authContext,
    loading,
    initialized,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    hasRole,
    hasAnyRole,
    orgId: authContext?.orgId ?? null,
    orgName: authContext?.orgName ?? null,
    role: authContext?.role ?? null,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
