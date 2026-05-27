import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://zxkmrdyiswqngsyjvphl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a21yZHlpc3dxbmdzeWp2cGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjkzMjksImV4cCI6MjA5NDcwNTMyOX0.Ux9T7K1Hqteg2h7sgFG0iGpZv_hMh0WjcLO1_Priof4';
const supabase = createClient(supabaseUrl, supabaseKey);

const combinations = [
  { email: 'sweeto@sweetohub.com', password: 'chibuike@256' },
  { email: 'admin@sweetohub.com', password: 'admin123' },
];

async function run() {
  console.log('=== SIGNING IN TO SUPABASE ===');
  let authClient = null;
  let loggedInEmail = '';

  for (const combo of combinations) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: combo.email,
        password: combo.password
      });

      if (error) {
        console.log(`❌ Failed sign-in for ${combo.email}: ${error.message}`);
      } else if (data?.session) {
        console.log(`✅ Logged in as ${combo.email} successfully!`);
        authClient = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
        await authClient.auth.setSession(data.session);
        loggedInEmail = combo.email;
        break;
      }
    } catch (err) {
      console.log(`Error signing in ${combo.email}:`, err.message);
    }
  }

  if (!authClient) {
    console.error('❌ Failed to authenticate with any credential.');
    return;
  }

  // 1. Fetch products from Supabase (using authClient)
  const { data: supabaseProducts, error: prodErr } = await authClient.from('products').select('*');
  if (prodErr) {
    console.error('❌ Failed to fetch products from Supabase:', prodErr.message);
    return;
  }

  console.log(`\nFound ${supabaseProducts.length} products in Supabase.`);

  // 2. Update products in Supabase with public URLs
  for (const product of supabaseProducts) {
    let updated = false;
    let newImageUrl = product.image_url;
    let newImages = product.images;

    // Check primary image_url
    if (product.image_url && product.image_url.startsWith('/uploads/')) {
      const filename = product.image_url.replace('/uploads/', '');
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/uploads/uploads/${filename}`;
      console.log(`Updating product [${product.id}] "${product.name}" image_url:\n  Old: ${product.image_url}\n  New: ${publicUrl}`);
      newImageUrl = publicUrl;
      updated = true;
    }

    // Check additional images
    if (product.images) {
      try {
        const parsedImages = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        if (Array.isArray(parsedImages)) {
          const updatedImages = parsedImages.map(img => {
            if (typeof img === 'string' && img.startsWith('/uploads/')) {
              const filename = img.replace('/uploads/', '');
              const publicUrl = `${supabaseUrl}/storage/v1/object/public/uploads/uploads/${filename}`;
              updated = true;
              return publicUrl;
            }
            return img;
          });
          newImages = JSON.stringify(updatedImages);
        }
      } catch (e) {
        console.error(`Failed to parse images for product [${product.id}]:`, e.message);
      }
    }

    if (updated) {
      const { data: updatedRows, error: updateErr } = await authClient
        .from('products')
        .update({
          image_url: newImageUrl,
          images: newImages
        })
        .eq('id', product.id)
        .select();

      if (updateErr) {
        console.error(`❌ Failed to update product [${product.id}] in Supabase:`, updateErr.message);
      } else {
        console.log(`✅ Updated product [${product.id}] in Supabase successfully. New URL: ${newImageUrl}`);
      }
    }
  }

  // 3. Update SQLite shop.db database
  console.log('\nUpdating SQLite shop.db database...');
  try {
    const db = new Database('shop.db');
    const localProducts = db.prepare('SELECT id, name, image_url, additional_images FROM products').all();
    
    for (const product of localProducts) {
      let updated = false;
      let newImageUrl = product.image_url;
      let newAdditionalImages = product.additional_images;

      if (product.image_url && product.image_url.startsWith('/uploads/')) {
        const filename = product.image_url.replace('/uploads/', '');
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/uploads/uploads/${filename}`;
        newImageUrl = publicUrl;
        updated = true;
      }

      if (product.additional_images) {
        try {
          const parsed = JSON.parse(product.additional_images);
          if (Array.isArray(parsed)) {
            const updatedImages = parsed.map(img => {
              if (typeof img === 'string' && img.startsWith('/uploads/')) {
                const filename = img.replace('/uploads/', '');
                return `${supabaseUrl}/storage/v1/object/public/uploads/uploads/${filename}`;
              }
              return img;
            });
            newAdditionalImages = JSON.stringify(updatedImages);
            updated = true;
          }
        } catch (e) {}
      }

      if (updated) {
        const stmt = db.prepare('UPDATE products SET image_url = ?, additional_images = ? WHERE id = ?');
        stmt.run(newImageUrl, newAdditionalImages, product.id);
        console.log(`✅ Updated product [${product.id}] "${product.name}" in SQLite shop.db.`);
      }
    }
  } catch (err) {
    console.error('❌ Failed to update SQLite shop.db:', err.message);
  }
}

run();
