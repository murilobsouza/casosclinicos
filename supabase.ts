
import { createClient } from '@supabase/supabase-js';

// Access environment variables using process.env to resolve TypeScript errors related to ImportMeta.
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qmbpafyvpjziiudahmlx.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dcNQd8zJwIzV5WzTFR41TQ_pX4kyeA8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


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
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

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
