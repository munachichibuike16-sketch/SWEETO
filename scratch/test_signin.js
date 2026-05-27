import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

const combinations = [
  { email: 'sweeto@sweetohub.com', password: 'chibuike@256' },
  { email: 'admin@sweetohub.com', password: 'admin123' },
];

async function run() {
  console.log('Testing Supabase Auth combinations...');
  let successClient = null;
  let successEmail = '';

  for (const combo of combinations) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: combo.email,
        password: combo.password
      });

      if (error) {
        console.log(`❌ Failed: ${combo.email} / ${combo.password} - ${error.message}`);
      } else if (data?.session) {
        console.log(`✅ SUCCESS: Logged in as ${combo.email} / ${combo.password}!`);
        successClient = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
        // Set the session on the new client
        await successClient.auth.setSession(data.session);
        successEmail = combo.email;
        break;
      }
    } catch (err) {
      console.log(`💥 Error testing ${combo.email}: ${err.message}`);
    }
  }

  if (successClient) {
    console.log(`\nAttempting to insert 'admin_email' setting using the authenticated client for ${successEmail}...`);
    
    // Check if is_admin() works for this user
    const { data: testData, error: testError } = await successClient
      .from('settings')
      .upsert({ key: 'admin_email', value: successEmail }, { onConflict: 'key' });

    if (testError) {
      console.error('❌ Failed to insert admin_email setting:', testError.message);
    } else {
      console.log('✅ Successfully inserted/updated admin_email setting in Supabase settings table!');
    }
  } else {
    console.log('\n❌ No valid combinations could sign in.');
  }
}

run();
