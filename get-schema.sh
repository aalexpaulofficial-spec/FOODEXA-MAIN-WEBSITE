#!/bin/bash
# Use curl to fetch the schema directly from Supabase

SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94c2Jrd2NtcHNhZGJjY2VhYWxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAyMDI2OSwiZXhwIjoyMDk5NTk2MjY5fQ.j_zU0z340JjK4jNAKTgD31Ex8ryPEoXipZiEhZVt0co"

# Fetch schema from the endpoint
response=$(curl -s -H "apikey: $SERVICE_ROLE_KEY" \
           -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
           "https://oxsbkwcmpsadbcceaalc.supabase.co/rest/v1/")

echo "Response length: ${#response}"
echo ""

# Extract and display the OpenAPI paths (table names)
paths=$(echo "$response" | grep -o '"/[^ "]*' | head -20)
echo "=== Tables (paths) ==="
echo "$paths" | sort | uniq
echo ""

# For each table, let's try to fetch column info
# Use limit=1 to get a sample row (without selecting * to avoid unpacking)
echo "=== Table Column Discovery ==="

# List of known tables from the codebase
tables=(menu_items institution_requests demo_requests orders notifications profiles menu_categories order_items institutions)

for table in "${tables[@]}"; do
  echo -n "\n${table}: "
  # Check if table exists by trying limit=1 and see if we get headers
  headers=$(curl -s -H "apikey: $SERVICE_ROLE_KEY" \
                  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
                  -H "Prefer: return=representation" \
                  "https://oxsbkwcmpsadbcceaalc.supabase.co/rest/v1/${table}?limit=1" | head -c 1)
  
  if [ "$headers" = "[" ]; then
    echo "EXISTS (has data)"
    
    # Try to get sample row
    sample=$(curl -s -H "apikey: $SERVICE_ROLE_KEY" \
                  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
                  "https://oxsbkwcmpsadbcceaalc.supabase.co/rest/v1/${table}?limit=1")
    
    # Extract first object properties
    if [[ "$sample" != "[]" ]]; then
      # Use python to parse JSON and get keys
      keys=$(echo "$sample" | python3 -c "import sys, json; data=json.load(sys.stdin); print('\n'.join(data[0].keys()))" 2>/dev/null || echo "N/A")
      if [ "$keys" != "N/A" ]; then
        echo "Columns: $keys"
      fi
    fi
  else
    echo "Maybe exists or empty"
  fi
done
