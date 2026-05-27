import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zxkmrdyiswqngsyjvphl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a21yZHlpc3dxbmdzeWp2cGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjkzMjksImV4cCI6MjA5NDcwNTMyOX0.Ux9T7K1Hqteg2h7sgFG0iGpZv_hMh0WjcLO1_Priof4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching buckets...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error('❌ Error listing buckets:', bucketError);
  } else {
    console.log('✅ Buckets:', buckets);
  }

  console.log('\nTrying to list files in "uploads" bucket at root...');
  const { data: files, error: filesError } = await supabase.storage.from('uploads').list();
  if (filesError) {
    console.error('❌ Error listing files in "uploads":', filesError);
  } else {
    console.log('✅ Files in "uploads":', files?.slice(0, 10));
  }

  console.log('\nTrying to list files in "uploads" bucket at "products" folder...');
  const { data: prodFiles, error: prodFilesError } = await supabase.storage.from('uploads').list('products');
  if (prodFilesError) {
    console.error('❌ Error listing files in "products" folder:', prodFilesError);
  } else {
    console.log('✅ Files in "products" folder:', prodFiles?.slice(0, 10));
  }
}

run();
