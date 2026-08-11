import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oxsbkwcmpsadbcceaalc.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAyMDI2OSwiZXhwIjoyMDk5NTk2MjY5fQ.j_zU0z340JjK4jNAKTgD31Ex8ryPEoXipZiEhZVt0co';
const supabase = createClient(supabaseUrl, serviceKey);

async function testOrder() {
  const orderPayload = {
    institution_id: '64175400-f781-41e4-b200-897983f8b270',
    user_id: 'b7858525-d94f-4c9a-891e-59aae262b0e7',
    total_amount: 107,
    status: 'accepted',
    items: [{ id: '123', quantity: 1 }] // INVALID COLUMN
  };

  console.log('Sending insert...');
  const { data, error } = await supabase.from('orders').insert([orderPayload]).select('*');
  console.log('Error:', error);
}

testOrder();
