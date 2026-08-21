import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getEnvVar(key: string): string | undefined {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return undefined;
}

export const SUPABASE_URL =
  getEnvVar("VITE_SUPABASE_URL") || getEnvVar("SUPABASE_URL") || "";
export const SUPABASE_ANON_KEY =
  getEnvVar("VITE_SUPABASE_ANON_KEY") || getEnvVar("SUPABASE_ANON_KEY") || "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL !== "https://your-project.supabase.co",
);

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
}

export const supabase = client;
