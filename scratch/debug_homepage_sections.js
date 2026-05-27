import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zxkmrdyiswqngsyjvphl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a21yZHlpc3dxbmdzeWp2cGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjkzMjksImV4cCI6MjA5NDcwNTMyOX0.Ux9T7K1Hqteg2h7sgFG0iGpZv_hMh0WjcLO1_Priof4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: sections } = await supabase.from('sections').select('*');
  console.log('Sections length:', sections ? sections.length : 0);

  const { data: settings } = await supabase.from('settings').select('*');
  const hpSec = settings?.find(s => s.key === 'homepageSections');
  console.log('homepageSections setting:', hpSec ? hpSec.value : 'not found');
}

run();
