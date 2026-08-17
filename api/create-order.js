// Vercel Serverless Function: /api/create-order
// Creates a FOODEXA order + order_items using the service_role key (bypasses RLS).
// This is the SECONDARY order-creation path (fallback from verify-payment).
//
// Flow:
//   Frontend -> POST /api/razorpay/verify-payment (primary — verifies + creates order)
//   IF verify-payment returns order_created: false ->
//   Frontend -> POST /api/create-order (fallback — verifies + creates order)
//
// Idempotency: If an order already exists for the same razorpay_payment_id,
// the existing order is returned (no duplicates).

import crypto from "crypto";

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

function jsonRes(res, status, body) {
  return res.status(status).json(body);
}

function getHeaders() {
  return {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

async function sbGet(table, querystring, select = '*') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${querystring}&select=${select}`;
  const r = await fetch(url, { headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, Accept: 'application/json' } });
  if (!r.ok) return { data: null, error: await r.text() };
  const data = await r.json();
  return { data: Array.isArray(data) ? data : [data], error: null };
}

async function sbInsert(table, rows) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const r = await fetch(url, { method: 'POST', headers: getHeaders(), body: JSON.stringify(rows) });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* not json */ }
  if (!r.ok) return { data: null, error: text };
  return { data, error: null };
}

async function sbPatch(table, payload, filter) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) params.append(k, `eq.${v}`);
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;
  const r = await fetch(url, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(payload) });
  if (!r.ok) return { error: await r.text() };
  return { error: null };
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return jsonRes(res, 405, { success: false, error: 'Method Not Allowed. Use POST.', code: 'METHOD_NOT_ALLOWED' });
  }

  // Validate server configuration
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonRes(res, 500, { success: false, error: 'Server configuration error.', code: 'CONFIG_ERROR' });
  }

  try {
    const {
      student_id,
      user_id,
      email,
      customer_name,
      phone,
      institution_id,
      canteen_id,
      items,
      itemsFull,
      total_amount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_method,
      pickup_type,
      notes,
    } = req.body || {};

    // ── Validate required fields ──────────────────────────────────────
    if (!institution_id) {
      return jsonRes(res, 400, { success: false, error: 'Institution ID is required.', code: 'MISSING_INSTITUTION' });
    }
    if (!canteen_id) {
      return jsonRes(res, 400, { success: false, error: 'Canteen ID is required.', code: 'MISSING_CANTEEN' });
    }
    if (!items || !items.length) {
      return jsonRes(res, 400, { success: false, error: 'Order items are required.', code: 'MISSING_ITEMS' });
    }
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return jsonRes(res, 400, { success: false, error: 'Razorpay payment details are required.', code: 'MISSING_RAZORPAY' });
    }

    const orderItems = itemsFull || items;

    // ── STEP 1: Verify Razorpay signature (server-side) ───────────────
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeySecret) {
      return jsonRes(res, 500, { success: false, error: 'Server payment configuration error.', code: 'SECRET_MISSING' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('[create-order] Signature verification FAILED for order:', razorpay_order_id);
      return jsonRes(res, 400, { success: false, error: 'Payment verification failed. Invalid signature.', code: 'SIGNATURE_MISMATCH' });
    }

    console.log('[create-order] Signature verified OK for payment:', razorpay_payment_id);

    // ── STEP 2: Server-side amount validation ───────────────────────────
    let serverCalculatedTotal = 0;
    for (const item of orderItems) {
      const itemPrice = Number(item.price || item.offer_price || 0);
      const itemQty = Number(item.quantity || 1);
      serverCalculatedTotal += itemPrice * itemQty;
    }
    serverCalculatedTotal = Math.round(serverCalculatedTotal * 100) / 100;
    const sentTotal = Number(total_amount || 0);

    if (sentTotal > 0 && Math.abs(serverCalculatedTotal - sentTotal) > 1) {
      console.error('[create-order] Amount mismatch: server=', serverCalculatedTotal, 'client=', sentTotal);
      return jsonRes(res, 400, { success: false, error: 'Payment amount verification failed.', code: 'AMOUNT_MISMATCH' });
    }
    const finalTotal = serverCalculatedTotal > 0 ? serverCalculatedTotal : sentTotal;

    // ── STEP 3: Idempotency check — has this payment already been processed? ──
    const { data: existingByPayment } = await sbGet(
      'orders',
      `razorpay_payment_id=eq.${encodeURIComponent(razorpay_payment_id)}`,
      'id,order_number,status,payment_status'
    );

    if (existingByPayment && existingByPayment.length > 0 && existingByPayment[0].id) {
      console.log('[create-order] Order already exists (idempotent):', existingByPayment[0].id);
      return jsonRes(res, 200, {
        success: true,
        order_created: true,
        order_id: existingByPayment[0].id,
        order_number: existingByPayment[0].order_number,
        status: existingByPayment[0].status,
        already_existed: true,
      });
    }

    // Also check by razorpay_order_id
    const { data: existingByRpo } = await sbGet(
      'orders',
      `razorpay_order_id=eq.${encodeURIComponent(razorpay_order_id)}`,
      'id,order_number,status,payment_status'
    );

    if (existingByRpo && existingByRpo.length > 0 && existingByRpo[0].id) {
      console.log('[create-order] Order already exists by razorpay_order_id (idempotent):', existingByRpo[0].id);
      return jsonRes(res, 200, {
        success: true,
        order_created: true,
        order_id: existingByRpo[0].id,
        order_number: existingByRpo[0].order_number,
        status: existingByRpo[0].status,
        already_existed: true,
      });
    }

    // ── STEP 4: Resolve student_id ─────────────────────────────────────
    const effectiveUserId = student_id || user_id || null;
    let resolvedStudentId = null;

    if (effectiveUserId && email) {
      const { data: studentRows } = await sbGet(
        'students',
        `email=eq.${encodeURIComponent(email)}&institution_id=eq.${encodeURIComponent(institution_id)}`,
        'id'
      );
      if (studentRows?.[0]) {
        resolvedStudentId = studentRows[0].id;
      }
      if (!resolvedStudentId) {
        const studentName = customer_name || (email ? email.split('@')[0] : 'Customer');
        const { data: created } = await sbInsert('students', {
          email: email || '',
          full_name: studentName,
          institution_id,
        });
        if (created) {
          resolvedStudentId = Array.isArray(created) ? created[0]?.id : created.id;
        }
      }
    }

    // ── STEP 5: Validate canteen belongs to institution ────────────────
    let canteenName = '';
    if (canteen_id) {
      const { data: canteenRows } = await sbGet('canteens', `id=eq.${canteen_id}`, 'id,name,institution_id');
      if (canteenRows?.[0]) {
        canteenName = canteenRows[0].name || '';
        if (canteenRows[0].institution_id && canteenRows[0].institution_id !== institution_id) {
          return jsonRes(res, 400, { success: false, error: 'The selected canteen does not belong to your institution.', code: 'CANTEEN_MISMATCH' });
        }
      }
    }

    // ── STEP 6: Generate pickup code and token number ──────────────────
    const now = new Date();
    const nowISO = now.toISOString();
    const pickupPrefix = pickup_type || 'B';
    const orderNumber = Date.now();
    const pickupCode = `${pickupPrefix}-${String(orderNumber % 10000).padStart(4, '0')}`;
    const tokenNumber = `TKN-${String(orderNumber % 10000).padStart(4, '0')}`;

    // ── STEP 7: Build and insert the order ──────────────────────────────
    const orderPayload = {
      student_id: resolvedStudentId,
      email: email || '',
      customer_name: customer_name || (email ? email.split('@')[0] : 'Customer'),
      phone: phone || null,
      institution_id,
      canteen_id,
      counter: canteenName || 'Counter',
      counter_code: canteenName || 'Counter',
      total_amount: finalTotal,
      transaction_amount: finalTotal,
      status: 'pending',
      order_status: 'pending',
      payment_status: 'paid',
      payment_method: payment_method === 'cash' ? 'cash' : 'razorpay',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_number: orderNumber,
      pickup_code: pickupCode,
      qr_pickup_code: pickupCode,
      token_number: tokenNumber,
      pickup_token: tokenNumber,
      pickup_type: pickup_type || 'lunch',
      notes: notes || null,
      paid_at: nowISO,
      accepted_at: null,
      kitchen_status: 'pending',
      counter_status: 'incoming',
      estimated_ready_at: new Date(now.getTime() + 15 * 60000).toISOString(),
      cancel_deadline_at: new Date(now.getTime() + 30 * 1000).toISOString(),
      created_at: nowISO,
      updated_at: nowISO,
    };

    const { data: createdOrder, error: orderError } = await sbInsert('orders', [orderPayload]);

    if (orderError || !createdOrder || (Array.isArray(createdOrder) && createdOrder.length === 0)) {
      console.error('[create-order] Order insert failed:', orderError);
      return jsonRes(res, 500, { success: false, error: 'Order creation failed. Your payment status is being checked securely.', code: 'DB_ERROR' });
    }

    const orderRow = Array.isArray(createdOrder) ? createdOrder[0] : createdOrder;
    const orderId = orderRow?.id;
    if (!orderId) {
      return jsonRes(res, 500, { success: false, error: 'Order creation returned no ID.', code: 'NO_ORDER_ID' });
    }

    console.log('[create-order] Order created:', orderId);

    // ── STEP 8: Insert order_items ──────────────────────────────────────
    const orderItemsPayload = orderItems.map((item) => ({
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

    const { error: itemsError } = await sbInsert('order_items', orderItemsPayload);
    if (itemsError) {
      console.error('[create-order] order_items insert failed:', itemsError);
      await sbPatch('orders', { items_creation_error: itemsError, updated_at: nowISO }, { id: orderId });
    }

    // ── STEP 9: Update payment record ─────────────────────────────────
    if (razorpay_order_id) {
      await sbPatch('payments', {
        payment_status: 'paid',
        order_id: orderId,
        updated_at: nowISO,
      }, { razorpay_order_id });
    }

    // ── STEP 10: Create notifications (best-effort) ────────────────────
    const notifs = [];
    if (resolvedStudentId || student_id) {
      notifs.push({
        type: 'order_placed',
        title: 'Order Placed!',
        message: 'Your order has been placed and payment confirmed. Waiting for institution confirmation.',
        user_id: resolvedStudentId || student_id,
        created_at: nowISO,
        read: false,
        order_id: orderId,
      });
    }
    if (institution_id) {
      notifs.push({
        type: 'new_order',
        title: 'New Order Received',
        message: 'A new order has been placed and payment confirmed.',
        institution_id,
        created_at: nowISO,
        read: false,
        order_id: orderId,
      });
    }
    if (notifs.length > 0) {
      await sbInsert('notifications', notifs);
    }

    // ── STEP 11: Create order_status_history entry ─────────────────────
    await sbInsert('order_status_history', [{
      order_id: orderId,
      user_id: resolvedStudentId || student_id || null,
      institution_id,
      from_status: null,
      to_status: 'pending',
      payment_status: 'paid',
      note: 'Payment verified and order created via /api/create-order. Awaiting institution confirmation.',
      created_at: nowISO,
    }]);

    return jsonRes(res, 200, {
      success: true,
      order_created: true,
      order_id: orderId,
      order_number: orderRow.order_number,
      status: orderRow.status || 'confirmed',
    });

  } catch (error) {
    console.error('[create-order] Error:', error);
    return jsonRes(res, 500, {
      success: false,
      error: 'Order creation failed. Your payment status is being checked securely.',
      code: 'SERVER_ERROR',
    });
  }
}
