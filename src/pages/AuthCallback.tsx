import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('AuthCallback: Processing callback URL:', window.location.href);
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        
        // Check for session tokens in the hash fragment (Session Bridge)
        const hash = window.location.hash.substring(1);
        console.log('AuthCallback: Hash fragment length:', hash.length);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          console.log('AuthCallback: Session found in hash fragment. Setting session...');
          const { data, error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (setError) {
            console.error('AuthCallback: setSession error:', setError);
            throw setError;
          }
          
          if (data.session) {
            console.log('AuthCallback: setSession successful. User ID:', data.session.user.id);
            // On localhost, we might need a manual setItem just in case the SDK storage is being finicky
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
              const storageKey = 'sb-kjbcjkihxskuwwfdqklt-auth-token';
              localStorage.setItem(storageKey, JSON.stringify(data.session));
              console.log('AuthCallback: Manually verified localStorage write');
            }
          }
        } else if (code) {
          console.log('AuthCallback: Code found in URL, exchanging for session...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('AuthCallback: exchangeCodeForSession error:', exchangeError);
            throw exchangeError;
          }
          console.log('AuthCallback: Exchange successful. User ID:', data.session?.user?.id);
        }
        
        // Brief wait for session propagation
        console.log('AuthCallback: Waiting 800ms for propagation...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        console.log('AuthCallback: Final session check...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthCallback: getSession error:', sessionError);
          throw sessionError;
        }
        
        if (!session) {
          console.error('AuthCallback: No session found after processing.');
          // Try one last thing: check if it's in localStorage manually
          const storageKey = 'sb-kjbcjkihxskuwwfdqklt-auth-token';
          const localSession = localStorage.getItem(storageKey);
          if (localSession) {
            console.log('AuthCallback: Found session in localStorage manually, trying to set it again');
            const parsed = JSON.parse(localSession);
            await supabase.auth.setSession(parsed);
            window.location.replace('/');
            return;
          }
          
          setError('Authentication failed. No session could be established.');
          return;
        }
        
        console.log('AuthCallback: Authentication successful! Redirecting home...');
        window.location.replace('/');
      } catch (err: any) {
        console.error('AuthCallback Unexpected Error:', err);
        setError(err.message || 'An unexpected error occurred during authentication.');
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
        <p className="text-sm font-medium">Completing sign-in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

