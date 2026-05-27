import fs from 'fs';
import path from 'path';

async function testUpload() {
  const formData = new FormData();
  
  // create dummy file
  const blob = new Blob(["test"], { type: 'image/jpeg' });
  formData.append('image', blob, 'test.jpg');

  try {
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });
    console.log(response.status, response.statusText);
    const text = await response.text();
    console.log(text);
  } catch (err) {
    console.error(err);
  }
}

testUpload();
