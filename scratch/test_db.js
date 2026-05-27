import Database from 'better-sqlite3';
try {
  const db = new Database('shop.db', { timeout: 2000 });
  console.log('Successfully opened shop.db');
  const count = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  console.log('Product count:', count);
  db.close();
} catch (e) {
  console.error('Failed to open shop.db:', e.message);
  process.exit(1);
}
