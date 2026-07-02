import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zxkmrdyiswqngsyjvphl.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a21yZHlpc3dxbmdzeWp2cGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjkzMjksImV4cCI6MjA5NDcwNTMyOX0.Ux9T7K1Hqteg2h7sgFG0iGpZv_hMh0WjcLO1_Priof4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  // Try to get 'id' from query parameter (rewritten from /share/product/:id)
  const { id } = req.query;

  if (!id) {
    return res.status(400).send('Product ID is required');
  }

  try {
    // 1. Fetch product details from Supabase
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product) {
      console.warn(`Product not found: ${id}`, error);
      return res.status(404).send('Product not found');
    }

    // 2. Fetch shop settings (currency)
    let currency = 'XOF';
    try {
      const { data: settingData } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'currency')
        .single();
      
      if (settingData && settingData.value) {
        try {
          currency = JSON.parse(settingData.value);
        } catch (e) {
          currency = settingData.value;
        }
      }
    } catch (e) {
      console.warn('Could not load settings currency from Supabase, using fallback');
    }

    // 3. Resolve product image URL
    let metaImageUrl = product.image_url || product.image || '';
    if (metaImageUrl && (metaImageUrl.startsWith('/') || !metaImageUrl.startsWith('http'))) {
      const host = req.headers.host || 'swto.site';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      metaImageUrl = `${protocol}://${host}${metaImageUrl.startsWith('/') ? metaImageUrl : `/${metaImageUrl}`}`;
    }

    const host = req.headers.host || 'swto.site';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const shareUrl = `${protocol}://${host}/share/product/${product.id}`;
    
    const priceFormatted = product.price ? `${product.price.toLocaleString()} ${currency}` : '';
    const description = priceFormatted 
      ? `${priceFormatted} - ${product.description || 'Check out this product on SWEETO!'}` 
      : (product.description || 'Check out this product on SWEETO!');

    // 4. Return static HTML to the scraper/client
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.name} | SWEETO</title>
  
  <!-- Open Graph Meta Tags (WhatsApp, Facebook, Discord, etc.) -->
  <meta property="og:title" content="${product.name}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${metaImageUrl}" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="SWEETO" />
  
  <!-- Twitter Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${product.name}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${metaImageUrl}" />
  
  <!-- Redirect immediately to frontend route -->
  <script>
    window.location.replace("/#/product/${product.id}");
  </script>
</head>
<body>
  <div style="font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; background: #090d16; color: white;">
    <h2 style="margin-bottom: 8px;">Redirecting you to ${product.name}...</h2>
    <p style="color: #64748b; font-size: 14px;">If you are not redirected automatically, <a href="/#/product/${product.id}" style="color: #3b82f6; text-decoration: none; font-weight: bold;">click here</a>.</p>
  </div>
</body>
</html>`);

  } catch (err) {
    console.error(`Error in /api/share.js for ID ${id}:`, err);
    return res.status(500).send('Internal Server Error');
  }
}
