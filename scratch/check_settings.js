import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read and parse .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('key', 'vapid_public_key');
  
  if (error) {
    console.error('Error fetching VAPID setting:', error);
  } else {
    console.log('VAPID Setting in Supabase:', JSON.stringify(data, null, 2));
  }
}

check();
