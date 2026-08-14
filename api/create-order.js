// Vercel Serverless Function: /api/create-order
// Creates a FOODEXA order + order_items using the service_role key (bypasses RLS).
// This is the SINGLE reliable order-creation path.
//
// Flow:
//   Frontend -> POST /api/razorpay/verify-payment (verifies signature)
//            -> POST /api/create-order (creates order + items)
//   OR
//   Frontend -> POST /api/razorpay/verify-payment (verifies + creates order atomically)
//
// Idempotency: If an order already exists for the same razorpay_payment_id /
// razorpay_order_id, the existing order is returned (no duplicates).

import Razorpay from "razorpay";
import crypto from "crypto";

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

function jsonError(res, status, message) {
  return res.status(status).json({ success: false, error: message });
}

async function supabaseFetch(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Server configuration error: missing Supabase credentials.');
  }
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}${path}`;
  const headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const resp = await fetch(url, { ...options, headers });
  const text = await resp.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
  return { resp, data, text };
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return jsonError(res, 405, 'Method Not Allowed. Use POST.');

  try {
    const {
      student_id,
      user_id,
      email,
      customer_name,
      phone,
      institution_id,
      canteen_id,
      counter,
      counter_code,
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
      return jsonError(res, 400, 'Institution ID is required.');
    }
    if (!canteen_id) {
      return jsonError(res, 400, 'Canteen ID is required.');
    }
    if (!items || !items.length) {
      return jsonError(res, 400, 'Order items are required.');
    }
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return jsonError(res, 400, 'Razorpay payment details are required.');
    }

    const orderItems = itemsFull || items;

    // ── STEP 1: Verify Razorpay signature (server-side) ───────────────
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeySecret) {
      return jsonError(res, 500, 'Server payment configuration error.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('[create-order] Signature verification FAILED for order:', razorpay_order_id);
      return jsonError(res, 400, 'Payment verification failed.');
    }

    console.log('[create-order] Signature verified OK for payment:', razorpay_payment_id);

    // ── STEP 2: Server-side amount validation ───────────────────────────
    // Calculate total from cart items (do NOT trust the browser's amount)
    let serverCalculatedTotal = 0;
    for (const item of orderItems) {
      const itemPrice = Number(item.price || item.offer_price || 0);
      const itemQty = Number(item.quantity || 1);
      serverCalculatedTotal += itemPrice * itemQty;
    }
    serverCalculatedTotal = Math.round(serverCalculatedTotal * 100) / 100;
    const sentTotal = Number(total_amount || 0);

    // Allow a small rounding tolerance (1 rupee) to handle currency conversion differences
    if (sentTotal > 0 && Math.abs(serverCalculatedTotal - sentTotal) > 1) {
      console.error('[create-order] Amount mismatch: server=', serverCalculatedTotal, 'client=', sentTotal);
      return jsonError(res, 400, 'Payment amount verification failed.');
    }
    const finalTotal = serverCalculatedTotal > 0 ? serverCalculatedTotal : sentTotal;

    // ── STEP 3: Idempotency check — has this payment already been processed? ──
    const { resp: existingResp } = await supabaseFetch(
      `/rest/v1/orders?razorpay_payment_id=eq.${encodeURIComponent(razorpay_payment_id)}&select=id,order_number,status,payment_status&limit=1`
    );

    if (existingResp.ok) {
      const existingData = await existingResp.json().catch(() => null);
      if (existingData && existingData.length > 0 && existingData[0].id) {
        console.log('[create-order] Order already exists (idempotent):', existingData[0].id);
        return res.json({
          success: true,
          order_created: true,
          order_id: existingData[0].id,
          order_number: existingData[0].order_number,
          status: existingData[0].status,
          already_existed: true,
        });
      }
    }

    // ── STEP 4: Resolve the correct student_id (UUID from students table) ──
    // The orders.student_id column references the students table UUID, NOT
    // a session ID string. We look up or create the student record.
    const effectiveUserId = student_id || user_id || null;
    let resolvedStudentId = null;

    if (effectiveUserId) {
      // Try to find existing student record by email or user_id
      const { resp: studentResp } = await supabaseFetch(
        `/rest/v1/students?email=eq.${encodeURIComponent(email || '')}&institution_id=eq.${encodeURIComponent(institution_id)}&select=id&limit=1`
      );
      if (studentResp.ok) {
        const studentData = await studentResp.json().catch(() => null);
        if (studentData && studentData.length > 0) {
          resolvedStudentId = studentData[0].id;
        }
      }

      // If not found, create a student record
      if (!resolvedStudentId) {
        const studentName = customer_name || (email ? email.split('@')[0] : 'Customer');
        const studentPayload = {
          email: email || '',
          full_name: studentName,
          institution_id,
          student_id: null,
          registration_id: null,
        };
        const { resp: createStudentResp, data: createdStudent } = await supabaseFetch('/rest/v1/students', {
          method: 'POST',
          body: JSON.stringify(studentPayload),
        });
        if (createStudentResp.ok && createdStudent && Array.isArray(createdStudent) && createdStudent[0]) {
          resolvedStudentId = createdStudent[0].id;
        } else if (createStudentResp.ok && createdStudent) {
          resolvedStudentId = createdStudent.id;
        }
      }
    }

    // ── STEP 5: Validate institution and canteen belong together ────────
    const { resp: canteenResp } = await supabaseFetch(
      `/rest/v1/canteens?id=eq.${encodeURIComponent(canteen_id)}&select=id,institution_id,name&limit=1`
    );
    let canteenName = '';
    let canteenInstId = '';
    if (canteenResp.ok) {
      const canteenData = await canteenResp.json().catch(() => null);
      if (canteenData && canteenData.length > 0) {
        canteenName = canteenData[0].name || '';
        canteenInstId = canteenData[0].institution_id || '';
      }
    }
    if (canteenInstId && canteenInstId !== institution_id) {
      return jsonError(res, 400, 'The selected canteen does not belong to your institution.');
    }

    // ── STEP 6: Validate menu items belong to the institution ────────────
    const menuItemIds = orderItems.map((i) => i.id || i.menu_item_id).filter(Boolean);
    if (menuItemIds.length !== orderItems.length) {
      return jsonError(res, 400, 'One or more cart items are invalid. Please refresh your cart.');
    }

    const { resp: menuResp } = await supabaseFetch(
      `/rest/v1/menu_items?${menuItemIds.map((id) => `id=eq.${id}`).join('&')}&select=id,institution_id,canteen_id&limit=100`
    );

    if (menuResp.ok) {
      const menuData = await menuResp.json().catch(() => null);
      if (menuData && menuData.length > 0) {
        for (const item of orderItems) {
          const mi = menuData.find((m) => m.id === (item.id || item.menu_item_id));
          if (!mi) {
            return jsonError(res, 400, 'One or more cart items are no longer available. Please refresh your cart.');
          }
          if (mi.institution_id && mi.institution_id !== institution_id) {
            return jsonError(res, 400, 'Your cart contains an item from another institution.');
          }
        }
      }
    }

    // ── STEP 7: Generate pickup code and token number ──────────────────
    const now = new Date();
    const nowISO = now.toISOString();
    const pickupPrefix = pickup_type || (counter_code || customer_name || '').trim().charAt(0).toUpperCase() || 'L';
    const dateStr = nowISO.slice(0, 10).replace(/-/g, '');
    const orderNumber = Date.now();

    // ── STEP 8: Build and insert the order ──────────────────────────────
    const orderPayload = {
      student_id: resolvedStudentId,
      email: email || '',
      customer_name: customer_name || (email ? email.split('@')[0] : 'Customer'),
      phone: phone || null,
      institution_id,
      canteen_id,
      counter: counter || canteenName || 'Counter',
      counter_code: counter_code || canteenName || 'Counter',
      counter_name: canteenName || null,
      canteen_name: canteenName || null,
      total_amount: finalTotal,
      transaction_amount: finalTotal,
      status: 'confirmed',
      order_status: 'confirmed',
      payment_status: 'paid',
      payment_method: payment_method === 'cash' ? 'cash' : 'razorpay',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_number: orderNumber,
      pickup_code: `${pickupPrefix}-${String(orderNumber % 10000).padStart(4, '0')}`,
      qr_pickup_code: `${pickupPrefix}-${String(orderNumber % 10000).padStart(4, '0')}`,
      token_number: `TKN-${String(orderNumber % 10000).padStart(4, '0')}`,
      pickup_token: `TKN-${String(orderNumber % 10000).padStart(4, '0')}`,
      pickup_type: pickup_type || 'lunch',
      notes: notes || null,
      paid_at: nowISO,
      accepted_at: nowISO,
      kitchen_status: 'pending',
      counter_status: 'incoming',
      estimated_ready_at: new Date(now.getTime() + 15 * 60000).toISOString(),
      cancel_deadline_at: new Date(now.getTime() + 30 * 1000).toISOString(),
      created_at: nowISO,
      updated_at: nowISO,
      institution_code: null,
    };

    const { resp: orderInsertResp, data: createdOrder, text: orderText } = await supabaseFetch('/rest/v1/orders', {
      method: 'POST',
      body: JSON.stringify([orderPayload]),
    });

    if (!orderInsertResp.ok) {
      console.error('[create-order] Order insert failed:', orderText);
      return jsonError(res, 500, 'Order creation failed. Please try again.');
    }

    const orderRow = Array.isArray(createdOrder) ? createdOrder[0] : createdOrder;
    const orderId = orderRow?.id || orderRow?.[0]?.id;
    if (!orderId) {
      return jsonError(res, 500, 'Order creation returned no ID.');
    }

    console.log('[create-order] Order created:', orderId);

    // ── STEP 9: Insert order_items ──────────────────────────────────────
    const orderItemsPayload = orderItems.map((item) => ({
      order_id: orderId,
      menu_item_id: item.id || item.menu_item_id || null,
      name: item.name || 'Item',
      variant: item.variant || item.food_type || item.category || null,
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
      subtotal: Number(item.subtotal || (Number(item.price || 0) * Number(item.quantity || 1))),
      image_url: item.image_url || null,
      is_veg: item.is_veg !== undefined ? item.is_veg : null,
    }));

    const { resp: itemsResp, text: itemsText } = await supabaseFetch('/rest/v1/order_items', {
      method: 'POST',
      body: JSON.stringify(orderItemsPayload),
    });

    if (!itemsResp.ok) {
      console.error('[create-order] order_items insert failed:', itemsText);
      // Order was created but items failed. Mark order for recovery.
      await supabaseFetch(`/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ items_creation_error: itemsText || 'Unknown error', updated_at: new Date().toISOString() }),
      });
    }

    // ── STEP 10: Update payment record ─────────────────────────────────
    if (razorpay_order_id) {
      await supabaseFetch(`/rest/v1/payments?razorpay_order_id=eq.${encodeURIComponent(razorpay_order_id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          payment_status: 'paid',
          order_id: orderId,
          updated_at: new Date().toISOString(),
        }),
      });
    }

    // ── STEP 11: Create notifications (best-effort) ────────────────────
    const notifs = [];
    if (resolvedStudentId || student_id) {
      notifs.push({
        type: 'order_confirmed',
        title: 'Order Confirmed!',
        message: 'Your order has been confirmed and is being prepared.',
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
      await supabaseFetch('/rest/v1/notifications', {
        method: 'POST',
        body: JSON.stringify(notifs),
      });
    }

    // ── STEP 12: Create order_status_history entry ─────────────────────
    await supabaseFetch('/rest/v1/order_status_history', {
      method: 'POST',
      body: JSON.stringify([{
        order_id: orderId,
        user_id: resolvedStudentId || student_id || null,
        institution_id,
        from_status: null,
        to_status: 'confirmed',
        payment_status: 'paid',
        note: 'Payment verified and order created via /api/create-order.',
        created_at: nowISO,
      }]),
    });

    return res.json({
      success: true,
      order_created: true,
      order_id: orderId,
      order_number: orderRow.order_number,
      status: orderRow.status || 'confirmed',
    });

  } catch (error) {
    console.error('[create-order] Error:', error);
    return jsonError(res, 500, 'Order creation failed. Please try again.');
  }
}
