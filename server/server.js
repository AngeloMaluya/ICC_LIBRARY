import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import researchRoutes from "./routes/research.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(express.json());

// ========================================
// ROUTES
// ========================================

app.use(
  "/api/research",
  researchRoutes
);

// ========================================
// CHECK API KEY
// ========================================

console.log(
  "GEMINI_API_KEY:",
  process.env.GEMINI_API_KEY
    ? "LOADED"
    : "NOT LOADED"
);

// ========================================
// GEMINI
// ========================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {
  res.json({
    message: "ICC Library backend is running!"
  });
});

// ========================================
// TEST GEMINI
// ========================================

app.get("/api/test-gemini", async (req, res) => {

  try {

    console.log("Sending request to Gemini...");

    const interaction = await ai.interactions.create({

      model: "gemini-3.1-flash-lite",

      input:
        "Explain what a research paper is in one sentence."

    });

    console.log("Gemini response received!");

    return res.json({

      success: true,

      response: interaction.output_text

    });

  } catch (error) {

    console.error("GEMINI ERROR:");
    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message

    });

  }

});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

  console.log(
    `Server running at http://localhost:${PORT}`
  );

});