import { verifyStudentToken } from "../middleware/authMiddleware.js";
import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const SCHOOL_DOMAIN = "immaculada.edu.ph";

const createAccessToken = (user) => {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: "student",
      type: "access",
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
};

const createSignupToken = (googleUser) => {
  return jwt.sign(
    {
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture || null,
      type: "google_signup",
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );
};

const formatUser = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.f_name,
  lastName: user.l_name,
  course: user.course,
  year: user.year,
  profilePicture: user.profile_picture,
});

// Register a new student using a verified Google signup token
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      course,
      year,
      password,
      signupToken,
    } = req.body;

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof course !== "string" ||
      !firstName.trim() ||
      !lastName.trim() ||
      !course.trim() ||
      !year ||
      typeof password !== "string" ||
      !signupToken
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and no more than 72 bytes.",
      });
    }

    // Verify that the signup token was issued by this backend
    let googleUser;

    try {
      googleUser = jwt.verify(
        signupToken,
        process.env.JWT_SECRET
      );
    } catch {
      return res.status(401).json({
        success: false,
        message: "Google signup session expired. Please sign in again.",
      });
    }

    if (
      googleUser.type !== "google_signup" ||
      !googleUser.email ||
      !googleUser.email.endsWith(`@${SCHOOL_DOMAIN}`)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google signup session.",
      });
    }

    const email = googleUser.email.toLowerCase();

    // Check for an existing account
    const {
      data: existingUser,
      error: checkError,
    } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("USER CHECK ERROR:", checkError);

      return res.status(500).json({
        success: false,
        message: "Failed to check existing account.",
      });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const {
      data: newUser,
      error: insertError,
    } = await supabase
      .from("users")
      .insert([
        {
          f_name: firstName.trim(),
          l_name: lastName.trim(),
          course: course.trim(),
          year: year,
          email: email,
          password: hashedPassword,
          profile_picture: googleUser.picture || null,
        },
      ])
      .select(
        "id, email, f_name, l_name, course, year, profile_picture"
      )
      .single();

    if (insertError) {
      console.error("REGISTER DATABASE ERROR:", insertError);

      return res.status(500).json({
        success: false,
        message: "Failed to create account.",
      });
    }

    const accessToken = createAccessToken(newUser);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token: accessToken,
      user: formatUser(newUser),
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

// Student email/password login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const {
      data: user,
      error,
    } = await supabase
      .from("users")
      .select(
        "id, email, f_name, l_name, course, year, password, profile_picture"
      )
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("LOGIN DATABASE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Database error.",
      });
    }

    if (!user || typeof user.password !== "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = createAccessToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

// Verify Google credential on the backend
router.post("/google-login", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.email ||
      payload.email_verified !== true ||
      !payload.email.toLowerCase().endsWith(`@${SCHOOL_DOMAIN}`)
    ) {
      return res.status(401).json({
        success: false,
        message: "Only verified ICC school accounts are allowed.",
      });
    }

    const email = payload.email.toLowerCase();

    const {
      data: user,
      error,
    } = await supabase
      .from("users")
      .select(
        "id, email, f_name, l_name, course, year, profile_picture"
      )
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("GOOGLE LOGIN DATABASE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Database error.",
      });
    }

    // Existing student account
    if (user) {
      const token = createAccessToken(user);

      return res.status(200).json({
        success: true,
        exists: true,
        token,
        user: formatUser(user),
      });
    }

    // New student account: issue a short-lived signup token
    const signupToken = createSignupToken({
      email,
      name: payload.name || "",
      picture: payload.picture || null,
    });

    return res.status(200).json({
      success: true,
      exists: false,
      signupToken,
      googleUser: {
        email,
        name: payload.name || "",
        picture: payload.picture || null,
      },
    });
  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);

    return res.status(401).json({
      success: false,
      message: "Google authentication failed. Please try again.",
    });
  }
});

// src/utils/auth.js

const GOOGLE_TEMP_KEYS = [
  "googleEmail",
  "googleName",
  "googlePicture",
];

// Get the logged-in student's profile
router.get("/user/:email", verifyStudentToken, async (req, res) => {
  try {
    const requestedEmail = req.params.email.toLowerCase();
    const authenticatedEmail = req.user.email.toLowerCase();

    // Prevent students from accessing another student's profile
    if (requestedEmail !== authenticatedEmail) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this profile.",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id, email, f_name, l_name, course, year, profile_picture"
      )
      .eq("email", authenticatedEmail)
      .maybeSingle();

    if (error) {
      console.error("PROFILE DATABASE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve profile.",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("PROFILE FETCH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

export default router;