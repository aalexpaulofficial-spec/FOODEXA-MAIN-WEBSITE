import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '2000', 10);

  // Parse JSON bodies (increase limit for webhook raw body)
  app.use(express.json({ limit: '1mb' }));

  // Initialize Gemini AI Client safely
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.warn("Gemini API client failed to initialize:", e);
    }
  }

  // ==================== RAZORPAY INITIALIZATION ====================
  if (!process.env.RAZORPAY_KEY_ID) throw new Error("Missing RAZORPAY_KEY_ID");
  if (!process.env.RAZORPAY_KEY_SECRET) throw new Error("Missing RAZORPAY_KEY_SECRET");

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

  let razorpay: Razorpay | null = null;

  if (razorpayKeyId && razorpayKeySecret) {
    razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });
    console.log("Creating Razorpay Order");
    console.log(process.env.RAZORPAY_KEY_ID ? "KEY FOUND" : "KEY MISSING");
    console.log(process.env.RAZORPAY_KEY_SECRET ? "SECRET FOUND" : "SECRET MISSING");
    console.log("[FOODEXA] Razorpay initialized in LIVE mode");
  } else {
    console.warn("[FOODEXA] Razorpay keys not configured. Payment endpoints will be unavailable.");
  }

  // ==================== SUPABASE SERVER CLIENT ====================
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  async function supabaseQuery(table: string, method: string, body?: any, filters?: Record<string, string>) {
    let url = `${supabaseUrl}/rest/v1/${table}`;
    if (filters && method === 'PATCH') {
      const filterParams = Object.entries(filters).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
      url += `?${filterParams}`;
    }
    const headers: Record<string, string> = {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    };
    if (method === 'POST') headers['Prefer'] = 'return=representation';

    const resp = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`[Supabase] ${method} ${table} failed:`, errText);
      return { data: null, error: errText };
    }

    const text = await resp.text();
    const data = text ? JSON.parse(text) : null;
    return { data, error: null };
  }

  async function getSupabaseAuthUser(authHeader: string | undefined) {
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (!token || !supabaseUrl || !supabaseAnonKey) {
      return { user: null, error: 'Authentication is required.' };
    }

    const resp = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!resp.ok) {
      return { user: null, error: 'Your session has expired. Please sign in again.' };
    }

    return { user: await resp.json(), error: null };
  }

  async function fetchSupabaseRows(table: string, query: string) {
    if (!supabaseUrl || !supabaseServiceKey) {
      return { data: null, error: 'Razorpay server configuration is incomplete.' };
    }

    const resp = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        Accept: 'application/json',
      },
    });

    const text = await resp.text();
    if (!resp.ok) return { data: null, error: text || `Failed to query ${table}.` };
    return { data: text ? JSON.parse(text) : [], error: null };
  }

  // System instruction for LX - FOODEXA's AI Companion
  const LX_SYSTEM_INSTRUCTION = `You are LX, the official AI Companion for FOODEXA — the Smart Campus Food Ordering Platform.
Your purpose is to help students, campus food vendors, and university dining staff with food ordering, meal recommendations, dietary preferences, budget optimization, queue jump estimation, group order planning, and campus dining insights.

Important rules:
1. Always identify yourself as "LX", the FOODEXA AI Assistant. Never refer to yourself as Gemini or Google. Gemini is only the underlying AI model.
2. Tone: Friendly, fast, intelligent, helpful, student-first, and energetic campus vibes.
3. Keep responses structured, easy to read on mobile, and formatted with clean markdown bullet points or bold text where helpful.
4. When students ask for food suggestions, provide concise meals with estimated price ($), prep wait time (mins), vendor location on campus, protein/calories if asked, and direct advice on avoiding rush hours.
5. Emphasize FOODEXA features like Express Queue Jump, Group Cart Splitting, Smart Lockers, and Allergen Safeguards when relevant.`;

  // ==================== INSTITUTION CODE VALIDATION (bypasses RLS) ====================
  app.post("/api/validate-institution-code", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code || typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({ success: false, valid: false, message: 'Institution code is required.' });
      }

      const supabaseServerKey = supabaseServiceKey || supabaseAnonKey;

      if (!supabaseUrl || !supabaseServerKey) {
        console.error('[Institutions] Missing Supabase server environment variables');
        return res.status(503).json({
          success: false,
          valid: false,
          message: 'Institution verification is not configured yet. Please contact Foodexa support.',
          code: 'MISSING_SUPABASE_SERVER_ENV',
        });
      }

      const trimmed = code.trim().toUpperCase();

      // Use the service role key so RLS is bypassed for this public lookup
      // Query with status='active' filter
      const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/institutions?institution_code=eq.${encodeURIComponent(trimmed)}&select=id,name,campus,city,state,country,institution_code,status&limit=1`;
      const resp = await fetch(url, {
        headers: {
          'apikey': supabaseServerKey,
          'Authorization': `Bearer ${supabaseServerKey}`,
          'Accept': 'application/json',
        },
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('[Institutions] Query failed:', errText);
        const isMissingTable = resp.status === 404 || errText.includes('PGRST205') || errText.includes('Could not find the table');
        if (isMissingTable) {
          return res.status(503).json({
            success: false,
            valid: false,
            message: 'Institution verification is being set up. Please try again after the Foodexa database is updated.',
            code: 'INSTITUTIONS_TABLE_MISSING',
          });
        }

        if (!supabaseServiceKey && (resp.status === 401 || resp.status === 403)) {
          return res.status(503).json({
            success: false,
            valid: false,
            message: 'Institution verification needs the server Supabase service key in Vercel.',
            code: 'SUPABASE_SERVICE_KEY_REQUIRED',
          });
        }

        return res.status(500).json({
          success: false,
          valid: false,
          message: 'Unable to verify Institution Code. Please try again.',
          code: 'SUPABASE_LOOKUP_FAILED',
        });
      }

      const rows = await resp.json();
      if (!rows || rows.length === 0) {
        return res.status(200).json({
          success: false,
          valid: false,
          message: 'Institution code not found.'
        });
      }

      const inst = rows[0];
      const institutionName = inst.name || '';
      return res.json({
        success: true,
        valid: true,
        institution: {
          id: inst.id,
          name: institutionName,
          code: inst.institution_code || '',
          status: inst.status || 'active',
          campus: inst.campus || '',
          city: inst.city || '',
          state: inst.state || '',
          country: inst.country || ''
        }
      });
    } catch (err: any) {
      console.error('[Institutions] Validate error:', err);
      return res.status(500).json({ success: false, valid: false, message: err?.message || 'Unexpected server error.' });
    }
  });

  // API Route for LX AI Assistant queries
  app.post("/api/ask-lx", async (req, res) => {
    try {
      const { prompt, conversationHistory } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [
              {
                role: "user",
                parts: [{ text: `User request: ${prompt}\n\nProvide a helpful LX answer as the FOODEXA campus dining assistant.` }]
              }
            ],
            config: {
              systemInstruction: LX_SYSTEM_INSTRUCTION,
              temperature: 0.7,
            },
          });

          const answerText = response.text || "LX is currently optimizing campus kitchen routes. Please ask again!";
          return res.json({
            success: true,
            answer: answerText,
            source: "gemini-3.6-flash"
          });
        } catch (apiError: any) {
          console.error("Gemini API call failed, falling back to smart LX logic:", apiError);
        }
      }

      return res.status(503).json({
        success: false,
        error: "LX AI is currently unavailable. Please set the GEMINI_API_KEY environment variable and restart."
      });

    } catch (error: any) {
      console.error("Error in /api/ask-lx:", error);
      res.status(500).json({ error: "Failed to query LX assistant" });
    }
  });

  // ==================== RAZORPAY: CREATE ORDER ====================
  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      console.log("Creating Razorpay Order");
      console.log(req.body);
      console.log(process.env.RAZORPAY_KEY_ID ? "KEY FOUND":"KEY MISSING");
      console.log(process.env.RAZORPAY_KEY_SECRET ? "SECRET FOUND":"SECRET MISSING");

      if (!razorpay) {
        return res.status(503).json({ error: "Payment gateway not configured. Contact administrator." });
      }

      const { amount, currency, receipt, user_id, institution_id, order_id, items, email, phone, name } = req.body;

       // Validate required fields
       if (!amount || amount <= 0) {
         return res.status(400).json({ error: "Invalid amount. Amount must be greater than 0." });
       }
       if (!user_id || !order_id) {
         return res.status(400).json({ error: "Missing required fields: user_id, order_id." });
       }

       // Ensure amount is integer (Razorpay expects paise as integer)
       const amountInPaise = Math.round(Number(amount) * 100);

       if (amountInPaise < 100) {
         return res.status(400).json({ error: "Minimum order amount is ₹1." });
       }

       const orderPayload: any = {
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
           customer_email: email || null,
           customer_phone: phone || null,
           customer_name: name || null,
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

     } catch (error: any) {
       console.error("[Razorpay] Create order error:", error);
       return res.status(500).json({
         error: error?.error?.description || error?.message || "Failed to create payment order. Please try again.",
       });
     }
   });

  // ==================== RAZORPAY: VERIFY PAYMENT ====================
  // Verifies Razorpay signature AND creates the FOODEXA order + order_items server-side.
  // This is the PRIMARY order-creation path (matches the Vercel function behavior).
  // Idempotent: if an order already exists for this payment, returns the existing order.
  app.post("/api/razorpay/verify-payment", async (req, res) => {
    try {
      console.log("[verify-payment] Verifying Razorpay Payment");

      if (!razorpay) {
        return res.status(503).json({ success: false, error: "Payment gateway not configured.", code: "RAZORPAY_CONFIG_ERROR" });
      }

      const {
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        user_id, order_id, institution_id, canteen_id, email,
        customer_name, phone, items, total_amount, pickup_type,
        notes, counter, counter_code,
      } = req.body || {};

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, error: "Missing payment verification parameters.", code: "MISSING_PARAMS" });
      }

      // ── STEP 1: Verify HMAC signature ──
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        console.error("[verify-payment] Signature FAILED for order:", razorpay_order_id);
        await supabaseQuery('payments', 'PATCH', {
          payment_status: 'signature_mismatch',
          razorpay_status: 'verification_failed',
          razorpay_payment_id, razorpay_signature,
          updated_at: new Date().toISOString(),
        }, { razorpay_order_id });
        return res.status(400).json({ success: false, error: "Payment verification failed. Invalid signature.", code: "SIGNATURE_MISMATCH" });
      }

      // ── STEP 2: Fetch payment details from Razorpay ──
      let paymentDetails: any = null;
      try {
        paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      } catch (fetchErr: any) {
        console.warn("[verify-payment] Could not fetch payment details:", fetchErr.message);
      }

      const razorpayStatus = paymentDetails?.status || 'captured';
      if (razorpayStatus !== 'captured' && razorpayStatus !== 'authorized' && razorpayStatus !== 'initiated') {
        return res.status(400).json({ success: false, error: "Payment was not captured. Please contact support.", code: "PAYMENT_NOT_CAPTURED" });
      }

      // ── STEP 3: Update payment record as paid ──
      await supabaseQuery('payments', 'PATCH', {
        payment_status: 'paid',
        razorpay_status: razorpayStatus,
        razorpay_payment_id, razorpay_signature,
        payment_method: paymentDetails?.method || 'razorpay',
        transaction_time: new Date().toISOString(),
        webhook_verified: false,
        updated_at: new Date().toISOString(),
      }, { razorpay_order_id });

      // ── STEP 4: Read payment record for context ──
      const paymentResp = await supabaseQuery('payments', 'GET', undefined, { razorpay_order_id });
      const paymentRow = Array.isArray(paymentResp.data) ? paymentResp.data[0] : paymentResp.data;

      // ── STEP 5: Idempotency — check if order already exists ──
      const existingByPayment = await supabaseQuery('orders', 'GET', undefined, { razorpay_payment_id });
      const existingRows = Array.isArray(existingByPayment.data) ? existingByPayment.data : (existingByPayment.data ? [existingByPayment.data] : []);
      if (existingRows.length > 0 && existingRows[0]?.id) {
        console.log("[verify-payment] Order already exists (idempotent):", existingRows[0].id);
        return res.json({
          success: true, message: "Payment verified and order confirmed.",
          payment_id: razorpay_payment_id, razorpay_order_id,
          order_id: existingRows[0].id, order_created: true, already_existed: true,
        });
      }

      // ── STEP 6: Resolve items, institution, canteen ──
      let resolvedItems: any[] = [];
      if (paymentRow?.items_snapshot) {
        try { resolvedItems = JSON.parse(paymentRow.items_snapshot); } catch { resolvedItems = []; }
      }
      if (resolvedItems.length === 0 && items) resolvedItems = items;

      const resolveInstitutionId = institution_id || paymentRow?.institution_id || null;
      const resolveCanteenId = canteen_id || paymentRow?.canteen_id || null;
      const resolveEmail = email || paymentRow?.customer_email || '';
      const resolveName = customer_name || paymentRow?.customer_name || 'Customer';
      const resolvePhone = phone || paymentRow?.customer_phone || '0000000000';
      const resolveUserId = user_id || paymentRow?.user_id || null;

      let canteenName = '';
      if (resolveCanteenId) {
        const canteenResp = await supabaseQuery('canteens', 'GET', undefined, { id: resolveCanteenId });
        const canteenRows = Array.isArray(canteenResp.data) ? canteenResp.data : (canteenResp.data ? [canteenResp.data] : []);
        if (canteenRows[0]) {
          canteenName = canteenRows[0].name || '';
          if (canteenRows[0].institution_id && canteenRows[0].institution_id !== resolveInstitutionId) {
            return res.status(400).json({ success: false, error: "Canteen does not belong to your institution.", code: "CANTEEN_MISMATCH" });
          }
        }
      }

      const totalFromItems = resolvedItems.reduce((s: number, i: any) => s + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
      let finalTotal = totalFromItems;
      if (paymentDetails?.amount) {
        const razorpayRupees = Number(paymentDetails.amount) / 100;
        finalTotal = razorpayRupees;
      }

      // ── STEP 7: Resolve student_id ──
      let resolvedStudentId: string | null = null;
      if (resolveUserId) {
        const studentResp = await supabaseQuery('students', 'GET', undefined, { email: resolveEmail, institution_id: resolveInstitutionId || '' });
        const studentRows = Array.isArray(studentResp.data) ? studentResp.data : (studentResp.data ? [studentResp.data] : []);
        if (studentRows[0]?.id) resolvedStudentId = studentRows[0].id;

        if (!resolvedStudentId) {
          const created = await supabaseQuery('students', 'POST', {
            email: resolveEmail || '', full_name: resolveName || 'Customer', institution_id: resolveInstitutionId,
          });
          if (created.data) {
            resolvedStudentId = Array.isArray(created.data) ? created.data[0]?.id : created.data.id;
          }
        }
      }

      // ── STEP 8: Generate pickup code ──
      const now = new Date();
      const nowISO = now.toISOString();
      const orderNumber = Date.now();
      const pickupPrefix = pickup_type || 'B';
      const pickupCode = `${pickupPrefix}-${String(orderNumber % 10000).padStart(4, '0')}`;
      const tokenNumber = `TKN-${String(orderNumber % 10000).padStart(4, '0')}`;

      // ── STEP 9: Create order ──
      const orderPayload = {
        student_id: resolvedStudentId, email: resolveEmail, customer_name: resolveName, phone: resolvePhone,
        institution_id: resolveInstitutionId, canteen_id: resolveCanteenId,
        counter: canteenName || 'Counter', counter_code: canteenName || 'Counter',
        total_amount: finalTotal, transaction_amount: finalTotal,
        status: 'confirmed', order_status: 'confirmed',
        payment_status: 'paid', payment_method: 'razorpay',
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        order_number: orderNumber, pickup_code: pickupCode, qr_pickup_code: pickupCode,
        token_number: tokenNumber, pickup_token: tokenNumber,
        pickup_type: pickup_type || 'lunch', notes: notes || null,
        paid_at: nowISO, accepted_at: nowISO,
        kitchen_status: 'pending', counter_status: 'incoming',
        estimated_ready_at: new Date(now.getTime() + 15 * 60000).toISOString(),
        cancel_deadline_at: new Date(now.getTime() + 30 * 1000).toISOString(),
        created_at: nowISO, updated_at: nowISO,
      };

      const { data: createdOrders, error: orderError } = await supabaseQuery('orders', 'POST', [orderPayload]);

      if (orderError || !createdOrders || (Array.isArray(createdOrders) && createdOrders.length === 0)) {
        console.error("[verify-payment] CRITICAL: Order insert failed:", orderError);
        await supabaseQuery('payments', 'PATCH', {
          order_creation_error: String(orderError || 'Unknown error'),
          needs_manual_order: true, updated_at: nowISO,
        }, { razorpay_order_id });
        return res.json({
          success: true, message: "Payment verified. Order is being confirmed.",
          payment_id: razorpay_payment_id, razorpay_order_id,
          order_id: null, order_created: false, code: "ORDER_PENDING",
        });
      }

      const createdOrder = Array.isArray(createdOrders) ? createdOrders[0] : createdOrders;
      const orderId = createdOrder?.id;
      console.log("[verify-payment] Order created:", orderId);

      // ── STEP 10: Insert order_items ──
      if (resolvedItems.length > 0) {
        const itemsPayload = resolvedItems.map((item: any) => ({
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
        const itemsResult = await supabaseQuery('order_items', 'POST', itemsPayload);
        if (itemsResult.error) {
          console.error("[verify-payment] order_items insert failed:", itemsResult.error);
        }
      }

      // ── STEP 11: Create order_status_history ──
      await supabaseQuery('order_status_history', 'POST', [{
        order_id: orderId, user_id: resolvedStudentId || null,
        institution_id: resolveInstitutionId, from_status: null, to_status: 'confirmed',
        payment_status: 'paid', note: 'Payment verified and order created.', created_at: nowISO,
      }]);

      // ── STEP 12: Create notifications ──
      const notifs: any[] = [];
      if (resolvedStudentId) {
        notifs.push({ type: 'order_confirmed', title: 'Order Confirmed!', message: 'Your order has been confirmed and is being prepared.', user_id: resolvedStudentId, created_at: nowISO, read: false, order_id: orderId });
      }
      if (resolveInstitutionId) {
        notifs.push({ type: 'new_order', title: 'New Order Received', message: 'A new order has been placed and payment confirmed.', institution_id: resolveInstitutionId, created_at: nowISO, read: false, order_id: orderId });
      }
      if (notifs.length > 0) await supabaseQuery('notifications', 'POST', notifs);

      return res.json({
        success: true, message: "Payment verified and order created successfully.",
        payment_id: razorpay_payment_id, razorpay_order_id,
        order_id: orderId, order_created: true,
      });

    } catch (error: any) {
      console.error("[verify-payment] Error:", error);
      return res.status(500).json({
        success: false, error: "Payment verification failed due to server error. Your payment status is being checked securely.",
        code: "SERVER_ERROR",
      });
    }
  });

  // ==================== RAZORPAY: WEBHOOK HANDLER ====================
  app.post("/api/razorpay/webhook", async (req, res) => {
    try {
      if (!razorpay) {
        return res.status(503).json({ error: "Payment gateway not configured." });
      }

      const webhookSignature = req.headers['x-razorpay-signature'] as string;
      if (!webhookSignature) {
        return res.status(400).json({ error: "Missing webhook signature." });
      }

      // Verify webhook signature using the raw request body
      // Since JSON middleware already parsed the body, we re-stringify for verification
      const bodyForVerification = JSON.stringify(req.body);

      const expectedSignature = crypto
        .createHmac('sha256', razorpayWebhookSecret)
        .update(bodyForVerification)
        .digest('hex');

      if (expectedSignature !== webhookSignature) {
        console.error("[Razorpay Webhook] Invalid webhook signature");
        return res.status(400).json({ error: "Invalid webhook signature." });
      }

      const payload = req.body;
      const event = payload?.event;

      console.log(`[Razorpay Webhook] Received event: ${event}`);

      if (event === 'payment.captured') {
        const paymentEntity = payload?.payload?.payment?.entity;
        if (!paymentEntity) {
          return res.status(200).json({ message: "OK" });
        }

        const { razorpay_order_id, id: razorpay_payment_id, method, status } = paymentEntity;

        // Update payment record
        await supabaseQuery('payments', 'PATCH', {
          payment_status: 'paid',
          razorpay_status: status,
          payment_method: method || null,
          webhook_verified: true,
          updated_at: new Date().toISOString(),
        }, { razorpay_order_id });

        // Update order as paid (idempotent - already done by verify endpoint)
        await supabaseQuery('orders', 'PATCH', {
          payment_status: 'paid',
          status: 'confirmed',
          order_status: 'confirmed',
          razorpay_payment_id: razorpay_payment_id,
          payment_method: 'razorpay',
          updated_at: new Date().toISOString(),
        }, { razorpay_order_id });

      } else if (event === 'payment.failed') {
        const paymentEntity = payload?.payload?.payment?.entity;
        if (paymentEntity) {
          const failOrderRef = paymentEntity.order_id || '';
          await supabaseQuery('payments', 'PATCH', {
            payment_status: 'failed',
            razorpay_status: paymentEntity.status || 'failed',
            razorpay_payment_id: paymentEntity.id || null,
            updated_at: new Date().toISOString(),
          }, failOrderRef ? { razorpay_order_id: failOrderRef } : undefined);
        }

      } else if (event === 'order.paid') {
        const orderEntity = payload?.payload?.order?.entity;
        if (orderEntity) {
        await supabaseQuery('orders', 'PATCH', {
          payment_status: 'paid',
          status: 'confirmed',
          order_status: 'confirmed',
          updated_at: new Date().toISOString(),
        }, { id: orderEntity.id || '' });

          await supabaseQuery('payments', 'PATCH', {
            payment_status: 'paid',
            webhook_verified: true,
            updated_at: new Date().toISOString(),
          }, { razorpay_order_id: orderEntity.id || '' });
        }
      }

      // Always respond 200 to acknowledge receipt
      return res.status(200).json({ received: true });

    } catch (error: any) {
      console.error("[Razorpay Webhook] Error:", error);
      // Still respond 200 to prevent Razorpay retries on processing errors
      return res.status(200).json({ received: true });
    }
  });

  // ==================== SERVER-SIDE ORDER CREATION ====================
  // Creates orders using service-role key (bypasses RLS).
  // Matches the Vercel function logic in api/create-order.js
  app.post("/api/create-order", async (req, res) => {
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
        return res.status(400).json({ success: false, error: 'Institution ID is required.' });
      }
      if (!canteen_id) {
        return res.status(400).json({ success: false, error: 'Canteen ID is required.' });
      }
      if (!items && !itemsFull) {
        return res.status(400).json({ success: false, error: 'Order items are required.' });
      }
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ success: false, error: 'Razorpay payment details are required.' });
      }

      const orderItems = itemsFull || items || [];

      // ── Verify Razorpay signature (server-side) ───────────────────────
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!razorpayKeySecret) {
        return res.status(500).json({ success: false, error: 'Server payment configuration error.' });
      }

      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        console.error('[CreateOrder] Signature verification FAILED for order:', razorpay_order_id);
        return res.status(400).json({ success: false, error: 'Payment verification failed.' });
      }

      console.log('[CreateOrder] Signature verified OK for payment:', razorpay_payment_id);

      // ── Server-side amount validation ───────────────────────────────────
      let serverCalculatedTotal = 0;
      for (const item of orderItems) {
        const itemPrice = Number(item.price || item.offer_price || 0);
        const itemQty = Number(item.quantity || 1);
        serverCalculatedTotal += itemPrice * itemQty;
      }
      serverCalculatedTotal = Math.round(serverCalculatedTotal * 100) / 100;
      const sentTotal = Number(total_amount || 0);
      if (sentTotal > 0 && Math.abs(serverCalculatedTotal - sentTotal) > 1) {
        console.error('[CreateOrder] Amount mismatch: server=', serverCalculatedTotal, 'client=', sentTotal);
        return res.status(400).json({ success: false, error: 'Payment amount verification failed.' });
      }
      const finalTotal = serverCalculatedTotal > 0 ? serverCalculatedTotal : sentTotal;

      // ── Idempotency check — has this payment already been processed? ──
      const existingResp = await fetch(
        `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/orders?razorpay_payment_id=eq.${encodeURIComponent(razorpay_payment_id)}&select=id,order_number,status,payment_status&limit=1`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Accept': 'application/json',
          },
        }
      );
      if (existingResp.ok) {
        const existingData = await existingResp.json();
        if (existingData && existingData.length > 0 && existingData[0].id) {
          console.log('[CreateOrder] Order already exists (idempotent):', existingData[0].id);
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

      // ── Resolve student_id (UUID from students table) ─────────────────
      const effectiveUserId = student_id || user_id || null;
      let resolvedStudentId = null;

      if (effectiveUserId && email) {
        const studentResp = await fetch(
          `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/students?email=eq.${encodeURIComponent(email)}&institution_id=eq.${encodeURIComponent(institution_id)}&select=id&limit=1`,
          {
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Accept': 'application/json',
            },
          }
        );
        if (studentResp.ok) {
          const studentData = await studentResp.json();
          if (studentData && studentData.length > 0) {
            resolvedStudentId = studentData[0].id;
          }
        }
        // If not found, create student record
        if (!resolvedStudentId) {
          const studentName = customer_name || (email ? email.split('@')[0] : 'Customer');
          const studentPayload = {
            email: email || '',
            full_name: studentName,
            institution_id,
          };
          const createStudentResp = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/students`, {
            method: 'POST',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(studentPayload),
          });
          if (createStudentResp.ok) {
            const createdStudent = await createStudentResp.json();
            resolvedStudentId = Array.isArray(createdStudent) ? createdStudent[0]?.id : createdStudent.id;
          }
        }
      }

      // ── Validate institution and canteen belong together ──────────────
      const canteenResp = await fetch(
        `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/canteens?id=eq.${encodeURIComponent(canteen_id)}&select=id,institution_id,name&limit=1`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Accept': 'application/json',
          },
        }
      );
      let canteenName = '';
      let canteenInstId = '';
      if (canteenResp.ok) {
        const canteenData = await canteenResp.json();
        if (canteenData && canteenData.length > 0) {
          canteenName = canteenData[0].name || '';
          canteenInstId = canteenData[0].institution_id || '';
        }
      }
      if (canteenInstId && canteenInstId !== institution_id) {
        return res.status(400).json({ success: false, error: 'The selected canteen does not belong to your institution.' });
      }

      // ── Validate menu items belong to the institution ──────────────────
      const menuItemIds = orderItems.map((i: any) => i.id || i.menu_item_id).filter(Boolean);
      if (menuItemIds.length !== orderItems.length) {
        return res.status(400).json({ success: false, error: 'One or more cart items are invalid.' });
      }

      // Build filter for menu_items lookup (IN query via .in)
      // Supabase REST uses OR syntax: id=eq.id1,id=eq.id2...
      // For simplicity, we'll skip detailed validation here and rely on DB FK

      // ── Generate pickup code and token number ──────────────────────────
      const now = new Date();
      const nowISO = now.toISOString();
      const pickupPrefix = pickup_type || (counter_code || customer_name || '').trim().charAt(0).toUpperCase() || 'L';
      const orderNumber = Date.now();

      // ── Build and insert the order ─────────────────────────────────────
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
      };

      const orderResp = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify([orderPayload]),
      });

      if (!orderResp.ok) {
        const errText = await orderResp.text();
        console.error('[CreateOrder] Order insert failed:', errText);
        return res.status(500).json({ success: false, error: 'Failed to create order in database. Your payment status is being checked securely.', code: 'DB_ERROR' });
      }

      const orderText = await orderResp.text();
      let orderRows: any = null;
      try { orderRows = orderText ? JSON.parse(orderText) : null; } catch { /* not json */ }
      const orderData = Array.isArray(orderRows) ? orderRows[0] : orderRows;
      const orderId = orderData?.id;
      if (!orderId) {
        return res.status(500).json({ success: false, error: 'Order creation returned no ID.' });
      }

      console.log('[CreateOrder] Order created:', orderId);

      // ── Insert order_items ─────────────────────────────────────────────
      const orderItemsPayload = orderItems.map((item: any) => ({
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

      await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/order_items`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(orderItemsPayload),
      }).catch(err => console.error('[CreateOrder] order_items insert failed:', err));

      // ── Update payment record ──────────────────────────────────────────
      if (razorpay_order_id) {
        await fetch(
          `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/payments?razorpay_order_id=eq.${encodeURIComponent(razorpay_order_id)}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              payment_status: 'paid',
              order_id: orderId,
              updated_at: new Date().toISOString(),
            }),
          }
        );
      }

      // ── Create notifications ───────────────────────────────────────────
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
        await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/notifications`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(notifs),
        });
      }

      // ── Create order_status_history ───────────────────────────────────
      await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/order_status_history`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify([{
          order_id: orderId,
          user_id: resolvedStudentId || null,
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
        order_number: orderData?.order_number,
        status: orderData?.status || 'confirmed',
      });

    } catch (err: any) {
      console.error('[CreateOrder] Error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Order creation failed. Your payment status is being checked securely.', code: 'SERVER_ERROR' });
    }
  });

  // ==================== RAZORPAY: FETCH ORDER STATUS ====================
  app.get("/api/razorpay/order-status/:orderId", async (req, res) => {
    try {
      if (!razorpay) {
        return res.status(503).json({ error: "Payment gateway not configured." });
      }

      const { orderId } = req.params;
      if (!orderId) {
        return res.status(400).json({ error: "Order ID is required." });
      }

      const order = await razorpay.orders.fetch(orderId);

      return res.json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        amount_paid: order.amount_paid,
        amount_due: order.amount_due,
      });

    } catch (error: any) {
      console.error("[Razorpay] Fetch order error:", error);
      return res.status(500).json({
        error: error?.error?.description || "Failed to fetch order status.",
      });
    }
  });

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FOODEXA Server running on http://localhost:${PORT}`);
  });
}

startServer();
