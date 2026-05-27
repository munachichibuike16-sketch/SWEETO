import Database from 'better-sqlite3';
const db = new Database('shop.db');

try {
  const row = db.prepare("SELECT value FROM settings WHERE key='heroBanners'").get();
  if (row) {
    const banners = JSON.parse(row.value);
    console.log('Banners IDs:', banners.map(b => b.id));
  } else {
    console.log('heroBanners not found');
  }
} catch (e) {
  console.error('DB Error:', e);
} finally {
  db.close();
}
