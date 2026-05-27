import Database from 'better-sqlite3';
const db = new Database('shop.db');

try {
  const categories = db.prepare("SELECT DISTINCT category FROM products").all();
  console.log('Distinct Categories:', categories.map(c => `'${c.category}'`));
} catch (e) {
  console.error('DB Error:', e);
} finally {
  db.close();
}
