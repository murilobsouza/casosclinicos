
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    const env = (window as any).process?.env || {};
    return env[key] || "";
  } catch (e) {
    return "";
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  !supabaseUrl.includes('placeholder-project');

const validUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const validKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

if (!isSupabaseConfigured) {
  console.log("Supabase não configurado. Usando LocalStorage.");
}

export const supabase = createClient(validUrl, validKey);
