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
        return res.status(400).json({ error: 'Institution code is required.' });
      }

      const supabaseServerKey = supabaseServiceKey || supabaseAnonKey;

      if (!supabaseUrl || !supabaseServerKey) {
        console.error('[Institutions] Missing Supabase server environment variables');
        return res.status(503).json({
          error: 'Institution verification is not configured yet. Please contact Foodexa support.',
          code: 'MISSING_SUPABASE_SERVER_ENV',
        });
      }

      const trimmed = code.trim();

      // Use the service role key so RLS is bypassed for this public lookup
      const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/institutions?institution_code=ilike.${encodeURIComponent(trimmed)}&select=id,name,institution_name,campus,city,state,country,institution_code&limit=1`;
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
            error: 'Institution verification is being set up. Please try again after the Foodexa database is updated.',
            code: 'INSTITUTIONS_TABLE_MISSING',
          });
        }

        if (!supabaseServiceKey && (resp.status === 401 || resp.status === 403)) {
          return res.status(503).json({
            error: 'Institution verification needs the server Supabase service key in Vercel.',
            code: 'SUPABASE_SERVICE_KEY_REQUIRED',
          });
        }

        return res.status(502).json({
          error: 'Unable to verify Institution Code. Please try again.',
          code: 'SUPABASE_LOOKUP_FAILED',
        });
      }

      const rows = await resp.json();
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Institution Code not found.' });
      }

      const inst = rows[0];
      return res.json({
        institution_id: inst.id,
        institution_name: inst.name || inst.institution_name || '',
        campus: inst.campus || '',
        city: inst.city || '',
        state: inst.state || '',
        country: inst.country || '',
        institution_code: inst.institution_code || '',
      });
    } catch (err: any) {
      console.error('[Institutions] Validate error:', err);
      return res.status(500).json({ error: 'Server error during institution code validation.' });
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
  app.post("/api/razorpay/verify-payment", async (req, res) => {
    try {
      console.log("Verifying Razorpay Payment");
      console.log(req.body);
      console.log(process.env.RAZORPAY_KEY_ID ? "KEY FOUND":"KEY MISSING");
      console.log(process.env.RAZORPAY_KEY_SECRET ? "SECRET FOUND":"SECRET MISSING");

      if (!razorpay) {
        return res.status(503).json({ error: "Payment gateway not configured." });
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, order_id } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing payment verification parameters." });
      }

      // Verify signature using HMAC SHA256
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const isSignatureValid = expectedSignature === razorpay_signature;

      if (!isSignatureValid) {
        // Signature mismatch - do NOT mark as paid
        console.error("[Razorpay] Signature verification FAILED for order:", razorpay_order_id);

        // Update payment record with failed verification
        await supabaseQuery('payments', 'PATCH', {
          payment_status: 'signature_mismatch',
          razorpay_status: 'verification_failed',
          razorpay_payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature,
          updated_at: new Date().toISOString(),
        }, { razorpay_order_id: razorpay_order_id });

        // Use query params for Supabase PATCH filter
        return res.status(400).json({
          success: false,
          error: "Payment verification failed. Invalid signature. Please contact support.",
        });
      }

      // Signature is valid - fetch payment details from Razorpay
      let paymentDetails: any = null;
      try {
        paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      } catch (fetchErr) {
        console.warn("[Razorpay] Could not fetch payment details:", fetchErr);
      }

      // Update payment record in Supabase as captured/verified
      const paymentUpdate: any = {
        payment_status: 'captured',
        razorpay_status: paymentDetails?.status || 'captured',
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        payment_method: paymentDetails?.method || null,
        transaction_time: new Date().toISOString(),
        webhook_verified: false,
        updated_at: new Date().toISOString(),
      };

      await supabaseQuery('payments', 'PATCH', paymentUpdate, { razorpay_order_id: razorpay_order_id });

       // Update the order in Supabase
       const now = new Date();
       const orderUpdate: any = {
         payment_status: 'paid',
         status: 'accepted',
         order_status: 'Accepted',
         razorpay_order_id: razorpay_order_id,
         razorpay_payment_id: razorpay_payment_id,
         razorpay_signature: razorpay_signature,
         payment_method: paymentDetails?.method || 'Razorpay',
         paid_at: now.toISOString(),
         accepted_at: now.toISOString(),
         updated_at: now.toISOString(),
         estimated_ready_at: new Date(now.getTime() + 15 * 60000).toISOString(),
         kitchen_status: 'Pending',
         counter_status: 'Incoming',
       };

      const { error: orderUpdateError } = await supabaseQuery('orders', 'PATCH', orderUpdate, { order_id: order_id });
      if (orderUpdateError) {
        console.error("[Razorpay] Failed to update order:", orderUpdateError);
      }

      return res.json({
        success: true,
        message: "Payment verified and order updated successfully.",
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      });

    } catch (error: any) {
      console.error("[Razorpay] Verify payment error:", error);
      return res.status(500).json({
        error: error?.message || "Payment verification failed due to server error.",
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
          payment_status: 'captured',
          razorpay_status: status,
          payment_method: method || null,
          webhook_verified: true,
          updated_at: new Date().toISOString(),
        }, { razorpay_order_id });

        // Update order as paid (idempotent - already done by verify endpoint)
        await supabaseQuery('orders', 'PATCH', {
          payment_status: 'paid',
          status: 'accepted',
          order_status: 'Accepted',
          razorpay_payment_id: razorpay_payment_id,
          payment_method: method || null,
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
          status: 'accepted',
          order_status: 'Accepted',
          updated_at: new Date().toISOString(),
        }, { order_id: orderEntity.id || '' });

          await supabaseQuery('payments', 'PATCH', {
            payment_status: 'captured',
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
