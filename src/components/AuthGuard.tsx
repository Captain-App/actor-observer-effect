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
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setIsAuthenticated(true);
          setLoading(false);
        } else {
          // Use the new native Supabase OAuth flow (Public Client with PKCE)
          const clientId = "fcb4bf7a-ad63-4cfc-ba82-db8c5140f95d";
          const redirectUri = "https://plan.captainapp.co.uk/auth/callback";
          const scope = "openid email profile";
          
          // Construct the Supabase OAuth authorize URL
          const authorizeUrl = new URL("https://kjbcjkihxskuwwfdqklt.supabase.co/auth/v1/oauth/authorize");
          authorizeUrl.searchParams.set("client_id", clientId);
          authorizeUrl.searchParams.set("response_type", "code");
          authorizeUrl.searchParams.set("redirect_uri", redirectUri);
          authorizeUrl.searchParams.set("scope", scope);
          
          console.log('Redirecting to Supabase OAuth (Public Client):', authorizeUrl.toString());
          window.location.href = authorizeUrl.toString();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

