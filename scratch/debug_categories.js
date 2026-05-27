import Database from 'better-sqlite3';
const db = new Database('shop.db');

try {
  const count = db.prepare("SELECT count(*) as count FROM products WHERE category = 'All'").get().count;
  console.log('Products with category All:', count);

  const categories = db.prepare("SELECT category, count(*) as count FROM products GROUP BY category").all();
  console.log('Categories in products:', categories);
} catch (e) {
  console.error('DB Error:', e);
} finally {
  db.close();
}
