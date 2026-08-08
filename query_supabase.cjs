const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://zxkmrdyiswqngsyjvphl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a21yZHlpc3dxbmdzeWp2cGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjkzMjksImV4cCI6MjA5NDcwNTMyOX0.Ux9T7K1Hqteg2h7sgFG0iGpZv_hMh0WjcLO1_Priof4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: latestOrder, error: fetchErr } = await supabase
    .from('orders')
    .select('*')
    .order('id', { ascending: false })
    .limit(1);

  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }

  console.log('Latest order:', latestOrder);

  if (latestOrder && latestOrder.length > 0) {
    const orderId = latestOrder[0].id;
    console.log('Testing update on order:', orderId);
    const { data, error } = await supabase
      .from('orders')
      .update({ city: 'Abidjan Test' })
      .eq('id', orderId)
      .select();

    if (error) {
      console.error('Update error:', error);
    } else {
      console.log('Update success:', data);
    }
  }
}

run();
