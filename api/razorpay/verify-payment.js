import Razorpay from "razorpay";
import crypto from "crypto";

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
    console.log("Verifying Razorpay Payment");
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, order_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification parameters." });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    async function supabasePatch(table, data, filters) {
      if (!supabaseUrl || !supabaseServiceKey) return { error: "Missing DB connection" };
      const filterParams = Object.entries(filters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
      const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/${table}?${filterParams}`;
      try {
        const resp = await fetch(url, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        if (!resp.ok) return { error: await resp.text() };
        return { success: true };
      } catch (err) {
        return { error: err.message };
      }
    }

    if (!isSignatureValid) {
      console.error("[Razorpay] Signature verification FAILED for order:", razorpay_order_id);
      await supabasePatch('payments', {
        payment_status: 'signature_mismatch',
        razorpay_status: 'verification_failed',
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        updated_at: new Date().toISOString(),
      }, { razorpay_order_id: razorpay_order_id });

      return res.status(400).json({
        success: false,
        error: "Payment verification failed. Invalid signature. Please contact support.",
      });
    }

    let paymentDetails = null;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (fetchErr) {
      console.warn("[Razorpay] Could not fetch payment details:", fetchErr);
    }

    // Update payment record in Supabase
    await supabasePatch('payments', {
      payment_status: 'captured',
      razorpay_status: paymentDetails?.status || 'captured',
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
      payment_method: paymentDetails?.method || null,
      transaction_time: new Date().toISOString(),
      webhook_verified: false,
      updated_at: new Date().toISOString(),
    }, { razorpay_order_id: razorpay_order_id });

    // Update the order in Supabase
    await supabasePatch('orders', {
      payment_status: 'paid',
      status: 'accepted',
      order_status: 'accepted',
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
      payment_method: paymentDetails?.method || null,
      updated_at: new Date().toISOString(),
      estimated_ready_at: new Date().toISOString(),
      kitchen_status: 'pending',
      counter_status: 'pending',
    }, { order_id: order_id });

    return res.json({
      success: true,
      message: "Payment verified and order updated successfully.",
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    });
  } catch (error) {
    console.error("[Razorpay] Verify payment error:", error);
    return res.status(500).json({
      error: error?.message || "Payment verification failed due to server error.",
    });
  }
}
