import Database from 'better-sqlite3';
const db = new Database('shop.db');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name));
} catch (e) {
  console.error('DB Error:', e);
} finally {
  db.close();
}
