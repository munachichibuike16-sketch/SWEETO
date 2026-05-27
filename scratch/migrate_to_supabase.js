import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env manually
const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const db = new Database('shop.db');
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  console.log('🚀 Starting Data Migration to Supabase...');

  // 1. MIGERATE SECTIONS
  try {
    const localSections = db.prepare('SELECT * FROM sections').all();
    if (localSections.length > 0) {
      console.log(`Found ${localSections.length} sections to migrate...`);
      const mappedSections = localSections.map(s => ({
        key: s.role || `section_${s.id}`,
        title: s.title,
        subtitle: s.subtitle,
        position: s.position,
        is_active: s.isActive || 1,
        titleb: s.titleB,
        subtitleb: s.subtitleB,
        categoryb: s.categoryB,
        roleb: s.roleB,
        headerstyleb: s.headerStyleB,
        headerimageb: s.headerImageB
      }));

      // Deduplicate sections by key to prevent Supabase ON CONFLICT errors
      const uniqueSectionsMap = new Map();
      mappedSections.forEach(s => uniqueSectionsMap.set(s.key, s));
      const uniqueSections = Array.from(uniqueSectionsMap.values());

      const { error } = await supabase.from('sections').upsert(uniqueSections, { onConflict: 'key' });
      if (error) console.error('❌ Sections migration error:', error.message);
      else console.log('✅ Sections migrated successfully!');
    }
  } catch (e) {
    console.log('Skipping sections (table might not exist in SQLite)');
  }

  // 2. MIGRATE PRODUCTS
  try {
    const localProducts = db.prepare('SELECT * FROM products').all();
    if (localProducts.length > 0) {
      console.log(`Found ${localProducts.length} products to migrate...`);
      const mappedProducts = localProducts.map(p => {
        // Build slug from name
        const slug = p.name ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4) : `product-${p.id}`;
        
        return {
          name: p.name,
          slug: slug,
          description: p.description,
          price: p.price || 0,
          original_price: p.original_price || null,
          cost_price: p.bought_price || null,
          stock_quantity: p.stock || 0,
          is_active: p.status === 'active' ? 1 : 0,
          is_featured: p.is_featured || 0,
          is_deal: p.is_daily_deal || 0,
          image_url: p.image_url,
          images: p.additional_images || '[]',
          category: p.category,
          condition: p.condition || 'new',
          placements: p.placements || '[]'
        };
      });

      const { error } = await supabase.from('products').upsert(mappedProducts, { onConflict: 'slug' });
      if (error) console.error('❌ Products migration error:', error.message);
      else console.log('✅ Products migrated successfully!');
    }
  } catch (e) {
    console.log('Skipping products (table might not exist in SQLite)');
  }

  console.log('🎉 Migration Complete! Your local data is now in Supabase!');
}

migrateData();
