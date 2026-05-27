import Database from 'better-sqlite3';
const db = new Database('shop.db');

try {
  const sections = db.prepare("SELECT * FROM sections").all();
  console.log('Local SQLite Sections:', JSON.stringify(sections, null, 2));
} catch (e) {
  console.error('SQLite Error:', e);
} finally {
  db.close();
}
