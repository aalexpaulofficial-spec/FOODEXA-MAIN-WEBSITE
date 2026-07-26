import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '2000', 10);

  app.use(express.json());

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

  // System instruction for LX - FOODEXA's AI Companion
  const LX_SYSTEM_INSTRUCTION = `You are LX, the official AI Companion for FOODEXA — the Smart Campus Food Ordering Platform.
Your purpose is to help students, campus food vendors, and university dining staff with food ordering, meal recommendations, dietary preferences, budget optimization, queue jump estimation, group order planning, and campus dining insights.

Important rules:
1. Always identify yourself as "LX", the FOODEXA AI Assistant. Never refer to yourself as Gemini or Google. Gemini is only the underlying AI model.
2. Tone: Friendly, fast, intelligent, helpful, student-first, and energetic campus vibes.
3. Keep responses structured, easy to read on mobile, and formatted with clean markdown bullet points or bold text where helpful.
4. When students ask for food suggestions, provide concise meals with estimated price ($), prep wait time (mins), vendor location on campus, protein/calories if asked, and direct advice on avoiding rush hours.
5. Emphasize FOODEXA features like Express Queue Jump, Group Cart Splitting, Smart Lockers, and Allergen Safeguards when relevant.`;

  // API Route for LX AI Assistant queries
  app.post("/api/ask-lx", async (req, res) => {
    try {
      const { prompt, conversationHistory } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // If Gemini client is available, call Gemini API
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

      // Intelligent Local LX Response Fallback (when GEMINI_API_KEY is not set or network fails)
      const queryLower = prompt.toLowerCase();
      let responseText = "";

      if (queryLower.includes("protein") || queryLower.includes("healthy") || queryLower.includes("gym")) {
        responseText = `⚡ **LX Smart Recommendation for High-Protein Meals:**\n\n1. **Grilled Chicken Quinoa Bowl** @ *Science Quad Bites* ($7.80) — 42g Protein, 520 kcal. Prep wait: ~4 mins.\n2. **Double Egg & Avocado Sourdough** @ *Library Express Cafe* ($6.50) — 28g Protein, 410 kcal. Prep wait: ~2 mins.\n\n💡 **LX Tip:** Order via FOODEXA Locker Hub 2 at the Engineering Hall to jump the 12:30 PM peak queue!`;
      } else if (queryLower.includes("under") || queryLower.includes("$") || queryLower.includes("budget") || queryLower.includes("cheap")) {
        responseText = `💰 **LX Budget Saver Deals (Under $8):**\n\n• **Spicy Sesame Tofu Noodles** @ *North Student Union* ($5.99) — Very filling & 100% Vegan.\n• **Artisan Roasted Turkey Club Wrap** @ *Campus Commons Deli* ($7.25) — Comes with free chips via FOODEXA Perks.\n• **Matcha Oat Smoothie & Bagel Combo** @ *East Gate Cafe* ($6.80).\n\n✨ **LX Perks:** You have $2.50 in FOODEXA Campus Credits ready to apply!`;
      } else if (queryLower.includes("line") || queryLower.includes("queue") || queryLower.includes("busy") || queryLower.includes("wait")) {
        responseText = `⏱️ **Live Campus Rush Hour Status (LX Real-time Analytics):**\n\n• **Main Dining Hall:** High Rush (~22 min walk-in wait). **LX Express Pickup wait: 3 mins.**\n• **Library Cafe:** Medium Rush (~8 min wait).\n• **South Campus Food Trucks:** Low Rush (<2 min wait).\n\n🚀 **Action:** Use FOODEXA Pre-Order with Locker Slot 4 to bypass the line entirely!`;
      } else if (queryLower.includes("group") || queryLower.includes("split") || queryLower.includes("dorm")) {
        responseText = `👥 **LX Group Cart & Bill Splitter:**\n\nI can start a shared group cart for your study session! Simply share the 4-digit code **#EXA-884** with your friends in the dorm. Each student picks their dish, and FOODEXA automatically splits the bill and routes 1 pooled delivery to your dorm lobby.`;
      } else {
        responseText = `👋 **Hello! I'm LX, your FOODEXA Campus Food Companion.**\n\nI can help you:\n• Find healthy, high-protein, or budget meals on campus\n• Skip 20+ minute rush hour queues with express pre-orders\n• Split group cart orders with roommates\n• Filter food for allergies (Nut-free, Gluten-free, Halal, Vegan)\n\nWhat are you craving or looking for today?`;
      }

      return res.json({
        success: true,
        answer: responseText,
        source: "lx-smart-engine"
      });

    } catch (error: any) {
      console.error("Error in /api/ask-lx:", error);
      res.status(500).json({ error: "Failed to query LX assistant" });
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
