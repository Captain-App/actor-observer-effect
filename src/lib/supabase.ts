import { createClient } from '@supabase/supabase-js';

// USING THE EXACT SAME CREDENTIALS AS THE MAIN APP
const SUPABASE_URL = "https://kjbcjkihxskuwwfdqklt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYmNqa2loeHNrdXd3ZmRxa2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDU2OTAsImV4cCI6MjA2NjI4MTY5MH0.V9e7XsuTlTOLqefOIedTqlBiTxUSn4O5FZSPWwAxiSI";

// Custom storage to share session across subdomains using a root domain cookie
const cookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    
    // On localhost, fallback to standard localStorage for easier development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const val = localStorage.getItem(key);
      return val;
    }

    const name = key + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) == 0) {
        const value = decodeURIComponent(c.substring(name.length, c.length));
        return value;
      }
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      localStorage.setItem(key, value);
      return;
    }

    const encodedValue = encodeURIComponent(value);
    // Set cookie on the root domain so it's shared across all subdomains
    document.cookie = `${key}=${encodedValue}; domain=.captainapp.co.uk; path=/; max-age=31536000; SameSite=Lax; Secure`;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      localStorage.removeItem(key);
      return;
    }

    document.cookie = `${key}=; domain=.captainapp.co.uk; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax; Secure`;
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: cookieStorage,
    storageKey: 'sb-kjbcjkihxskuwwfdqklt-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
