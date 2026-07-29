import Razorpay from "razorpay";

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("Creating Razorpay Order");
    console.log(req.body);
    console.log(process.env.RAZORPAY_KEY_ID ? "KEY FOUND":"KEY MISSING");
    console.log(process.env.RAZORPAY_KEY_SECRET ? "SECRET FOUND":"SECRET MISSING");

    if (!process.env.RAZORPAY_KEY_ID) throw new Error("Missing RAZORPAY_KEY_ID");
    if (!process.env.RAZORPAY_KEY_SECRET) throw new Error("Missing RAZORPAY_KEY_SECRET");

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const { amount, currency, receipt, user_id, institution_id, order_id, items, email, phone, name } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount. Amount must be greater than 0." });
    }
    if (!user_id || !order_id) {
      return res.status(400).json({ error: "Missing required fields: user_id, order_id." });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    if (amountInPaise < 100) {
      return res.status(400).json({ error: "Minimum order amount is ₹1." });
    }

    const orderPayload = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receipt || `fdx_${order_id}`,
      notes: {
        user_id: user_id,
        institution_id: institution_id || '',
        order_id: order_id,
        platform: 'FOODEXA',
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderPayload);

    // Save pending payment record to Supabase via fetch (bypassing RLS with service role)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (supabaseUrl && supabaseServiceKey) {
      const paymentRecord = {
        user_id: user_id,
        institution_id: institution_id || null,
        order_id: order_id,
        razorpay_order_id: razorpayOrder.id,
        amount: Number(amount),
        currency: currency || 'INR',
        payment_status: 'created',
        customer_email: req.body.email || null,
        customer_phone: req.body.phone || null,
        customer_name: req.body.name || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/payments`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(paymentRecord)
      }).catch(err => console.error("[Razorpay] Failed to save pending payment:", err));
    }

    return res.json({
      success: true,
      order_id: razorpayOrder.id,
      amount: amountInPaise,
      currency: razorpayOrder.currency,
      razorpay_key_id: razorpayKeyId,
    });
  } catch (error) {
    console.error("[Razorpay] Create order error:", error);
    return res.status(500).json({
      error: error?.error?.description || error?.message || "Failed to create payment order. Please try again.",
    });
  }
}
