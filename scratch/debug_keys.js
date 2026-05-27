import Database from 'better-sqlite3';
const db = new Database('shop.db');

try {
  const products = db.prepare('SELECT id, name FROM products').all();
  console.log('Products:', JSON.stringify(products, null, 2));

  const categories = db.prepare('SELECT id, name FROM categories').all();
  console.log('Categories:', JSON.stringify(categories, null, 2));

  const settings = db.prepare('SELECT * FROM settings').all();
  console.log('Settings Keys:', settings.map(s => s.key));
} catch (e) {
  console.error('DB Error:', e);
} finally {
  db.close();
}
