import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'ADMIN' | 'USER'>;
  redirectTo?: string;
}

/**
 * RoleProtectedRoute wrapper component
 * Protects routes based on user authentication AND role
 *
 * @param children - React components to render if authorized
 * @param allowedRoles - Array of roles that can access this route
 * @param redirectTo - Path to redirect if unauthorized (default: /login)
 */
export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    // User is authenticated but doesn't have permission
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          padding: '20px',
        }}
      >
        <h1 style={{ fontSize: '48px', margin: '0 0 20px 0', color: '#d32f2f' }}>
          403
        </h1>
        <h2 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>Access Denied</h2>
        <p style={{ fontSize: '16px', color: '#666', textAlign: 'center' }}>
          You don't have permission to access this page.
        </p>
        <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
          Required role: {allowedRoles.join(' or ')} | Your role: {user.role}
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  // User is authenticated and has required role
  return <>{children}</>;
};
