import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use service role key to bypass auth restrictions
const supabase = createClient(
  'https://oxsbkwcmpsadbcceaalc.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAyMDI2OSwiZXhwIjoyMDk5NTk2MjY5fQ.j_zU0z340JjK4jNAKTgD31Ex8ryPEoXipZiEhZVt0co'
);

async function getColumns(table) {
  const { data, error } = await supabase.from(table).select('*').limit(0);
  if (error) return `ERROR: ${error.message}`;

  // Try HEAD request to get column count without data
  const { data: headData, error: headError, count } = await supabase
    .from(table)
    .select('*', { head: true, count: 'exact' });

  if (headError) return `HEAD ERROR: ${headError.message}`;

  if (count > 0) {
    const { data: sampleData, error: sampleError } = await supabase.from(table).select('*').limit(1);
    if (sampleError) return `SELECT ERROR: ${sampleError.message}`;

    if (sampleData && sampleData.length > 0) {
      const columns = Object.keys(sampleData[0]).sort();
      return columns.join('\n');
    } else {
      return '(empty table - no sample data found)';
    }
  } else {
    return '(empty table - no rows)';
  }
}

async function main() {
  const tables = ['menu_items', 'institution_requests', 'orders', 'notifications', 'profiles', 'menu_categories', 'order_items', 'institutions', 'demo_requests'];

  for (const table of tables) {
    console.log(`\n=== ${table} ===`);
    const columns = await getColumns(table);
    console.log(columns);
    console.log('---');
  }
}

main().catch(console.error);
