const Database = require('better-sqlite3');
const db = new Database('c:/Users/SWEETO/Desktop/SWEETO/shop.db');
const sections = db.prepare('SELECT * FROM sections').all();
console.log('--- ALL SECTIONS ---');
console.log(JSON.stringify(sections, null, 2));
db.close();
