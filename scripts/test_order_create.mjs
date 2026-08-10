import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oxsbkwcmpsadbcceaalc.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAyMDI2OSwiZXhwIjoyMDk5NTk2MjY5fQ.j_zU0z340JjK4jNAKTgD31Ex8ryPEoXipZiEhZVt0co';

const supabase = createClient(supabaseUrl, serviceKey);

async function testOrder() {
  const now = new Date();
  const nowISO = now.toISOString();

  // Try to insert a dummy order
  const orderPayload = {
    institution_id: '64175400-f781-41e4-b200-897983f8b270', // From previous script
    user_id: 'b7858525-d94f-4c9a-891e-59aae262b0e7',       // From previous script
    stall_id: null,
    subtotal: 100,
    tax: 5,
    platform_fee: 2,
    total_amount: 107,
    transaction_amount: 107,
    status: 'accepted',
    order_status: 'Accepted',
    payment_status: 'paid',
    payment_method: 'razorpay',
    order_number: Date.now(),
    pickup_token: '1234',
    pickup_code: '1234',
    qr_pickup_code: 'TESTQR',
    token_number: '1234',
    notes: 'Test order',
    kitchen_status: 'Pending',
    counter_status: 'Incoming',
    estimated_ready_at: new Date(now.getTime() + 15 * 60000).toISOString(),
    created_at: nowISO,
    updated_at: nowISO,
    paid_at: nowISO,
    accepted_at: nowISO,
    razorpay_order_id: 'order_test123',
    razorpay_payment_id: 'pay_test123',
    razorpay_signature: 'sig_test123',
  };

  const { data, error } = await supabase.from('orders').insert([orderPayload]).select('*');
  
  if (error) {
    console.error('Insert failed with error:', error);
  } else {
    console.log('Insert succeeded! Data:', data);
    
    // Cleanup
    await supabase.from('orders').delete().eq('id', data[0].id);
  }
}

testOrder();
