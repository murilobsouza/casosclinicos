import { createClient } from "@supabase/supabase-js";

const getEnv = (key: string): string => {
  // 1) Vite (frontend)
  try {
    // @ts-ignore
    const v = (import.meta as any)?.env?.[key];
    if (typeof v === "string" && v.length > 0) return v;
  } catch (e) {}

  // 2) Node (build/server) - fallback
  try {
    // @ts-ignore
    const v = (globalThis as any)?.process?.env?.[key];
    if (typeof v === "string" && v.length > 0) return v;
  } catch (e) {}

  return "";
};

const supabaseUrl = getEnv("VITE_SUPABASE_URL");
const supabaseAnonKey = getEnv("VITE_SUPABASE_ANON_KEY");

// Verifica se as chaves são válidas (não vazias e não placeholders)
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes("placeholder-project");

const validUrl = supabaseUrl || "https://placeholder-project.supabase.co";
const validKey = supabaseAnonKey || "placeholder-key";

if (!isSupabaseConfigured) {
  console.warn("Supabase não configurado. O aplicativo operará em modo 'Local Storage'.");
}

export const supabase = createClient(validUrl, validKey);
