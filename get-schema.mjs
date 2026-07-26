import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in env');
  process.exit(1);
}

const supabase = createClient(
  'https://oxsbkwcmpsadbcceaalc.supabase.co',
  serviceKey
);

async function main() {
  const tables = ['menu_items', 'institution_requests', 'orders', 'notifications', 'profiles', 'menu_categories', 'order_items', 'institutions'];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`\n=== ${table} === ERROR: ${error.message}`);
    } else {
      console.log(`\n=== ${table} ===`);
      if (data && data.length > 0) {
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('(empty table - no rows to infer schema)');
      }
    }
  }
}
main();
