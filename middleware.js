import { createClient } from '@supabase/supabase-js';

export const config = {
  matcher: '/product/:id*',
};

// Vercel Edge Middleware entry point
export default async function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  
  const BOT_REGEX = /facebookexternalhit|Facebot|WhatsApp|Twitterbot|Pinterest|LinkedInBot|Discordbot/i;

  // 1. Only run for bots on /product/:id paths
  const match = url.pathname.match(/^\/(?:share\/)?product\/([^/]+)/);
  if (!match || !BOT_REGEX.test(userAgent)) {
    // Return early, letting the static index.html load normally for real users
    return;
  }

  const rawId = match[1];
  const id = rawId ? rawId.toLowerCase().replace(/^swt-/, '') : '';

  if (!id) {
    return;
  }

  // 2. Fetch product from Supabase (Edge-compatible)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zxkmrdyiswqngsyjvphl.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a21yZHlpc3dxbmdzeWp2cGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjkzMjksImV4cCI6MjA5NDcwNTMyOX0.Ux9T7K1Hqteg2h7sgFG0iGpZv_hMh0WjcLO1_Priof4';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product) {
      return; // Product not found, fallback to standard SPA
    }

    // 3. Resolve product image URL
    let metaImageUrl = product.image_url || product.image || '';
    if (!metaImageUrl && product.images) {
      try {
        const imgs = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        if (Array.isArray(imgs) && imgs.length > 0) {
          metaImageUrl = imgs[0];
        }
      } catch (e) {}
    }
    
    // Ensure absolute URL
    if (metaImageUrl && (metaImageUrl.startsWith('/') || !metaImageUrl.startsWith('http'))) {
      const host = request.headers.get('host') || 'swto.site';
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      metaImageUrl = `${protocol}://${host}${metaImageUrl.startsWith('/') ? metaImageUrl : `/${metaImageUrl}`}`;
    }

    const shareUrl = `https://swto.site/product/${product.id}`;
    const priceFormatted = product.price ? `${product.price.toLocaleString()} XOF` : '';
    const description = priceFormatted 
      ? `${priceFormatted} - Découvrez ce produit sur SWEETO!` 
      : 'Découvrez ce produit sur SWEETO!';

    // 4. Return static HTML for the bot crawler
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${product.name} | SWEETO</title>
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${product.name}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${metaImageUrl}" />
  <meta property="og:image:secure_url" content="${metaImageUrl}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="SWEETO" />
  <meta itemprop="name" content="${product.name}">
  <meta itemprop="description" content="${description}">
  <meta itemprop="image" content="${metaImageUrl}">
  
  <!-- Twitter Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${product.name}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${metaImageUrl}" />
</head>
<body></body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('Edge Middleware Error:', err);
    return; // Fallback to SPA
  }
}
