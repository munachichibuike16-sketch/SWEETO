async function test() {
  const url = 'https://zxkmrdyiswqngsyjvphl.supabase.co/storage/v1/object/public/uploads/uploads/1778608206280-453189850.jpg';
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.status} ${res.statusText}`);
  } catch (err) {
    console.error(err);
  }
}
test();
