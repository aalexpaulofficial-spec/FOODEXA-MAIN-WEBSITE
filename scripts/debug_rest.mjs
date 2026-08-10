import https from 'https';

const supabaseUrl = 'https://oxsbkwcmpsadbcceaalc.supabase.co';
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
  console.log('=== Checking user in auth.users ===');
  const users = await fetchQuery('/auth/v1/users'); // Note: auth/v1/users is not always accessible this way, maybe need different endpoint, but let's check profiles first
  
  console.log('\n=== Checking profiles for a.alex@btech.christuniversity.in ===');
  const profiles = await fetchQuery("/rest/v1/profiles?email=eq.a.alex@btech.christuniversity.in&select=*");
  console.log(profiles);

  console.log('\n=== Checking institution code YAWEH814660 ===');
  const insts = await fetchQuery("/rest/v1/institutions?institution_code=eq.YAWEH814660&select=*");
  console.log(insts);
  
  console.log('\n=== Fetching one row to see schema ===');
  const oneProfile = await fetchQuery("/rest/v1/profiles?select=*&limit=1");
  if (Array.isArray(oneProfile) && oneProfile.length > 0) {
    console.log('Columns in profiles:', Object.keys(oneProfile[0]).join(', '));
  } else {
    console.log(oneProfile);
  }
}

run();
