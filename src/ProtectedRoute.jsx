import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000";

export const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        setIsLoading(true);
        
        // Use session token stored in localStorage to fetch JWT from DB and verify
        const sessionToken = localStorage.getItem('sessionToken');
        
        if (!sessionToken) {
          setIsAuthenticated(false);
          setIsLoading(false);
          navigate('/');
          return;
        }

        // Call verify endpoint with session token
        const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
          method: 'GET',
          headers: {
            'x-session-token': sessionToken,
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies if present
        });

        const data = await res.json();

        if (res.ok && data.ok && data.admin) {
          // Check if user has admin role
          if (data.admin.role === 'admin') {
            setIsAuthenticated(true);
          } else {
            // User is authenticated but not admin
            setIsAuthenticated(false);
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('accessToken');
            navigate('/');
          }
        } else {
          // Not authenticated or invalid token
          setIsAuthenticated(false);
          localStorage.removeItem('sessionToken');
          localStorage.removeItem('accessToken');
          navigate('/');
        }
      } catch (err) {
        console.error('[ProtectedRoute] Verification error:', err);
        setIsAuthenticated(false);
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('accessToken');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [navigate]);

  // Show loading state while verifying
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
          <p className="text-sm text-slate-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated and admin
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return children;
};