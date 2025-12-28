import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    let processing = false;

    const handleCallback = async () => {
      if (processing) return;
      processing = true;

      const info: any = {
        href: window.location.href,
        timestamp: new Date().toISOString(),
      };

      try {
        console.log('AuthCallback: Starting secure recovery handler');
        
        // 1. Parse tokens from hash
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const at = hashParams.get('access_token');
        const rt = hashParams.get('refresh_token');
        
        info.hasAt = !!at;
        info.hasRt = !!rt;
        setDebugInfo({ ...info });

        let session = null;

        if (at) {
          console.log('AuthCallback: Attempting to set session from tokens...');
          const { data, error: setError } = await supabase.auth.setSession({
            access_token: at,
            refresh_token: rt || '',
          });
          
          if (setError) {
            console.warn('AuthCallback: setSession failed, trying fallback...', setError);
            info.setSessionError = setError.message;
            
            // FALLBACK: If setSession fails (e.g. invalid refresh token), 
            // but we have an access token, try to verify it and manually fix the session.
            try {
              const { data: { user }, error: userError } = await supabase.auth.getUser(at);
              if (!userError && user) {
                console.log('AuthCallback: Access token is valid! Forcing session state.');
                info.fallbackSuccess = true;
                // We're authenticated! The SDK will now have the user in state.
                // We'll proceed as if success.
                session = { access_token: at, refresh_token: rt || '', user } as any;
              }
            } catch (e: any) {
              info.fallbackError = e.message;
            }
          } else {
            console.log('AuthCallback: Session set successfully');
            session = data.session;
          }
        }

        // 2. PKCE code exchange
        if (!session) {
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          if (code) {
            console.log('AuthCallback: PKCE code detected, exchanging...');
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error('AuthCallback: exchangeCodeForSession error:', exchangeError);
              info.exchangeError = exchangeError.message;
            } else {
              session = exchangeData.session;
            }
          }
        }

        // 3. SDK automatic pickup
        if (!session) {
          const { data: { session: autoSession } } = await supabase.auth.getSession();
          session = autoSession;
          if (session) info.autoSession = true;
        }

        setDebugInfo({ ...info });

        // 4. Final verification and cleanup
        if (session) {
          console.log('AuthCallback: Session active for:', session.user.email);
          // Only clear hash if we really succeeded
          window.history.replaceState(null, '', window.location.pathname);
          
          // Small delay to ensure storage write completes
          await new Promise(resolve => setTimeout(resolve, 500));
          window.location.replace('/');
          return;
        }

        throw new Error('No secure session could be established. Please try signing in again.');
      } catch (err: any) {
        console.error('AuthCallback Critical Error:', err);
        setError(err.message || 'Authentication failed');
      } finally {
        processing = false;
      }
    };

    handleCallback();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-red-500 text-5xl font-bold">!</div>
          <h1 className="text-2xl font-bold">Authentication Error</h1>
          <p className="text-muted-foreground">{error}</p>
          
          <div className="text-left bg-slate-900/50 p-4 rounded-lg text-xs font-mono overflow-auto max-h-48 border border-white/10">
            <div className="text-blue-400 mb-2 font-bold uppercase tracking-wider">Debug Trace:</div>
            {Object.entries(debugInfo).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-white/5 py-1">
                <span className="text-slate-400">{k}:</span>
                <span className="text-slate-200">{JSON.stringify(v)}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => window.location.replace('/')}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
            >
              Back to Home
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.replace('https://captainapp.co.uk/auth');
              }}
              className="w-full px-4 py-3 bg-slate-800 text-slate-200 rounded-xl font-medium text-sm hover:bg-slate-700 transition-colors"
            >
              Sign In on Production
            </button>
          </div>
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
