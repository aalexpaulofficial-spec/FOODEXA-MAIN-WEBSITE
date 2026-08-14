import Razorpay from "razorpay";
import crypto from "crypto";

function supabaseGet(table, filters, select = '*') {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !supabaseServiceKey) return Promise.resolve({ data: null, error: 'Missing DB connection' });
  const filterParams = Object.entries(filters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/${table}?${filterParams}&select=${select}`;
  return fetch(url, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
  }).then(r => r.json()).then(data => ({ data: Array.isArray(data) ? data : [data], error: null }))
    .catch(err => ({ data: null, error: err.message }));
}

function supabasePost(table, rows) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !supabaseServiceKey) return Promise.resolve({ error: 'Missing DB connection' });
  const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/${table}`;
  return fetch(url, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(rows),
  }).then(r => r.ok ? r.json().then(data => ({ data, error: null })) : r.text().then(t => ({ data: null, error: t })))
    .catch(err => ({ data: null, error: err.message }));
}

function supabasePatch(table, data, filters) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !supabaseServiceKey) return Promise.resolve({ error: 'Missing DB connection' });
  const filterParams = Object.entries(filters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/${table}?${filterParams}`;
  return fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  }).then(r => r.ok ? r.json().then(d => ({ data: d, error: null })) : r.text().then(t => ({ data: null, error: t })))
    .catch(err => ({ data: null, error: err.message }));
}

function resolvePickupPrefix(canteenName) {
  const name = String(canteenName || '').toLowerCase();
  if (name.includes('lunch')) return 'L';
  if (name.includes('dinner')) return 'D';
  if (name.includes('faculty')) return 'F';
  if (name.includes('guest')) return 'G';
  if (name.includes('break')) return 'B';
  return 'B';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    console.log("[Razorpay] Verifying payment");
    console.log(process.env.RAZORPAY_KEY_ID ? "KEY FOUND" : "KEY MISSING");
    console.log(process.env.RAZORPAY_KEY_SECRET ? "SECRET FOUND" : "SECRET MISSING");

    if (!process.env.RAZORPAY_KEY_ID) throw new Error("Missing RAZORPAY_KEY_ID");
    if (!process.env.RAZORPAY_KEY_SECRET) throw new Error("Missing RAZORPAY_KEY_SECRET");

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, order_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification parameters." });
    }

    // ── STEP 1: Verify HMAC signature ────────────────────────────────────
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error("[Razorpay] Signature verification FAILED for order:", razorpay_order_id);
      await supabasePatch('payments', {
        payment_status: 'signature_mismatch',
        razorpay_status: 'verification_failed',
        razorpay_payment_id,
        razorpay_signature,
        updated_at: new Date().toISOString(),
      }, { razorpay_order_id });
      return res.status(400).json({ success: false, error: "Payment verification failed. Invalid signature." });
    }

    console.log("[Razorpay] Signature verified OK");

    // ── STEP 2: Fetch payment details from Razorpay ──────────────────────
    let paymentDetails = null;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (fetchErr) {
      console.warn("[Razorpay] Could not fetch payment details:", fetchErr);
    }

    // ── STEP 3: Read saved payment record (has items_snapshot) ────────────
    const { data: paymentRows } = await supabaseGet('payments', { razorpay_order_id }, '*');
    const paymentRow = paymentRows?.[0] || null;

    // ── STEP 4: Update payment record ────────────────────────────────────
    await supabasePatch('payments', {
      payment_status: 'captured',
      razorpay_status: paymentDetails?.status || 'captured',
      razorpay_payment_id,
      razorpay_signature,
      payment_method: paymentDetails?.method || null,
      transaction_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { razorpay_order_id });

    // ── STEP 5: Create or update the Supabase order (server-side) ────────
    // This bypasses RLS using the service_role key.
    const now = new Date();
    const nowISO = now.toISOString();
    const dateStr = nowISO.slice(0, 10).replace(/-/g, '');
    const orderNumber = Date.now();

    // Read items from payment snapshot
    let items = [];
    try {
      items = JSON.parse(paymentRow?.items_snapshot || '[]');
    } catch { items = []; }

    // Read canteen info for pickup counter and prep time
    let canteenName = '';
    let canteenId = paymentRow?.canteen_id || null;
    let institutionId = paymentRow?.institution_id || null;

    if (canteenId) {
      const { data: canteenRows } = await supabaseGet('canteens', { id: canteenId }, 'id, name, prep_time_minutes');
      if (canteenRows?.[0]) {
        canteenName = canteenRows[0].name || '';
      }
    }

    // Determine pickup type and prefix from canteen name
    const pickupPrefix = resolvePickupPrefix(canteenName);
    const estimatedPrepMinutes = 15;

    // Generate token number (today's sequence)
    let tokenNumber = `TKN-${String(orderNumber % 10000).padStart(4, '0')}`;
    try {
      const { data: tokenRows } = await supabaseGet('orders', {}, 'id');
      const todayOrders = (tokenRows || []).filter(o => {
        try { return new Date(o.id?.split?.('-')?.[0] || nowISO).toDateString() === now.toDateString(); } catch { return false; }
      }).length;
      tokenNumber = `TKN-${String(todayOrders + 1).padStart(4, '0')}`;
    } catch { /* use fallback */ }

    // Generate pickup code (today's sequence)
    let pickupCode = `${pickupPrefix}-0001`;
    try {
      const { data: allOrders } = await supabaseGet('orders', {}, 'id,pickup_code,created_at');
      const todayPickups = (allOrders || []).filter(o =>
        o.pickup_code && o.pickup_code.startsWith(pickupPrefix + '-') &&
        new Date(o.created_at).toDateString() === now.toDateString()
      ).length;
      pickupCode = `${pickupPrefix}-${String(todayPickups + 1).padStart(4, '0')}`;
    } catch { /* use fallback */ }

    // Calculate total from items
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0);

    // Read user profile for student_id / registration_id
    let profileRow = null;
    if (user_id) {
      const { data: profileRows } = await supabaseGet('profiles', { user_id }, 'student_id, registration_id, full_name');
      profileRow = profileRows?.[0] || null;
    }

    const customerName = paymentRow?.customer_name || profileRow?.full_name || 'Customer';
    const customerEmail = paymentRow?.customer_email || '';
    const customerPhone = paymentRow?.customer_phone || '0000000000';

    // Check if order already exists for this Razorpay order (idempotency)
    const { data: existingOrders } = await supabaseGet('orders', { razorpay_order_id }, 'id');
    if (existingOrders && existingOrders.length > 0 && existingOrders[0].id) {
      // Order already created — just return it
      const existingOrder = existingOrders[0];
      console.log("[Razorpay] Order already exists:", existingOrder.id);
      return res.json({
        success: true,
        message: "Payment verified and order confirmed.",
        payment_id: razorpay_payment_id,
        razorpay_order_id,
        order_id: existingOrder.id,
        order_created: true,
      });
    }

    // Build the order row
    const orderPayload = {
      student_id: user_id || null,
      registration_id: profileRow?.registration_id || null,
      email: customerEmail,
      customer_name: customerName,
      phone: customerPhone,
      institution_id: institutionId,
      canteen_id: canteenId,
      counter_code: canteenName || null,
      total_amount: totalAmount,
      transaction_amount: totalAmount,
      status: 'confirmed',
      order_status: 'confirmed',
      payment_status: 'paid',
      payment_method: 'razorpay',
      order_number: orderNumber,
      pickup_token: tokenNumber,
      pickup_code: pickupCode,
      pickup_type: pickupPrefix === 'B' ? 'breakfast' : pickupPrefix === 'L' ? 'lunch' : pickupPrefix === 'D' ? 'dinner' : pickupPrefix === 'F' ? 'faculty' : 'guest',
      qr_pickup_code: pickupCode,
      token_number: tokenNumber,
      notes: null,
      kitchen_status: 'pending',
      counter_status: 'incoming',
      estimated_ready_at: new Date(now.getTime() + estimatedPrepMinutes * 60000).toISOString(),
      cancel_deadline_at: new Date(now.getTime() + 30 * 1000).toISOString(),
      created_at: nowISO,
      updated_at: nowISO,
      paid_at: nowISO,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    };

    console.log("[Razorpay] Creating order:", JSON.stringify({ status: orderPayload.status, student_id: orderPayload.student_id, institution_id: orderPayload.institution_id }));

    const { data: createdOrders, error: orderError } = await supabasePost('orders', orderPayload);

    if (orderError || !createdOrders || createdOrders.length === 0) {
      console.error("[Razorpay] CRITICAL: Failed to create order:", orderError);
      // Payment succeeded but order creation failed — log for manual recovery
      await supabasePatch('payments', {
        order_creation_error: String(orderError || 'Unknown error'),
        needs_manual_order: true,
        updated_at: nowISO,
      }, { razorpay_order_id });

      return res.json({
        success: true,
        message: "Payment verified successfully. Order is being confirmed.",
        payment_id: razorpay_payment_id,
        razorpay_order_id,
        order_id: null,
        order_created: false,
        error_detail: "Order creation pending — payment is secured.",
      });
    }

    const createdOrder = createdOrders[0];
    console.log("[Razorpay] Order created:", createdOrder.id);

    // ── STEP 6: Create order_items (server-side, bypasses RLS) ───────────
    if (items.length > 0) {
      const orderItemsPayload = items.map(item => ({
        order_id: createdOrder.id,
        menu_item_id: item.id || null,
        name: item.name || 'Item',
        variant: item.variant || null,
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
        subtotal: Number(item.subtotal || (Number(item.price || 0) * Number(item.quantity || 1))),
        image_url: item.image_url || null,
        is_veg: item.is_veg !== undefined ? item.is_veg : null,
      }));

      const { error: itemsError } = await supabasePost('order_items', orderItemsPayload);
      if (itemsError) {
        console.error("[Razorpay] CRITICAL: Failed to create order_items:", itemsError);
        // Order exists but items missing — log for recovery
        await supabasePatch('orders', {
          items_creation_error: String(itemsError),
          updated_at: nowISO,
        }, { id: createdOrder.id });
      } else {
        console.log("[Razorpay] Order items created:", items.length, "items");
      }
    }

    // ── STEP 7: Create order_status_history (best-effort) ────────────────
    try {
      await supabasePost('order_status_history', [{
        order_id: createdOrder.id,
        user_id: user_id || null,
        institution_id: institutionId,
        from_status: null,
        to_status: 'confirmed',
        payment_status: 'paid',
        note: 'Payment verified and order created.',
        created_at: nowISO,
      }]);
    } catch (_) { /* best-effort */ }

    // ── STEP 8: Create notifications (best-effort) ───────────────────────
    try {
      const notifs = [];
      if (user_id) {
        notifs.push({
          type: 'order_confirmed',
          title: 'Order Confirmed!',
          message: 'Your order has been confirmed and is being prepared.',
          user_id,
          created_at: nowISO,
          read: false,
          order_id: createdOrder.id,
        });
      }
      if (institutionId) {
        notifs.push({
          type: 'new_order',
          title: 'New Order Received',
          message: 'A new order has been placed and payment confirmed.',
          institution_id: institutionId,
          created_at: nowISO,
          read: false,
          order_id: createdOrder.id,
        });
      }
      if (notifs.length > 0) await supabasePost('notifications', notifs);
    } catch (_) { /* best-effort */ }

    return res.json({
      success: true,
      message: "Payment verified and order created successfully.",
      payment_id: razorpay_payment_id,
      razorpay_order_id,
      order_id: createdOrder.id,
      order_created: true,
    });

  } catch (error) {
    console.error("[Razorpay] Verify payment error:", error);
    return res.status(500).json({
      error: error?.message || "Payment verification failed due to server error.",
    });
  }
}
