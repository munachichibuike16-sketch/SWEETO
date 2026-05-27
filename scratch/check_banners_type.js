import Database from 'better-sqlite3';
const db = new Database('shop.db');

try {
  const row = db.prepare("SELECT value FROM settings WHERE key='heroBanners'").get();
  if (row) {
    console.log('Banners Raw Value:', row.value);
    const banners = JSON.parse(row.value);
    console.log('Banners Type:', typeof banners);
    console.log('Is Array?', Array.isArray(banners));
  } else {
    console.log('heroBanners not found');
  }
} catch (e) {
  console.error('DB Error:', e);
} finally {
  db.close();
}
