import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import researchRoutes from "./routes/research.js";

dotenv.config();

console.log(
  "SUPABASE_URL:",
  process.env.SUPABASE_URL
);

console.log(
  "SUPABASE_SECRET_KEY:",
  process.env.SUPABASE_SECRET_KEY
    ? "LOADED"
    : "NOT LOADED"
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

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

app.get("/api/test-db", async (req, res) => {

  try {

    console.log("Testing Supabase...");

    const {
      data,
      error
    } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (error) {

      console.error(
        "SUPABASE ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Database connection failed.",

        error:
          error.message

      });

    }

    console.log(
      "Supabase connection successful!"
    );

    return res.json({

      success: true,

      message:
        "Supabase connection is working!",

      data

    });

  } catch (error) {

    console.error(
      "DATABASE ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Database connection failed.",

      error:
        error.message

    });

  }

});

// ========================================
// CHECK GOOGLE USER ACCOUNT
// ========================================

app.get("/api/user/:email", async (req, res) => {

  try {

    const { email } = req.params;

    console.log("Checking Google account:", email);

    const {
      data: user,
      error
    } = await supabase
      .from("users")
      .select(
        "id, email, f_name, l_name, course, year"
      )
      .eq("email", email)
      .maybeSingle();

    if (error) {

      console.error(
        "SUPABASE USER CHECK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Database error.",
        error: error.message
      });

    }

    // User doesn't exist
    if (!user) {

      return res.status(404).json({

        success: false,

        exists: false,

        message: "Account not found."

      });

    }

    // User exists
    return res.json({

      success: true,

      exists: true,

      user: {

        id: user.id,

        email: user.email,

        firstName: user.f_name,

        lastName: user.l_name,

        course: user.course,

        year: user.year

      }

    });

  } catch (error) {

    console.error(
      "GOOGLE USER CHECK ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message: "Server error."

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