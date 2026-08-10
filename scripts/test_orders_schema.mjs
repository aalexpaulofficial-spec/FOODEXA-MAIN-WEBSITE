import https from 'https';

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAyMDI2OSwiZXhwIjoyMDk5NTk2MjY5fQ.j_zU0z340JjK4jNAKTgD31Ex8ryPEoXipZiEhZVt0co';

function fetchQuery(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'oxsbkwcmpsadbcceaalc.supabase.co',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', error => reject(error));
    req.end();
  });
}

async function run() {
  const oneOrder = await fetchQuery("/rest/v1/orders?select=*&limit=1");
  if (Array.isArray(oneOrder) && oneOrder.length > 0) {
    console.log('Columns in orders:', Object.keys(oneOrder[0]).join(', '));
  } else {
    console.log(oneOrder);
  }
}

run();
