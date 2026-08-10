import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oxsbkwcmpsadbcceaalc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAyMDI2OSwiZXhwIjoyMDk5NTk2MjY5fQ.j_zU0z340JjK4jNAKTgD31Ex8ryPEoXipZiEhZVt0co'
);

// 1. Check what columns the profiles table has
console.log('=== Checking profiles table columns ===');
const { data: profiles, error: profErr } = await supabase
  .from('profiles')
  .select('*')
  .limit(1);

if (profErr) {
  console.error('Profile fetch error:', profErr.message);
} else if (profiles && profiles.length > 0) {
  console.log('Columns:', Object.keys(profiles[0]).join(', '));
  console.log('Sample row:', JSON.stringify(profiles[0], null, 2));
} else {
  console.log('No profiles found at all!');
}

// 2. Check user by email
console.log('\n=== Looking up user: a.alex@btech.christuniversity.in ===');
const { data: userProfiles, error: userErr } = await supabase
  .from('profiles')
  .select('*')
  .eq('email', 'a.alex@btech.christuniversity.in');

if (userErr) {
  console.error('User profile fetch error:', userErr.message);
} else if (userProfiles && userProfiles.length > 0) {
  console.log('Found profile:', JSON.stringify(userProfiles[0], null, 2));
} else {
  console.log('No profile found for this email!');
  
  // Try auth.users
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error('Auth users fetch error:', authErr.message);
  } else {
    const user = authData.users.find(u => u.email === 'a.alex@btech.christuniversity.in');
    if (user) {
      console.log('Found in auth.users:', JSON.stringify({ id: user.id, email: user.email, metadata: user.user_metadata }, null, 2));
    } else {
      console.log('User not found in auth.users either!');
    }
  }
}

// 3. Check institution code YAWEH814660
console.log('\n=== Checking institution code: YAWEH814660 ===');
const { data: instData, error: instErr } = await supabase
  .from('institutions')
  .select('*')
  .eq('institution_code', 'YAWEH814660');

if (instErr) {
  console.error('Institution fetch error:', instErr.message);
} else if (instData && instData.length > 0) {
  console.log('Institution found:', JSON.stringify(instData[0], null, 2));
} else {
  console.log('Institution code YAWEH814660 NOT found!');
  
  // List all institution codes
  const { data: allInst } = await supabase.from('institutions').select('institution_code, name').limit(10);
  console.log('Available institution codes:', JSON.stringify(allInst, null, 2));
}
