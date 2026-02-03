
import { createClient } from '@supabase/supabase-js';

// Access environment variables using process.env to resolve TypeScript errors related to ImportMeta.
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qmbpafyvpjziiudahmlx.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dcNQd8zJwIzV5WzTFR41TQ_pX4kyeA8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


