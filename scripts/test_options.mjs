import https from 'https';

const options = {
  hostname: 'oxsbkwcmpsadbcceaalc.supabase.co',
  port: 443,
  path: '/rest/v1/orders?columns=%22student_id%22%2C%22email%22%2C%22customer_name%22%2C%22phone%22%2C%22institution_id%22%2C%22canteen_id%22%2C%22total_amount%22%2C%22transaction_amount%22%2C%22status%22%2C%22order_status%22%2C%22payment_status%22%2C%22payment_method%22%2C%22order_number%22%2C%22pickup_token%22%2C%22pickup_code%22%2C%22qr_pickup_code%22%2C%22token_number%22%2C%22notes%22%2C%22kitchen_status%22%2C%22counter_status%22%2C%22estimated_ready_at%22%2C%22created_at%22%2C%22updated_at%22%2C%22paid_at%22%2C%22accepted_at%22%2C%22razorpay_order_id%22%2C%22razorpay_payment_id%22%2C%22razorpay_signature%22',
  method: 'OPTIONS',
  headers: {
    'Access-Control-Request-Method': 'POST',
    'Origin': 'https://foodexa-six.vercel.app'
  }
};

const req = https.request(options, res => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
});
req.end();
