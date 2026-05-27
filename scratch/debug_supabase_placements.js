import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zxkmrdyiswqngsyjvphl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a21yZHlpc3dxbmdzeWp2cGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjkzMjksImV4cCI6MjA5NDcwNTMyOX0.Ux9T7K1Hqteg2h7sgFG0iGpZv_hMh0WjcLO1_Priof4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: prodData } = await supabase.from('products').select('id, name, placements, category');
  if (prodData) {
    prodData.forEach(p => {
      if (p.placements && p.placements.includes('25')) {
        console.log(`Product: ${p.name}, Category: ${p.category}, Placements: ${p.placements}`);
      }
    });
  }
}

run();
