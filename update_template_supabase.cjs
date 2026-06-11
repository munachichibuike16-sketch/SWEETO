const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://zxkmrdyiswqngsyjvphl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a21yZHlpc3dxbmdzeWp2cGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjkzMjksImV4cCI6MjA5NDcwNTMyOX0.Ux9T7K1Hqteg2h7sgFG0iGpZv_hMh0WjcLO1_Priof4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('Updating active_template to chilling on Supabase...');
  const { data, error } = await supabase
    .from('settings')
    .upsert({ key: 'active_template', value: 'chilling' }, { onConflict: 'key' })
    .select();
    
  if (error) {
    console.error('Error updating setting:', error);
  } else {
    console.log('Update result:', data);
  }
}

run();
