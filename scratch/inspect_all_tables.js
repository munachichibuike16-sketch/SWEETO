import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zxkmrdyiswqngsyjvphl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a21yZHlpc3dxbmdzeWp2cGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjkzMjksImV4cCI6MjA5NDcwNTMyOX0.Ux9T7K1Hqteg2h7sgFG0iGpZv_hMh0WjcLO1_Priof4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName, columns) {
  console.log(`\n=== CHECKING TABLE: ${tableName} ===`);
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) {
    console.error(`Error fetching ${tableName}:`, error.message);
    return;
  }
  
  let foundLocal = false;
  data.forEach(row => {
    columns.forEach(col => {
      const val = row[col];
      if (typeof val === 'string' && (val.includes('/uploads/') || val.startsWith('/uploads'))) {
        console.log(`- Row ID: ${row.id || row.key || 'unknown'} | Column: ${col}`);
        console.log(`  Value: ${val}`);
        foundLocal = true;
      } else if (typeof val === 'string' && val.startsWith('{')) {
        // Try parsing JSON if applicable (e.g. images array)
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              if (typeof item === 'string' && (item.includes('/uploads/') || item.startsWith('/uploads'))) {
                console.log(`- Row ID: ${row.id || 'unknown'} | Column: ${col} (JSON array)`);
                console.log(`  Contains local URL: ${item}`);
                foundLocal = true;
              }
            });
          }
        } catch (e) {}
      }
    });
  });
  if (!foundLocal) {
    console.log('No local /uploads/ paths found.');
  }
}

async function run() {
  await checkTable('products', ['image_url', 'images']);
  await checkTable('categories', ['image_url', 'icon']);
  await checkTable('brands', ['logo_url', 'logo']);
  await checkTable('video_ads', ['video_url', 'image_url']);
  await checkTable('sections', ['header_image', 'header_image_b']);
}

run();
