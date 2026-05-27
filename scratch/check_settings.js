import Database from 'better-sqlite3';
const db = new Database('shop.db');
const settings = db.prepare('SELECT * FROM settings').all();
console.log(JSON.stringify(settings, null, 2));
