import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zxkmrdyiswqngsyjvphl.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a21yZHlpc3dxbmdzeWp2cGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjkzMjksImV4cCI6MjA5NDcwNTMyOX0.Ux9T7K1Hqteg2h7sgFG0iGpZv_hMh0WjcLO1_Priof4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function generate() {
  const { data: products, error } = await supabase.from('products').select('*');
  if (error || !products) {
    console.error('Error fetching products:', error);
    return;
  }

  const distDir = path.join(__dirname, '..', 'dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('dist/index.html not found! Ensure this runs after vite build.');
    return;
  }

  const baseHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  for (const product of products) {
    let metaImageUrl = product.image_url || product.image || '';
    if (!metaImageUrl && product.images) {
      try {
        const imgs = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        if (Array.isArray(imgs) && imgs.length > 0) metaImageUrl = imgs[0];
      } catch (e) {}
    }
    
    if (metaImageUrl) {
      if (metaImageUrl.includes('localhost:3000') || metaImageUrl.includes('127.0.0.1:3000')) {
        metaImageUrl = metaImageUrl.replace(/https?:\/\/(localhost|127\.0\.0\.1):3000/, 'https://swto.site');
      } else if (metaImageUrl.startsWith('/') || !metaImageUrl.startsWith('http')) {
        metaImageUrl = `https://swto.site${metaImageUrl.startsWith('/') ? metaImageUrl : `/${metaImageUrl}`}`;
      }
    }

    const shareUrl = `https://swto.site/product/${product.id}`;
    const priceFormatted = product.price ? `${product.price.toLocaleString()} XOF` : '';
    const description = priceFormatted ? `${priceFormatted} - Découvrez ce produit sur SWEETO!` : 'Découvrez ce produit sur SWEETO!';

    const ogTags = `
  <meta property="og:title" content="${product.name} | SWEETO" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${metaImageUrl}" />
  <meta property="og:image:secure_url" content="${metaImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="628" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="SWEETO" />
  <meta itemprop="name" content="${product.name} | SWEETO">
  <meta itemprop="description" content="${description}">
  <meta itemprop="image" content="${metaImageUrl}">
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${product.name} | SWEETO" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${metaImageUrl}" />
    `;

    // Strip default OG tags and replace title tag from baseHtml to prevent duplicate meta tag conflicts in crawlers
    let productHtml = baseHtml
      .replace(/<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/i, '')
      .replace(/<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/i, '')
      .replace(/<meta\s+property=["']og:image["']\s+content=["'][^"']*["']\s*\/?>/i, '')
      .replace(/<meta\s+property=["']og:type["']\s+content=["'][^"']*["']\s*\/?>/i, '')
      .replace(/<title>[^<]*<\/title>/i, `<title>${product.name} | SWEETO</title>`);

    // Inject OG tags at the very beginning of the <head> tag so scrapers parse them first
    productHtml = productHtml.replace(/<head>/i, `<head>\n${ogTags}`);

    // Create directories for both /product/:id and /share/product/:id
    const productDir = path.join(distDir, 'product', product.id.toString());
    const shareProductDir = path.join(distDir, 'share', 'product', product.id.toString());
    
    fs.mkdirSync(productDir, { recursive: true });
    fs.mkdirSync(shareProductDir, { recursive: true });
    
    fs.writeFileSync(path.join(productDir, 'index.html'), productHtml);
    fs.writeFileSync(path.join(shareProductDir, 'index.html'), productHtml);
  }
  
  console.log(`Successfully generated static HTML pages for ${products.length} products.`);
}

generate();
