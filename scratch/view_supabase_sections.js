import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zxkmrdyiswqngsyjvphl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a21yZHlpc3dxbmdzeWp2cGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjkzMjksImV4cCI6MjA5NDcwNTMyOX0.Ux9T7K1Hqteg2h7sgFG0iGpZv_hMh0WjcLO1_Priof4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function viewSupabaseSections() {
  try {
    const { data, error } = await supabase.from('sections').select('*');
    if (error) {
      console.error('Supabase Error:', error);
    } else {
      console.log('--- SUPABASE SECTIONS ---');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

viewSupabaseSections();
