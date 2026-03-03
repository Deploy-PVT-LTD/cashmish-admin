import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Superadmin has full access
  if (user.role === 'superadmin') {
    return children;
  }

  // Admin has access to allowedRoles that include 'admin'
  if (user.role === 'admin' && allowedRoles && allowedRoles.includes('admin')) {
    return children;
  }

  // For any other custom role (e.g. Accountant, Editor, user),
  // they MUST explicitly have this page in their permissions array.
  // Exception: if the route has no allowedRoles (meaning it's technically a public admin page)
  const isPublicAdminRoute = !allowedRoles;
  const hasPathPermission = user.permissions && user.permissions.includes(location.pathname);

  if (isPublicAdminRoute || hasPathPermission) {
    return children;
  }

  // If we reach here, they don't have access.
  // Find their first available accessible page
  let redirectPath = '/';
  if (user.permissions && user.permissions.length > 0) {
    redirectPath = user.permissions[0];
  }

  // Safety check against infinite redirects 
  if (redirectPath === location.pathname || !user.permissions || user.permissions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center text-foreground">
        <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view any pages here.</p>
      </div>
    );
  }

  // Redirect to the first permitted page
  return <Navigate to={redirectPath} replace />;
}
