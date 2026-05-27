import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const uploadsDir = 'uploads';

function getMd5(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

const files = fs.readdirSync(uploadsDir);
const list = [];
for (const file of files) {
  const filePath = path.join(uploadsDir, file);
  const stat = fs.statSync(filePath);
  if (stat.isFile()) {
    list.push({
      name: file,
      size: stat.size,
      md5: getMd5(filePath),
      mtime: stat.mtime
    });
  }
}

list.sort((a, b) => b.mtime - a.mtime);
console.log('=== UPLOADS METADATA (NEWEST FIRST) ===');
list.forEach(item => {
  console.log(`- ${item.name}`);
  console.log(`  Size: ${item.size} bytes`);
  console.log(`  MD5: ${item.md5}`);
  console.log(`  Modified: ${item.mtime.toISOString()}`);
});
