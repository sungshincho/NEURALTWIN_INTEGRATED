import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles,
  requireAuth = true 
}: ProtectedRouteProps) => {
  const { isAuthenticated, authContext, loading, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialized) return;

    // Redirect to auth if not authenticated and auth is required
    if (requireAuth && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Check role-based access
    if (allowedRoles && authContext) {
      const hasAccess = allowedRoles.includes(authContext.role);
      
      if (!hasAccess) {
        // Redirect based on role
        switch (authContext.role) {
          case 'NEURALTWIN_MASTER':
            navigate('/admin'); // Admin dashboard
            break;
          case 'ORG_HQ':
          case 'ORG_STORE':
          case 'ORG_VIEWER':
            navigate('/dashboard'); // Customer dashboard
            break;
          default:
            navigate('/');
        }
      }
    }
  }, [isAuthenticated, authContext, loading, initialized, navigate, allowedRoles, requireAuth]);

  // Show loading state while checking authentication
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated and auth is required, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If roles are specified and user doesn't have access, don't render
  if (allowedRoles && authContext && !allowedRoles.includes(authContext.role)) {
    return null;
  }

  return <>{children}</>;
};
