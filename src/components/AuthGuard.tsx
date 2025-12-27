import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Don't check auth if we're on the callback page
      if (window.location.pathname === '/auth/callback') {
        setLoading(false);
        return;
      }

      try {
        console.log('AuthGuard: Checking session...');
        console.log('AuthGuard: All visible cookies:', document.cookie.substring(0, 100) + '...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthGuard: Session error:', sessionError);
        }

        if (session) {
          console.log('AuthGuard: Session found for user:', session.user.id);
          setIsAuthenticated(true);
          setLoading(false);
        } else {
          console.log('AuthGuard: No session found. Current path:', window.location.pathname);
          const loginDomain = "https://captainapp.co.uk";
          const redirectUri = "https://plan.captainapp.co.uk/auth/callback";
          const loginUrl = `${loginDomain}/auth?redirect=${encodeURIComponent(redirectUri)}`;
          console.log('AuthGuard: Redirecting to:', loginUrl);
          
          // Before redirecting, check if we're in a potential loop
          const params = new URLSearchParams(window.location.search);
          const loopCount = parseInt(params.get('loop') || '0');
          if (loopCount > 3) {
            console.error('AuthGuard: Potential redirect loop detected. Stopping.');
            setLoading(false);
            return;
          }
          
          window.location.href = `${loginUrl}${loginUrl.includes('?') ? '&' : '?'}loop=${loopCount + 1}`;
        }
      } catch (error) {
        console.error('AuthGuard: Error checking auth:', error);
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthGuard: Auth state changed:', event, session ? 'Session active' : 'No session');
      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirection is handled in useEffect
  }

  return <>{children}</>;
};

export default AuthGuard;

