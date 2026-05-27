import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('settings').select('key, value');
  if (error) {
    console.error('Error fetching settings:', error);
  } else {
    console.log('All settings keys in Supabase:');
    data.forEach(item => {
      console.log(`- ${item.key}: ${item.value ? (item.value.length > 50 ? item.value.substring(0, 50) + '...' : item.value) : 'null'}`);
    });
    
    const adminEmailSetting = data.find(item => item.key === 'admin_email');
    console.log('\n--- Admin Email Check ---');
    console.log('admin_email exists:', !!adminEmailSetting);
    if (adminEmailSetting) {
      console.log('admin_email value:', adminEmailSetting.value);
    }
  }
}

run();
