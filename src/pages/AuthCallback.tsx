import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('AuthCallback: Processing callback...', window.location.href);
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        
        if (code) {
          console.log('AuthCallback: Code found, exchanging for session...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('AuthCallback: Exchange error:', exchangeError);
            throw exchangeError;
          }
          console.log('AuthCallback: Exchange successful');
        } else {
          console.log('AuthCallback: No code in URL, checking for existing session...');
        }
        
        // Wait a small moment for the shared cookie to be recognized by the SDK
        console.log('AuthCallback: Cooling down for 1s...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('AuthCallback: Final session check...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthCallback: Session error:', sessionError);
          throw sessionError;
        }
        
        if (!session) {
          console.log('AuthCallback: No session found after exchange/check. Shared cookies might be blocked or missing.');
          const cookies = document.cookie;
          console.log('AuthCallback: Current document.cookie:', cookies.substring(0, 50) + '...');
          
          setError('No session found. Please ensure cookies are enabled.');
          return;
        }
        
        console.log('AuthCallback: Success! User:', session.user.id, 'Redirecting to home...');
        window.location.replace('/');
      } catch (err: any) {
        console.error('AuthCallback: Unexpected error:', err);
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

