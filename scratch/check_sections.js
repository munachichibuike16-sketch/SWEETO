import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://zxkmrdyiswqngsyjvphl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a21yZHlpc3dxbmdzeWp2cGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjkzMjksImV4cCI6MjA5NDcwNTMyOX0.Ux9T7K1Hqteg2h7sgFG0iGpZv_hMh0WjcLO1_Priof4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSections() {
  try {
    const { data, error } = await supabase.from('sections').select('*').limit(1);
    if (error) {
      fs.writeFileSync('scratch/output.txt', 'Supabase Error: ' + JSON.stringify(error, null, 2));
    } else {
      fs.writeFileSync('scratch/output.txt', 'Success: ' + JSON.stringify(data, null, 2));
    }
  } catch (err) {
    fs.writeFileSync('scratch/output.txt', 'JS Error: ' + err.stack);
  }
}

checkSections();
