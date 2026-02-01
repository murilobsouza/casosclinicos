import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export const supabaseUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL as string | undefined;
export const supabaseAnonKey = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes("placeholder-project") &&
  !supabaseAnonKey.includes("placeholder");

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    // Não derruba deploy: apenas avisa quando alguém tentar usar.
    console.warn("Supabase não configurado. Operando sem Supabase.");
    return null;
  }

  if (!_client) {
    _client = createClient(supabaseUrl!, supabaseAnonKey!);
  }
  return _client;
}
