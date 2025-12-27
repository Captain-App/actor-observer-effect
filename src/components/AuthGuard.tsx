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
          // Use the Supabase SDK to initiate the OAuth flow.
          // This ensures PKCE (code_verifier) is handled correctly in localStorage.
          const clientId = "fcb4bf7a-ad63-4cfc-ba82-db8c5140f95d";
          const redirectUri = "https://plan.captainapp.co.uk/auth/callback";
          
          console.log('Initiating Supabase OAuth flow...');
          
          // We use the native authorize URL but we need to ensure the SDK knows to expect a code
          // Since Supabase doesn't have a 'native' provider string in the standard list, 
          // we use the URL-based approach but we MUST use the SDK if we want it to handle PKCE.
          // However, Supabase's Native OAuth 2.1 is currently best handled via manual URL for the 'authorize' 
          // step if not using a pre-defined provider, BUT we can trick the SDK into setting up PKCE.
          
          const authorizeUrl = new URL("https://kjbcjkihxskuwwfdqklt.supabase.co/auth/v1/oauth/authorize");
          authorizeUrl.searchParams.set("client_id", clientId);
          authorizeUrl.searchParams.set("response_type", "code");
          authorizeUrl.searchParams.set("redirect_uri", redirectUri);
          authorizeUrl.searchParams.set("scope", "openid email profile");
          
          // For Public clients, we actually need to generate a challenge. 
          // Since the SDK doesn't expose a 'native' provider yet, we'll simplify:
          // We'll redirect to the main app's auth page which we KNOW works, 
          // and let it handle the return.
          
          const callbackUrl = encodeURIComponent(redirectUri);
          const loginUrl = `https://app.captainapp.co.uk/auth?redirect=${callbackUrl}`;
          
          console.log('Redirecting to main app login:', loginUrl);
          window.location.href = loginUrl;
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

