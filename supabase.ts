
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.0';

const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Verifica se as chaves são válidas (não vazias e não placeholders)
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  !supabaseUrl.includes('placeholder-project');

const validUrl = supabaseUrl || 'https://placeholder-project.supabase.co';
const validKey = supabaseAnonKey || 'placeholder-key';

if (!isSupabaseConfigured) {
  console.warn("Supabase não configurado. O aplicativo operará em modo 'Local Storage'.");
}

export const supabase = createClient(validUrl, validKey);
