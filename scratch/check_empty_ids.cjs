const Database = require('better-sqlite3');
const db = new Database('./shop.db');

const tables = ['products', 'categories', 'user_activities', 'orders', 'video_ads', 'settings'];

tables.forEach(table => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    const emptyIds = rows.filter(r => r.id === null || r.id === '');
    if (emptyIds.length > 0) {
      console.log(`Table ${table} has ${emptyIds.length} rows with empty or null ID!`);
      emptyIds.forEach(r => console.log(JSON.stringify(r)));
    } else {
      console.log(`Table ${table} is clean.`);
    }
  } catch (err) {
    console.log(`Table ${table} check failed:`, err.message);
  }
});

db.close();
