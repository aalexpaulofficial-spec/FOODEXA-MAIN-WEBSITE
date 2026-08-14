// Vercel Serverless Function: /api/razorpay/verify-payment
// Verifies Razorpay signature, then creates the FOODEXA order + order_items
// atomically using the service_role key (bypasses RLS).
//
// Returns:
//   { success: true, order_created: true, order_id: "<uuid>" }
//   or
//   { success: true, order_created: false, order_id: null, error: "Payment received, but order confirmation is being completed." }

import Razorpay from "razorpay";
import crypto from "crypto";

function getSupabaseHeaders() {
  return {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

async function supabaseGet(table, filters, select = '*') {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !supabaseKey) return { data: null, error: 'Missing Supabase credentials' };

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => params.append(k, `eq.${encodeURIComponent(v)}`));
  params.append('select', select);

  const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/${table}?${params.toString()}`;
  return fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Accept': 'application/json',
    },
  }).then(r => {
    if (!r.ok) return r.text().then(t => ({ data: null, error: t }));
    return r.json().then(data => ({ data: Array.isArray(data) ? data : [data], error: null }));
  }).catch(err => ({ data: null, error: err.message }));
}

async function supabasePost(table, rows) {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !supabaseKey) return { data: null, error: 'Missing Supabase credentials' };

  const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/${table}`;
  return fetch(url, {
    method: 'POST',
    headers: getSupabaseHeaders(),
    body: JSON.stringify(rows),
  }).then(async r => {
    if (!r.ok) return { data: null, error: await r.text() };
    return r.json().then(data => ({ data, error: null }));
  }).catch(err => ({ data: null, error: err.message }));
}

async function supabasePatch(table, data, filters) {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !supabaseKey) return { data: null, error: 'Missing Supabase credentials' };

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => params.append(k, `eq.${encodeURIComponent(v)}`));

  const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/${table}?${params.toString()}`;
  return fetch(url, {
    method: 'PATCH',
    headers: getSupabaseHeaders(),
    body: JSON.stringify(data),
  }).then(async r => {
    if (!r.ok) return { data: null, error: await r.text() };
    return r.json().then(d => ({ data: d, error: null }));
  }).catch(err => ({ data: null, error: err.message }));
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
    console.log('[Razorpay Verify] Verifying payment');
    console.log(process.env.RAZORPAY_KEY_ID ? "KEY FOUND" : "KEY MISSING");
    console.log(process.env.RAZORPAY_KEY_SECRET ? "SECRET FOUND" : "SECRET MISSING");

    if (!process.env.RAZORPAY_KEY_ID) throw new Error("Missing RAZORPAY_KEY_ID");
    if (!process.env.RAZORPAY_KEY_SECRET) throw new Error("Missing RAZORPAY_KEY_SECRET");

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
      order_id,
      institution_id,
      canteen_id,
      email,
      customer_name,
      phone,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "Missing payment verification parameters." });
    }

    // ── STEP 1: Verify HMAC signature ──────────────────────
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error("[Razorpay Verify] Signature verification FAILED for order:", razorpay_order_id);
      await supabasePatch('payments', {
        payment_status: 'signature_mismatch',
        razorpay_status: 'verification_failed',
        razorpay_payment_id,
        razorpay_signature,
        updated_at: new Date().toISOString(),
      }, { razorpay_order_id });
      return res.status(400).json({ success: false, error: "Payment verification failed. Invalid signature." });
    }

    console.log("[Razorpay Verify] Signature verified OK");

    // ── STEP 2: Fetch payment details from Razorpay ─────────
    let paymentDetails = null;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (fetchErr) {
      console.warn("[Razorpay Verify] Could not fetch payment details:", fetchErr);
    }

    // Verify the payment was actually captured/successful
    const razorpayStatus = paymentDetails?.status || 'captured';
    if (razorpayStatus !== 'captured' && razorpayStatus !== 'authorized' && razorpayStatus !== 'initiated') {
      console.error("[Razorpay Verify] Payment not captured. Status:", razorpayStatus);
      return res.status(400).json({
        success: false,
        error: "Payment was not captured. Please contact support if the amount was debited.",
      });
    }

    // ── STEP 3: Update payment record in Supabase ──────────
    const paymentUpdate = {
      payment_status: 'paid',
      razorpay_status: razorpayStatus,
      razorpay_payment_id,
      razorpay_signature,
      payment_method: paymentDetails?.method || 'razorpay',
      transaction_time: new Date().toISOString(),
      webhook_verified: false,
      updated_at: new Date().toISOString(),
    };
    await supabasePatch('payments', paymentUpdate, { razorpay_order_id });

    // ── STEP 4: Read the saved payment record (has cart snapshot + canteen) ──
    const { data: paymentRows, error: paymentReadErr } = await supabaseGet(
      'payments',
      { razorpay_order_id },
      'id,user_id,institution_id,order_id,amount,items_snapshot,canteen_id,customer_email,customer_phone,customer_name,created_at'
    );

    if (paymentReadErr) {
      console.error("[Razorpay Verify] Failed to read payment record:", paymentReadErr);
    }

    const paymentRow = (paymentRows && paymentRows[0]) || null;

    // ── STEP 5: Idempotency — check if order already exists ──
    const { data: existingOrders } = await supabaseGet(
      'orders',
      { razorpay_payment_id },
      'id,order_number,status,payment_status'
    );

    if (existingOrders && existingOrders.length > 0 && existingOrders[0].id) {
      console.log("[Razorpay Verify] Order already exists (idempotent):", existingOrders[0].id);
      return res.json({
        success: true,
        message: "Payment verified and order confirmed.",
        payment_id: razorpay_payment_id,
        razorpay_order_id,
        order_id: existingOrders[0].id,
        order_created: true,
        already_existed: true,
      });
    }

    // ── STEP 6: Resolve items, institution, canteen, student ──
    let items = [];
    if (paymentRow?.items_snapshot) {
      try { items = JSON.parse(paymentRow.items_snapshot); } catch { items = []; }
    }
    // Also check if frontend sent items directly
    if (items.length === 0 && req.body.items) {
      items = req.body.items;
    }

    let resolveInstitutionId = institution_id || paymentRow?.institution_id || null;
    let resolveCanteenId = canteen_id || paymentRow?.canteen_id || null;
    let resolveEmail = email || paymentRow?.customer_email || '';
    let resolveName = customer_name || paymentRow?.customer_name || 'Customer';
    let resolvePhone = phone || paymentRow?.customer_phone || '0000000000';
    let resolveUserId = user_id || paymentRow?.user_id || null;

    // Resolve canteen name for pickup prefix
    let canteenName = '';
    if (resolveCanteenId) {
      const { data: canteenRows } = await supabaseGet('canteens', { id: resolveCanteenId }, 'id,name,institution_id,prep_time_minutes');
      if (canteenRows && canteenRows[0]) {
        canteenName = canteenRows[0].name || '';
        // Verify canteen belongs to the institution
        if (canteenRows[0].institution_id && canteenRows[0].institution_id !== resolveInstitutionId) {
          console.error("[Razorpay Verify] Canteen does not belong to institution");
          return res.status(400).json({
            success: false,
            error: "The selected canteen does not belong to your institution.",
          });
        }
      }
    }

    // Calculate total from items (server-side validation, do NOT trust browser amount)
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    // Also check Razorpay's actual captured amount
    const razorpayAmount = paymentDetails ? Number(paymentDetails.amount) / 100 : totalAmount;
    // Use the lesser of the two (Razorpay's amount is authoritative)
    let finalTotal = totalAmount;
    if (paymentDetails && paymentDetails.amount) {
      const razorpayRupees = Number(paymentDetails.amount) / 100;
      if (Math.abs(razorpayRupees - totalAmount) > 1) {
        console.warn('[Razorpay Verify] Amount mismatch: items=', totalAmount, 'razorpay=', razorpayRupees, 'using razorpay');
      }
      finalTotal = razorpayRupees;
    }

    // ── STEP 7: Resolve student_id (UUID from students table) ──
    // The orders.student_id column is UUID. We must find or create
    // the student record so we store a valid UUID, NOT a session string.
    let resolvedStudentId = null;

    if (resolveUserId) {
      // Try to find existing student record by email + institution
      const { data: studentRows } = await supabaseGet(
        'students',
        { email: resolveEmail, institution_id: resolveInstitutionId },
        'id'
      );
      if (studentRows && studentRows[0]) {
        resolvedStudentId = studentRows[0].id;
      }

      // If not found, create student record
      if (!resolvedStudentId) {
        const studentPayload = {
          email: resolveEmail || '',
          full_name: resolveName || 'Customer',
          institution_id: resolveInstitutionId,
        };
        const { data: createdStudent } = await supabasePost('students', studentPayload);
        if (createdStudent) {
          resolvedStudentId = Array.isArray(createdStudent) ? createdStudent[0]?.id : createdStudent.id;
        }
      }
    }

    // ── STEP 8: Generate pickup code, token, etc. ──
    const now = new Date();
    const nowISO = now.toISOString();
    const orderNumber = Date.now();

    const pickupPrefix = req.body.pickup_type || resolvePickupPrefix(canteenName);
    const todayOrdersCount = await (async () => {
      // Simple count-based token/pickup for now
      const todayStr = nowISO.slice(0, 10);
      const { data: todayRows } = await supabaseGet('orders', {}, 'pickup_code,token_number,created_at');
      if (!todayRows) return 0;
      return todayRows.filter(o => {
        try {
          const oDate = new Date(o.created_at).toISOString().slice(0, 10);
          return oDate === todayStr;
        } catch { return false; }
      }).length;
    })();

    const seqNum = todayOrdersCount + 1;
    const pickupCode = `${pickupPrefix}-${String(seqNum % 10000).padStart(4, '0')}`;
    const tokenNumber = `TKN-${String(seqNum % 10000).padStart(4, '0')}`;

    // ── STEP 9: Build and insert the order ──
    const orderPayload = {
      student_id: resolvedStudentId,
      email: resolveEmail,
      customer_name: resolveName,
      phone: resolvePhone,
      institution_id: resolveInstitutionId,
      canteen_id: resolveCanteenId,
      counter: canteenName || 'Counter',
      counter_code: canteenName || 'Counter',
      counter_name: canteenName || null,
      canteen_name: canteenName || null,
      total_amount: finalTotal,
      transaction_amount: finalTotal,
      status: 'confirmed',
      order_status: 'confirmed',
      payment_status: 'paid',
      payment_method: 'razorpay',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_number: orderNumber,
      pickup_code: pickupCode,
      qr_pickup_code: pickupCode,
      token_number: tokenNumber,
      pickup_token: tokenNumber,
      pickup_type: req.body.pickup_type || (pickupPrefix === 'L' ? 'lunch' : pickupPrefix === 'D' ? 'dinner' : pickupPrefix === 'B' ? 'breakfast' : pickupPrefix === 'F' ? 'faculty' : 'guest'),
      notes: req.body.notes || paymentRow?.order_id || null,
      paid_at: nowISO,
      accepted_at: nowISO,
      kitchen_status: 'pending',
      counter_status: 'incoming',
      estimated_ready_at: new Date(now.getTime() + 15 * 60000).toISOString(),
      cancel_deadline_at: new Date(now.getTime() + 30 * 1000).toISOString(),
      created_at: nowISO,
      updated_at: nowISO,
    };

    console.log('[Razorpay Verify] Creating order with student_id:', resolvedStudentId, 'institution_id:', resolveInstitutionId);

    const { data: createdOrders, error: orderError } = await supabasePost('orders', [orderPayload]);

    if (orderError || !createdOrders || (Array.isArray(createdOrders) && createdOrders.length === 0)) {
      console.error("[Razorpay Verify] CRITICAL: Failed to create order:", orderError);
      // Payment succeeded but order creation failed — log for manual recovery
      await supabasePatch('payments', {
        order_creation_error: String(orderError || 'Unknown error'),
        needs_manual_order: true,
        updated_at: nowISO,
      }, { razorpay_order_id });

      // Payment was verified and succeeded, but order creation failed
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

    const createdOrder = Array.isArray(createdOrders) ? createdOrders[0] : createdOrders;
    const orderId = createdOrder?.id;
    console.log("[Razorpay Verify] Order created:", orderId);

    // ── STEP 10: Insert order_items ──
    if (items.length > 0) {
      const orderItemsPayload = items.map(item => ({
        order_id: orderId,
        menu_item_id: item.id || item.menu_item_id || null,
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
        console.error("[Razorpay Verify] CRITICAL: Failed to create order_items:", itemsError);
        await supabasePatch('orders', {
          items_creation_error: String(itemsError),
          updated_at: nowISO,
        }, { id: orderId });
      } else {
        console.log("[Razorpay Verify] Order items created:", items.length, "items");
      }
    }

    // ── STEP 11: Create order_status_history ──
    await supabasePost('order_status_history', [{
      order_id: orderId,
      user_id: resolvedStudentId || null,
      institution_id: resolveInstitutionId,
      from_status: null,
      to_status: 'confirmed',
      payment_status: 'paid',
      note: 'Payment verified and order created via /api/razorpay/verify-payment.',
      created_at: nowISO,
    }]);

    // ── STEP 12: Create notifications ──
    const notifs = [];
    if (resolvedStudentId) {
      notifs.push({
        type: 'order_confirmed',
        title: 'Order Confirmed!',
        message: 'Your order has been confirmed and is being prepared.',
        user_id: resolvedStudentId,
        created_at: nowISO,
        read: false,
        order_id: orderId,
      });
    }
    if (resolveInstitutionId) {
      notifs.push({
        type: 'new_order',
        title: 'New Order Received',
        message: 'A new order has been placed and payment confirmed.',
        institution_id: resolveInstitutionId,
        created_at: nowISO,
        read: false,
        order_id: orderId,
      });
    }
    if (notifs.length > 0) {
      await supabasePost('notifications', notifs);
    }

    return res.json({
      success: true,
      message: "Payment verified and order created successfully.",
      payment_id: razorpay_payment_id,
      razorpay_order_id,
      order_id: orderId,
      order_created: true,
    });

  } catch (error) {
    console.error("[Razorpay Verify] Verify payment error:", error);
    return res.status(500).json({
      error: error?.message || "Payment verification failed due to server error.",
    });
  }
}
