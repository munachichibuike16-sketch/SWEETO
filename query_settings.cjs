const Database = require('better-sqlite3');
const db = new Database('shop.db');
try {
  const settings = db.prepare("SELECT * FROM settings WHERE key LIKE '%admin%' OR key LIKE '%pass%' OR key LIKE '%key%'").all();
  console.log(JSON.stringify(settings, null, 2));
} catch (e) {
  console.error(e);
}
db.close();
