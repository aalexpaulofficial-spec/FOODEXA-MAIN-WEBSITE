import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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

      // LX unavailable when Gemini API key is not configured
      return res.status(503).json({
        success: false,
        error: "LX AI is currently unavailable. Please set the GEMINI_API_KEY environment variable and restart."
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
