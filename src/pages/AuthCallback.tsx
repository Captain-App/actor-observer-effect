import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      const info: any = {
        href: window.location.href,
        timestamp: new Date().toISOString(),
      };

      try {
        console.log('AuthCallback: Starting secure recovery handler');
        
        // 1. Check for existing session first
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          console.log('AuthCallback: Found existing session');
          info.existingSession = true;
          handleFinalRedirect(existingSession, info);
          return;
        }

        // 2. Parse tokens from hash (Implicit flow)
        const hash = window.location.hash.substring(1);
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          const at = hashParams.get('access_token');
          const rt = hashParams.get('refresh_token');
          
          if (at) {
            console.log('AuthCallback: Attempting to set session from hash tokens...');
            info.hasHash = true;
            const { data, error: setError } = await supabase.auth.setSession({
              access_token: at,
              refresh_token: rt || '',
            });
            
            if (!setError && data.session) {
              handleFinalRedirect(data.session, info);
              return;
            }
          }
        }

        // 3. PKCE code exchange
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          console.log('AuthCallback: PKCE code detected, exchanging...');
          info.hasCode = true;
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('AuthCallback: exchangeCodeForSession error:', exchangeError);
            info.exchangeError = exchangeError.message;
            
            // One last check
            const { data: { session: lastChanceSession } } = await supabase.auth.getSession();
            if (lastChanceSession) {
              handleFinalRedirect(lastChanceSession, info);
              return;
            }
            throw exchangeError;
          }
          
          if (exchangeData.session) {
            handleFinalRedirect(exchangeData.session, info);
            return;
          }
        }

        // No session Establishing - fallback to root
        console.log('AuthCallback: No session could be established');
        window.location.replace('/');

      } catch (err: any) {
        console.error('AuthCallback Critical Error:', err);
        if (mounted) {
          setStatus('error');
          setError(err.message || 'Authentication failed');
          setDebugInfo(info);
        }
      }
    };

    const handleFinalRedirect = async (session: any, info: any) => {
      if (!mounted) return;
      console.log('AuthCallback: Session active for:', session.user?.email);
      setStatus('success');
      
      // Clear URL
      window.history.replaceState(null, '', window.location.pathname);
      
      // Small delay to ensure storage write completes
      setTimeout(() => {
        window.location.replace('/');
      }, 500);
    };

    handleCallback();
    return () => { mounted = false; };
  }, []);

  if (status === 'error') {
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
                <span className="text-slate-200 text-right break-all ml-4">{String(v)}</span>
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
              Try Global Login
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
