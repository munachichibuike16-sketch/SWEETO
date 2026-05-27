import Database from 'better-sqlite3';
const db = new Database('shop.db');
const products = db.prepare('SELECT COUNT(*) as count FROM products').get();
console.log('Product count:', products.count);
const categories = db.prepare('SELECT * FROM categories').all();
console.log('Categories:', categories);
