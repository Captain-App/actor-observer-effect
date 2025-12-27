import { createClient } from '@supabase/supabase-js';

// EXACT SAME CREDENTIALS AS MAIN APP - DO NOT CHANGE
const SUPABASE_URL = "https://kjbcjkihxskuwwfdqklt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYmNqa2loeHNrdXd3ZmRxa2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDU2OTAsImV4cCI6MjA2NjI4MTY5MH0.V9e7XsuTlTOLqefOIedTqlBiTxUSn4O5FZSPWwAxiSI";

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
    storageKey: 'captainapp-sso-v1', // Standardized key for all apps
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
