<?php
$supabaseUrl = 'https://zxkmrdyiswqngsyjvphl.supabase.co';
$supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a21yZHlpc3dxbmdzeWp2cGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjkzMjksImV4cCI6MjA5NDcwNTMyOX0.Ux9T7K1Hqteg2h7sgFG0iGpZv_hMh0WjcLO1_Priof4';

$id = isset($_GET['id']) ? trim($_GET['id']) : '';
$id = preg_replace('/^swt-/', '', strtolower($id));

if (!$id) {
    die('Product ID is required');
}

// Fetch Product from Supabase via REST
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "$supabaseUrl/rest/v1/products?id=eq.$id&select=*");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "apikey: $supabaseAnonKey",
    "Authorization: Bearer $supabaseAnonKey"
]);
$response = curl_exec($ch);
curl_close($ch);

$products = json_decode($response, true);
$product = isset($products[0]) ? $products[0] : null;

if (!$product) {
    die('Product not found');
}

$name = htmlspecialchars($product['name'] ?? 'Product');
$metaImageUrl = $product['image_url'] ?? $product['image'] ?? '';

$host = $_SERVER['HTTP_HOST'] ?? 'swto.site';
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';

if ($metaImageUrl && (substr($metaImageUrl, 0, 1) === '/' || strpos($metaImageUrl, 'http') !== 0)) {
    $metaImageUrl = $protocol . '://' . $host . (substr($metaImageUrl, 0, 1) === '/' ? '' : '/') . $metaImageUrl;
}

$shareUrl = "$protocol://$host/share/product/$id";
$price = isset($product['price']) ? number_format($product['price']) : '';
$description = $price ? "$price FCFA - Découvrez ce produit sur SWEETO!" : "Découvrez ce produit sur SWEETO!";

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= $name ?> | SWEETO</title>
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="<?= $name ?>" />
  <meta property="og:description" content="<?= htmlspecialchars($description) ?>" />
  <meta property="og:image" content="<?= htmlspecialchars($metaImageUrl) ?>" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="<?= htmlspecialchars($shareUrl) ?>" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="SWEETO" />
  
  <!-- Twitter Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="<?= $name ?>" />
  <meta name="twitter:description" content="<?= htmlspecialchars($description) ?>" />
  <meta name="twitter:image" content="<?= htmlspecialchars($metaImageUrl) ?>" />
  
  <script>
    window.location.replace("/#/product/<?= htmlspecialchars($id) ?>");
  </script>
</head>
<body>
  <div style="font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; background: #090d16; color: white;">
    <h2 style="margin-bottom: 8px;">Redirecting you to <?= $name ?>...</h2>
    <p style="color: #64748b; font-size: 14px;">If you are not redirected automatically, <a href="/#/product/<?= htmlspecialchars($id) ?>" style="color: #3b82f6; text-decoration: none; font-weight: bold;">click here</a>.</p>
  </div>
</body>
</html>
