
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.0';

// Helper para acessar variáveis de ambiente de forma segura
const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    // Use process.env directly which is the standard way to access env vars in many build environments.
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Se as chaves não existirem, usamos placeholders para evitar o erro "is required" 
// que trava o carregamento do app. As chamadas de rede falharão, mas o app renderizará.
const validUrl = supabaseUrl || 'https://placeholder-project.supabase.co';
const validKey = supabaseAnonKey || 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase Error: SUPABASE_URL ou SUPABASE_ANON_KEY não configurados nas variáveis de ambiente.");
}

export const supabase = createClient(validUrl, validKey);
