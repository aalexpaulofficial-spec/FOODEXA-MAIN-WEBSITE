import https from 'https';

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAyMDI2OSwiZXhwIjoyMDk5NTk2MjY5fQ.j_zU0z340JjK4jNAKTgD31Ex8ryPEoXipZiEhZVt0co';

function fetchQuery(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'oxsbkwcmpsadbcceaalc.supabase.co',
      port: 443,
      path: path,
      method: method,
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', error => reject(error));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  // Try to insert a test order_item to see which columns exist
  const testPayload = {
    order_id: '00000000-0000-0000-0000-000000000000',
    menu_item_id: '00000000-0000-0000-0000-000000000000',
    quantity: 1,
    price: 10,
    name: 'Test Item',
    variant: null,
  };

  const result = await fetchQuery("/rest/v1/order_items", 'POST', testPayload);
  console.log('order_items insert test:', result);
}

run();
