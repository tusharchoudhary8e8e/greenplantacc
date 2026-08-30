import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { secureStorage } from '../app/utils/secureStorage';

export const DEFAULT_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || "";
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

function getInitialConfig() {
  const customUrl = secureStorage.getItem<string | null>("custom_supabase_url", null);
  const customKey = secureStorage.getItem<string | null>("custom_supabase_key", null);
  if (customUrl && customKey) {
    return { url: customUrl, key: customKey, isCustom: true };
  }
  return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_PUBLISHABLE_KEY, isCustom: false };
}

let currentConfig = getInitialConfig();
export let supabase: SupabaseClient = createClient(currentConfig.url, currentConfig.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function getSupabaseConfig() {
  return currentConfig;
}

export function updateCustomSupabaseConfig(url: string, key: string) {
  secureStorage.setItem("custom_supabase_url", url);
  secureStorage.setItem("custom_supabase_key", key);
  currentConfig = { url, key, isCustom: true };
  supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return supabase;
}

export function resetSupabaseConfig() {
  secureStorage.removeItem("custom_supabase_url");
  secureStorage.removeItem("custom_supabase_key");
  currentConfig = { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_PUBLISHABLE_KEY, isCustom: false };
  supabase = createClient(currentConfig.url, currentConfig.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return supabase;
}

// ─── Auth Helper Functions ───────────────────────────────────────────────────

export async function signUpUser(email: string, pass: string, options?: { data?: Record<string, any> }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options,
  });
  if (error) throw error;
  return data;
}

export async function updateUserMetadata(metadata: Record<string, any>) {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });
  if (error) throw error;
  return data;
}

export async function signInUser(email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Sign out warning:", error);
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

export function onAuthStateChange(callback: (user: User | null, session: Session | null, event?: string) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null, session, event);
  });
}

