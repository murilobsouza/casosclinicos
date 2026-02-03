
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    // Tenta process.env padrão e também o injetado via window
    const env = (typeof process !== 'undefined' && process.env) 
      ? process.env 
      : (window as any).process?.env || {};
      
    return env[key] || "";
  } catch (e) {
    return "";
  }
};

// Usamos os nomes padrão SUPABASE_URL e SUPABASE_ANON_KEY
const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Verifica se as chaves são válidas
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  !supabaseUrl.includes('placeholder-project');

const validUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const validKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

if (!isSupabaseConfigured) {
  console.warn("⚠️ Supabase não detectado. Os dados serão salvos localmente no navegador (Modo Offline).");
} else {
  console.log("🚀 Supabase conectado com sucesso.");
}

export const supabase = createClient(validUrl, validKey);
