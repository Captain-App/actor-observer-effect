import { createClient } from '@supabase/supabase-js';

// EXACT SAME CREDENTIALS AS MAIN APP - DO NOT CHANGE
const SUPABASE_URL = "https://kjbcjkihxskuwwfdqklt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqYmNqa2loeHNrdXd3ZmRxa2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDU2OTAsImV4cCI6MjA2NjI4MTY5MH0.V9e7XsuTlTOLqefOIedTqlBiTxUSn4O5FZSPWwAxiSI";

// Custom storage to share session across subdomains using a root domain cookie
const cookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    
    const name = key + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) == 0) {
        return decodeURIComponent(c.substring(name.length, c.length));
      }
    }
    
    // Fallback to localStorage
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;

    const encodedValue = encodeURIComponent(value);
    // Set cookie on the root domain so it's shared across all subdomains
    const domain = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? ''
      : '; domain=.captainapp.co.uk';
    document.cookie = `${key}=${encodedValue}${domain}; path=/; max-age=31536000; SameSite=Lax; Secure`;
    
    // Backup to localStorage for non-sensitive apps that don't support cookies well
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;

    const domain = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? ''
      : '; domain=.captainapp.co.uk';
    document.cookie = `${key}=; ${domain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax; Secure`;
    localStorage.removeItem(key);
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
