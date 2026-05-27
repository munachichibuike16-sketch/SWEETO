const Database = require('better-sqlite3');
const db = new Database('shop.db');
const sections = db.prepare('SELECT * FROM sections').all();
console.log(JSON.stringify(sections, null, 2));
