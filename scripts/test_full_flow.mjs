import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oxsbkwcmpsadbcceaalc.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAyMDI2OSwiZXhwIjoyMDk5NTk2MjY5fQ.j_zU0z340JjK4jNAKTgD31Ex8ryPEoXipZiEhZVt0co';
const supabase = createClient(supabaseUrl, serviceKey);

const SELECT_ORDER_WITH_ITEMS = '*, order_items(id, order_id, menu_item_id, quantity, price, menu_items(id, food_name, food_type, category_name, image_url, is_veg, price))';

async function test() {
  const now = new Date();
  const nowISO = now.toISOString();

  // Step 1: Test insert with SELECT_ORDER_WITH_ITEMS (the exact query from code)
  console.log('=== STEP 1: Insert order with joined select ===');
  const orderPayload = {
    student_id: 'b7858525-d94f-4c9a-891e-59aae262b0e7',
    email: 'a.alex@btech.christuniversity.in',
    customer_name: 'TEST USER',
    phone: '8123360329',
    institution_id: '64175400-f781-41e4-b200-897983f8b270',
    canteen_id: '83547618-fc75-4120-8ad8-b7a583d19a89',
    total_amount: 50,
    transaction_amount: 50,
    status: 'accepted',
    order_status: 'Accepted',
    payment_status: 'paid',
    payment_method: 'razorpay',
    order_number: Date.now(),
    pickup_token: 'TKN-TEST',
    pickup_code: 'PICKUP-TEST',
    qr_pickup_code: 'QR-FDX-TEST',
    token_number: 'TKN-TEST',
    notes: null,
    kitchen_status: 'Pending',
    counter_status: 'Incoming',
    estimated_ready_at: new Date(now.getTime() + 15 * 60000).toISOString(),
    created_at: nowISO,
    updated_at: nowISO,
    paid_at: nowISO,
    accepted_at: nowISO,
    razorpay_order_id: 'order_test_flow_' + Date.now(),
    razorpay_payment_id: 'pay_test_flow_' + Date.now(),
    razorpay_signature: 'sig_test_flow_' + Date.now(),
  };

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert([orderPayload])
    .select(SELECT_ORDER_WITH_ITEMS)
    .single();

  if (orderError) {
    console.error('ORDER INSERT FAILED:', orderError);
    
    // Try with simple select
    console.log('\n=== Retrying with simple select("*") ===');
    const { data: orderData2, error: orderError2 } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select('*')
      .single();
    
    if (orderError2) {
      console.error('SIMPLE INSERT ALSO FAILED:', orderError2);
      return;
    }
    console.log('Simple insert succeeded! Order ID:', orderData2.id);
    
    // Cleanup
    await supabase.from('orders').delete().eq('id', orderData2.id);
    return;
  }

  console.log('Order inserted OK! ID:', orderData.id);

  // Step 2: Test order_items insert
  console.log('\n=== STEP 2: Insert order_items ===');
  
  // First get a real menu_item_id
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('id, food_name, price')
    .eq('institution_id', '64175400-f781-41e4-b200-897983f8b270')
    .limit(1);
  
  if (!menuItems || menuItems.length === 0) {
    console.log('No menu items found, skipping order_items test');
  } else {
    const itemsPayload = [{
      order_id: orderData.id,
      menu_item_id: menuItems[0].id,
      quantity: 1,
      price: menuItems[0].price || 50,
    }];
    console.log('Inserting order_items:', JSON.stringify(itemsPayload));
    const { data: itemsData, error: itemsError } = await supabase.from('order_items').insert(itemsPayload).select('*');
    if (itemsError) {
      console.error('ORDER_ITEMS INSERT FAILED:', itemsError);
    } else {
      console.log('Order items inserted OK:', itemsData);
    }
  }

  // Step 3: Test re-fetch
  console.log('\n=== STEP 3: Re-fetch with joined select ===');
  const { data: finalOrder, error: fetchError } = await supabase
    .from('orders')
    .select(SELECT_ORDER_WITH_ITEMS)
    .eq('id', orderData.id)
    .single();
  
  if (fetchError) {
    console.error('RE-FETCH FAILED:', fetchError);
  } else {
    console.log('Re-fetch OK! order_items count:', finalOrder.order_items?.length);
  }

  // Cleanup
  console.log('\n=== CLEANUP ===');
  await supabase.from('order_items').delete().eq('order_id', orderData.id);
  await supabase.from('orders').delete().eq('id', orderData.id);
  console.log('Cleaned up test data.');
}

test().catch(console.error);
