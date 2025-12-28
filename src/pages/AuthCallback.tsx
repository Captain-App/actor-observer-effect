import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('AuthCallback: Starting secure recovery handler');
        
        // 1. Capture tokens from hash
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        // 2. IMMEDIATELY WIPE HASH FROM URL & HISTORY to prevent referer leakage
        if (accessToken) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          
          console.log('AuthCallback: Session tokens detected in hash. Bridging...');
          const { data, error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (setError) {
            console.error('AuthCallback: Manual setSession failed:', setError);
            throw setError;
          }
          
          // 3. STRICTLY LIMIT TO SECURE COOKIES
          // Production uses Domain Cookies which are much more secure against XSS.
          if (data.session) {
            const storageKey = 'captainapp-sso-v1';
            const encodedValue = encodeURIComponent(JSON.stringify(data.session));
            const domain = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
              ? ''
              : '; domain=.captainapp.co.uk';
            document.cookie = `${storageKey}=${encodedValue}${domain}; path=/; max-age=31536000; SameSite=Lax; Secure`;
            console.log('AuthCallback: Session persisted to cookies.');
          }
        } else {
          console.log('AuthCallback: No tokens in hash, attempting standard exchange...');
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) throw exchangeError;
          }
        }
        
        // Brief wait for session propagation
        await new Promise(resolve => setTimeout(resolve, 300));
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('Authentication failed. No secure session could be established.');
        }
        
        console.log('AuthCallback: Handshake complete! Redirecting home...');
        window.location.replace('/');
      } catch (err: any) {
        console.error('AuthCallback Critical Error:', err);
        setError(err.message || 'Authentication failed');
      }
    };

    handleCallback();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-red-500 text-5xl font-bold">!</div>
          <h1 className="text-2xl font-bold">Authentication Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={() => window.location.replace('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Finalizing secure connection...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
