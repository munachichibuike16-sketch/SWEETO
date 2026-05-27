import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Attempting to register quoted email in Supabase Auth...');
  const { data, error } = await supabase.auth.signUp({
    email: '"admin@sweetohub.com"',
    password: 'admin123'
  });

  if (error) {
    console.error('Registration Error:', error.message);
  } else {
    console.log('Registration Response:', JSON.stringify(data, null, 2));
  }
}

run();
