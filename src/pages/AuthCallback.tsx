import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('AuthCallback: Processing callback...');
        const params = new URLSearchParams(window.location.search);
        
        // Look for 'access_token' in hash or 'code' in query
        const code = params.get('code');
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (code) {
          console.log('AuthCallback: Exchanging code for session...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (accessToken) {
          console.log('AuthCallback: Session found in hash fragment. Setting session...');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken && refreshToken) {
            const { error: setError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setError) throw setError;
          }
        } else {
          console.log('AuthCallback: Checking for existing session...');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (!session) throw new Error('No session found. Please try logging in again.');
        }
        
        console.log('AuthCallback: Success! Redirecting to home...');
        window.location.replace('/');
      } catch (err: any) {
        console.error('Error during auth callback:', err);
        setError(err.message || 'An unexpected error occurred.');
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

