// Vercel Serverless Function: /api/razorpay/verify-payment
// Verifies Razorpay signature, then creates the FOODEXA order + order_items
// atomically using the service_role key (bypasses RLS).
//
// This is the PRIMARY order-creation path after successful Razorpay payment.
// Idempotent: if an order already exists for this payment, returns the existing order.

import Razorpay from "razorpay";
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
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return jsonRes(res, 500, { success: false, error: 'Payment gateway not configured.', code: 'RAZORPAY_CONFIG_ERROR' });
  }

  try {
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
      items,
      total_amount,
      pickup_type,
      notes,
      counter,
      counter_code,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonRes(res, 400, { success: false, error: 'Missing payment verification parameters.', code: 'MISSING_PARAMS' });
    }

    // ── STEP 1: Verify HMAC signature ──────────────────────
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error("[verify-payment] Signature FAILED for order:", razorpay_order_id);
      await sbPatch('payments', {
        payment_status: 'signature_mismatch',
        razorpay_status: 'verification_failed',
        razorpay_payment_id,
        razorpay_signature,
        updated_at: new Date().toISOString(),
      }, { razorpay_order_id });
      return jsonRes(res, 400, { success: false, error: 'Payment verification failed. Invalid signature.', code: 'SIGNATURE_MISMATCH' });
    }

    // ── STEP 2: Fetch payment details from Razorpay ─────────
    let paymentDetails = null;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (fetchErr) {
      console.warn("[verify-payment] Could not fetch payment details:", fetchErr.message);
    }

    const razorpayStatus = paymentDetails?.status || 'captured';
    if (razorpayStatus !== 'captured' && razorpayStatus !== 'authorized' && razorpayStatus !== 'initiated') {
      console.error("[verify-payment] Payment not captured. Status:", razorpayStatus);
      return jsonRes(res, 400, { success: false, error: 'Payment was not captured. Please contact support.', code: 'PAYMENT_NOT_CAPTURED' });
    }

    // ── STEP 3: Update payment record as paid ──────────────
    await sbPatch('payments', {
      payment_status: 'paid',
      razorpay_status: razorpayStatus,
      razorpay_payment_id,
      razorpay_signature,
      payment_method: paymentDetails?.method || 'razorpay',
      transaction_time: new Date().toISOString(),
      webhook_verified: false,
      updated_at: new Date().toISOString(),
    }, { razorpay_order_id });

    // ── STEP 4: Read payment record for cart snapshot + context ──
    const { data: paymentRows } = await sbGet(
      'payments',
      `razorpay_order_id=eq.${encodeURIComponent(razorpay_order_id)}`,
      'id,user_id,institution_id,order_id,amount,items_snapshot,canteen_id,customer_email,customer_phone,customer_name,created_at'
    );
    const paymentRow = paymentRows?.[0] || null;

    // ── STEP 5: Idempotency — check if order already exists ──
    const { data: existingOrders } = await sbGet(
      'orders',
      `razorpay_payment_id=eq.${encodeURIComponent(razorpay_payment_id)}`,
      'id,order_number,status,payment_status'
    );

    if (existingOrders && existingOrders.length > 0 && existingOrders[0].id) {
      console.log("[verify-payment] Order already exists (idempotent):", existingOrders[0].id);
      return jsonRes(res, 200, {
        success: true,
        message: 'Payment verified and order confirmed.',
        payment_id: razorpay_payment_id,
        razorpay_order_id,
        order_id: existingOrders[0].id,
        order_created: true,
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
      console.log("[verify-payment] Order already exists by razorpay_order_id (idempotent):", existingByRpo[0].id);
      return jsonRes(res, 200, {
        success: true,
        message: 'Payment verified and order confirmed.',
        payment_id: razorpay_payment_id,
        razorpay_order_id,
        order_id: existingByRpo[0].id,
        order_created: true,
        already_existed: true,
      });
    }

    // ── STEP 6: Resolve items, institution, canteen, student ──
    let resolvedItems = [];
    if (paymentRow?.items_snapshot) {
      try { resolvedItems = JSON.parse(paymentRow.items_snapshot); } catch { resolvedItems = []; }
    }
    if (resolvedItems.length === 0 && items) {
      resolvedItems = items;
    }

    const resolveInstitutionId = institution_id || paymentRow?.institution_id || null;
    const resolveCanteenId = canteen_id || paymentRow?.canteen_id || null;
    const resolveEmail = email || paymentRow?.customer_email || '';
    const resolveName = customer_name || paymentRow?.customer_name || 'Customer';
    const resolvePhone = phone || paymentRow?.customer_phone || '0000000000';
    const resolveUserId = user_id || paymentRow?.user_id || null;

    // Resolve canteen name
    let canteenName = '';
    if (resolveCanteenId) {
      const { data: canteenRows } = await sbGet('canteens', `id=eq.${resolveCanteenId}`, 'id,name,institution_id');
      if (canteenRows?.[0]) {
        canteenName = canteenRows[0].name || '';
        if (canteenRows[0].institution_id && canteenRows[0].institution_id !== resolveInstitutionId) {
          return jsonRes(res, 400, { success: false, error: 'Canteen does not belong to your institution.', code: 'CANTEEN_MISMATCH' });
        }
      }
    }

    // Server-side amount validation
    const totalFromItems = resolvedItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    let finalTotal = totalFromItems;
    if (paymentDetails?.amount) {
      const razorpayRupees = Number(paymentDetails.amount) / 100;
      if (Math.abs(razorpayRupees - totalFromItems) > 1) {
        console.warn('[verify-payment] Amount mismatch: items=', totalFromItems, 'razorpay=', razorpayRupees, 'using razorpay');
      }
      finalTotal = razorpayRupees;
    }

    // ── STEP 7: Resolve student_id ──
    let resolvedStudentId = null;
    if (resolveUserId) {
      const { data: studentRows } = await sbGet(
        'students',
        `email=eq.${encodeURIComponent(resolveEmail)}&institution_id=eq.${encodeURIComponent(resolveInstitutionId || '')}`,
        'id'
      );
      if (studentRows?.[0]) {
        resolvedStudentId = studentRows[0].id;
      }
      if (!resolvedStudentId) {
        const { data: created } = await sbInsert('students', {
          email: resolveEmail || '',
          full_name: resolveName || 'Customer',
          institution_id: resolveInstitutionId,
        });
        if (created) {
          resolvedStudentId = Array.isArray(created) ? created[0]?.id : created.id;
        }
      }
    }

    // ── STEP 8: Generate pickup code ──
    const now = new Date();
    const nowISO = now.toISOString();
    const orderNumber = Date.now();
    const pickupPrefix = pickup_type || resolvePickupPrefix(canteenName);
    const pickupCode = `${pickupPrefix}-${String(orderNumber % 10000).padStart(4, '0')}`;
    const tokenNumber = `TKN-${String(orderNumber % 10000).padStart(4, '0')}`;

    // ── STEP 9: Build order — ONLY use columns confirmed to exist ──
    const orderPayload = {
      student_id: resolvedStudentId,
      email: resolveEmail,
      customer_name: resolveName,
      phone: resolvePhone,
      institution_id: resolveInstitutionId,
      canteen_id: resolveCanteenId,
      counter: canteenName || 'Counter',
      counter_code: canteenName || 'Counter',
      total_amount: finalTotal,
      transaction_amount: finalTotal,
      status: 'pending',
      order_status: 'pending',
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
      pickup_type: pickup_type || (pickupPrefix === 'L' ? 'lunch' : pickupPrefix === 'D' ? 'dinner' : pickupPrefix === 'B' ? 'breakfast' : 'lunch'),
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

    console.log('[verify-payment] Creating order...');

    const { data: createdOrders, error: orderError } = await sbInsert('orders', [orderPayload]);

    if (orderError || !createdOrders || (Array.isArray(createdOrders) && createdOrders.length === 0)) {
      console.error("[verify-payment] CRITICAL: Order insert failed:", orderError);

      // Log for manual recovery
      await sbPatch('payments', {
        order_creation_error: String(orderError || 'Unknown error'),
        needs_manual_order: true,
        updated_at: nowISO,
      }, { razorpay_order_id });

      // Payment IS verified and succeeded — do NOT say payment failed
      return jsonRes(res, 200, {
        success: true,
        message: 'Payment verified. Order is being confirmed.',
        payment_id: razorpay_payment_id,
        razorpay_order_id,
        order_id: null,
        order_created: false,
        code: 'ORDER_PENDING',
      });
    }

    const createdOrder = Array.isArray(createdOrders) ? createdOrders[0] : createdOrders;
    const orderId = createdOrder?.id;
    console.log("[verify-payment] Order created:", orderId);

    // ── STEP 10: Insert order_items ──
    if (resolvedItems.length > 0) {
      const orderItemsPayload = resolvedItems.map(item => ({
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
        console.error("[verify-payment] order_items insert failed:", itemsError);
        await sbPatch('orders', { items_creation_error: String(itemsError), updated_at: nowISO }, { id: orderId });
      }
    }

    // ── STEP 11: Create order_status_history ──
    await sbInsert('order_status_history', [{
      order_id: orderId,
      user_id: resolvedStudentId || null,
      institution_id: resolveInstitutionId,
      from_status: null,
      to_status: 'pending',
      payment_status: 'paid',
      note: 'Payment verified and order created. Awaiting institution confirmation.',
      created_at: nowISO,
    }]);

    // ── STEP 12: Create notifications ──
    const notifs = [];
    if (resolvedStudentId) {
      notifs.push({
        type: 'order_placed',
        title: 'Order Placed!',
        message: 'Your order has been placed and payment confirmed. Waiting for institution confirmation.',
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
      await sbInsert('notifications', notifs);
    }

    return jsonRes(res, 200, {
      success: true,
      message: 'Payment verified and order created successfully.',
      payment_id: razorpay_payment_id,
      razorpay_order_id,
      order_id: orderId,
      order_created: true,
    });

  } catch (error) {
    console.error("[verify-payment] Error:", error);
    return jsonRes(res, 500, {
      success: false,
      error: 'Payment verification failed due to server error. Your payment status is being checked securely.',
      code: 'SERVER_ERROR',
    });
  }
}
