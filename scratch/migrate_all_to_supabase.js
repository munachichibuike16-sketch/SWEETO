import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env manually
const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const db = new Database('shop.db');
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateEverything() {
  console.log('🚀 Starting FULL Data Migration to Supabase...');

  // 1. Categories
  try {
    const categories = db.prepare('SELECT * FROM categories').all();
    if (categories.length > 0) {
      const mapped = categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon: c.image_url || null,
        description: c.description || null
      }));
      const { error } = await supabase.from('categories').upsert(mapped);
      if (error) console.error('❌ Categories error:', error.message);
      else console.log(`✅ Migrated ${categories.length} categories.`);
    }
  } catch (e) {
    console.log('Skipping categories:', e.message);
  }

  // 2. Brands
  try {
    const brands = db.prepare('SELECT * FROM brands').all();
    if (brands.length > 0) {
      const mapped = brands.map(b => ({
        id: b.id,
        name: b.name,
        slug: b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        logo: b.logo_url || null,
        description: b.description || null
      }));
      const { error } = await supabase.from('brands').upsert(mapped);
      if (error) console.error('❌ Brands error:', error.message);
      else console.log(`✅ Migrated ${brands.length} brands.`);
    }
  } catch (e) {
    console.log('Skipping brands:', e.message);
  }

  // 3. Settings
  try {
    const settings = db.prepare('SELECT * FROM settings').all();
    if (settings.length > 0) {
      const mapped = settings.map(s => ({
        key: s.key,
        value: s.value
      }));
      const { error } = await supabase.from('settings').upsert(mapped, { onConflict: 'key' });
      if (error) console.error('❌ Settings error:', error.message);
      else console.log(`✅ Migrated ${settings.length} settings.`);
    }
  } catch (e) {
    console.log('Skipping settings:', e.message);
  }

  // 4. Video Ads
  try {
    const ads = db.prepare('SELECT * FROM video_ads').all();
    if (ads.length > 0) {
      const mapped = ads.map(a => ({
        id: a.id,
        title: a.title,
        video_url: a.video_url,
        is_active: a.is_active || 1
      }));
      const { error } = await supabase.from('video_ads').upsert(mapped);
      if (error) console.error('❌ Video Ads error:', error.message);
      else console.log(`✅ Migrated ${ads.length} video ads.`);
    }
  } catch (e) {
    console.log('Skipping video ads:', e.message);
  }

  // 5. Sections
  try {
    const sections = db.prepare('SELECT * FROM sections').all();
    if (sections.length > 0) {
      const mapped = sections.map(s => ({
        key: s.role || `section_${s.id}`,
        title: s.title,
        subtitle: s.subtitle,
        position: s.position,
        is_active: s.isActive || 1,
        titleb: s.titleB || null,
        subtitleb: s.subtitleB || null,
        categoryb: s.categoryB || 'All',
        roleb: s.roleB || null,
        headerstyleb: s.headerStyleB || 'bold',
        headerimageb: s.headerImageB || null
      }));
      // Remove duplicates
      const unique = Array.from(new Map(mapped.map(item => [item.key, item])).values());
      const { error } = await supabase.from('sections').upsert(unique, { onConflict: 'key' });
      if (error) console.error('❌ Sections error:', error.message);
      else console.log(`✅ Migrated ${unique.length} sections.`);
    }
  } catch (e) {
    console.log('Skipping sections:', e.message);
  }

  // 6. Products
  try {
    const products = db.prepare('SELECT * FROM products').all();
    if (products.length > 0) {
      const mapped = products.map(p => {
        const slug = p.name ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4) : `product-${p.id}`;
        return {
          id: p.id,
          name: p.name,
          slug: p.slug || slug,
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
      const { error } = await supabase.from('products').upsert(mapped);
      if (error) console.error('❌ Products error:', error.message);
      else console.log(`✅ Migrated ${products.length} products.`);
    }
  } catch (e) {
    console.log('Skipping products:', e.message);
  }

  console.log('🎉 Full Migration Complete!');
}

migrateEverything();
