import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://app.captainapp.co.uk";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ZGM4Nzg3OTEtNTViYi00ZGRmLWFjNDktMjA0ZTYzMjI5Y2RhOmZjYjRiZjdhLWFkNjMtNGNmYy1iYTgyLWRiOGM1MTQwZjk1ZA==";

// Custom storage to share session across subdomains using a root domain cookie
const cookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    
    // On localhost, fallback to standard localStorage for easier development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return localStorage.getItem(key);
    }

    const name = key + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) == 0) {
        return decodeURIComponent(c.substring(name.length, c.length));
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
    // Use the exact key that the main app is using to ensure they share the same cookie
    storageKey: 'sb-kjbcjkihxskuwwfdqklt-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
