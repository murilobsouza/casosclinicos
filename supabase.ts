import { createClient } from "@supabase/supabase-js";

const getEnv = (key: string): string => {
  // 1) Vite (browser/build) -> import.meta.env
  try {
    // import.meta existe em Vite; em outros ambientes pode não existir
    // @ts-ignore
    const v = typeof import.meta !== "undefined" ? import.meta.env?.[key] : undefined;
    if (typeof v === "string" && v.length > 0) return v;
  } catch (e) {}

  // 2) Fallback opcional: Node (caso algum build/runtime use process.env)
  try {
    // @ts-ignore
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}

  return "";
};

const supabaseUrl = getEnv("VITE_SUPABASE_URL");
const supabaseAnonKey = getEnv("VITE_SUPABASE_ANON_KEY");

// Verifica se as chaves são válidas (não vazias e não placeholders)
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes("placeholder-project") &&
  !supabaseAnonKey.includes("placeholder");

const validUrl = supabaseUrl || "https://placeholder-project.supabase.co";
const validKey = supabaseAnonKey || "placeholder-key";

if (!isSupabaseConfigured) {
  console.warn("Supabase não configurado. O aplicativo operará em modo 'Local Storage'.");
}

export const supabase = createClient(validUrl, validKey);

