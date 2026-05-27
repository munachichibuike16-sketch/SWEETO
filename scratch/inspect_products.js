import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';

const supabaseUrl = 'https://zxkmrdyiswqngsyjvphl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a21yZHlpc3dxbmdzeWp2cGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjkzMjksImV4cCI6MjA5NDcwNTMyOX0.Ux9T7K1Hqteg2h7sgFG0iGpZv_hMh0WjcLO1_Priof4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('=== PRODUCTS IN SUPABASE ===');
  const { data: prodData, error } = await supabase.from('products').select('id, name, image_url, images');
  if (error) {
    console.error('Error fetching Supabase products:', error);
  } else {
    prodData.forEach(p => {
      console.log(`- [${p.id}] ${p.name}`);
      console.log(`  Image URL: ${p.image_url}`);
      console.log(`  Images: ${p.images}`);
    });
  }

  console.log('\n=== PRODUCTS IN SQLITE ===');
  try {
    const db = new Database('shop.db');
    const rows = db.prepare('SELECT id, name, image_url, additional_images FROM products').all();
    rows.forEach(p => {
      console.log(`- [${p.id}] ${p.name}`);
      console.log(`  Image URL: ${p.image_url}`);
      console.log(`  Additional Images: ${p.additional_images}`);
    });
  } catch (err) {
    console.error('Error fetching SQLite products:', err.message);
  }
}

run();
