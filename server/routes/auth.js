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
const ADMIN_EMAIL = "research.admin01@gmail.com";

const USER_FIELDS =
  "id, email, f_name, l_name, course, year, profile_picture, role, education_level, section";

// Create JWT access token using the database role
const createAccessToken = (user) => {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role === "admin" ? "admin" : "student",
      type: "access",
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
};

// Temporary token for new Google student registrations
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

// Format user information returned to the frontend
const formatUser = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.f_name,
  lastName: user.l_name,
  educationLevel: user.education_level,
  course: user.course,
  year: user.year,
  section: user.section,
  profilePicture: user.profile_picture,
  role: user.role === "admin" ? "admin" : "student",
});

// ======================================================
// REGISTER NEW STUDENT
// ======================================================

router.post("/register", async (req, res) => {
try {
  const {
    firstName,
    lastName,
    course,
    year,
    educationLevel,
    password,
    section,
    signupToken,
  } = req.body;
    console.log("REGISTER SECTION RECEIVED:", section);

  // Validate required fields
  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof course !== "string" ||
    typeof educationLevel !== "string" ||
    typeof password !== "string" ||
    !firstName.trim() ||
    !lastName.trim() ||
    !course.trim() ||
    !educationLevel.trim() ||
    !year ||
    !password ||
    !section ||
    !signupToken
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  // Validate education level, course, and year
  const COLLEGE_PROGRAMS = [
    "BSCS", "BSBA", "BSED", "BEED", "BSTM", "BSCrim"
  ];

  const SHS_STRANDS = [
    "STEM", "ABM", "HUMSS", "GAS", "HE", "ICT"
  ];

  const validCollege =
    educationLevel === "college" &&
    COLLEGE_PROGRAMS.includes(course) &&
    ["1", "2", "3", "4"].includes(String(year));

  const validSHS =
    educationLevel === "shs" &&
    SHS_STRANDS.includes(course) &&
    ["11", "12"].includes(String(year));

  if (!validCollege && !validSHS) {
    return res.status(400).json({
      success: false,
      message: "Invalid education level, course/strand, or year.",
    });
  }
  
  // Verify Google signup token
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
    typeof googleUser.email !== "string" ||
    !googleUser.email.toLowerCase().endsWith(`@${SCHOOL_DOMAIN}`)
  ) {
    return res.status(403).json({
      success: false,
      message: "Invalid Google signup session.",
    });
  }

  const email = googleUser.email.trim().toLowerCase();

  // Check for an existing account
  const { data: existingUser, error: lookupError } =
    await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "This email is already registered.",
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Register student
  const { data: newUser, error: insertError } =
    await supabase
      .from("users")
      .insert({
        email,
        f_name: firstName.trim(),
        l_name: lastName.trim(),
        course: course.trim(),
        year: Number(year),
        education_level: educationLevel,
        password: hashedPassword,
        section: section.trim(),
        profile_picture: googleUser.picture || null,
        role: "student",
      })
      .select(USER_FIELDS)
      .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    throw insertError;
  }
  console.log("SECTION RETURNED BY SUPABASE:", newUser.section);

  // Generate login token
  const token = createAccessToken(newUser);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: formatUser(newUser),
    });

  // Continue with Google signup token verification...
    }catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

// ======================================================
// EMAIL / PASSWORD LOGIN - ADMIN AND STUDENT
// ======================================================

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
      .select(`${USER_FIELDS}, password`)
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

// ======================================================
// GOOGLE LOGIN - ADMIN AND STUDENT
// ======================================================

router.post("/google-login", async (req, res) => {
  try {
    const { credential } = req.body;

    if (typeof credential !== "string" || !credential) {
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
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        success: false,
        message: "Google account verification failed.",
      });
    }

    const email = payload.email.trim().toLowerCase();

    const isSchoolEmail =
      email.endsWith(`@${SCHOOL_DOMAIN}`);

    const isAdminEmail = email === ADMIN_EMAIL;

    if (!isSchoolEmail && !isAdminEmail) {
      return res.status(403).json({
        success: false,
        message:
          "Only verified ICC school accounts are allowed.",
      });
    }

    const {
      data: user,
      error,
    } = await supabase
      .from("users")
      .select(USER_FIELDS)
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("GOOGLE LOGIN DATABASE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Database error.",
      });
    }


    // Registered account: use role stored in Supabase
    if (user) {
      if (isAdminEmail && user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Administrator account is not configured.",
        });
      }

      // Use the latest picture provided by Google
      let currentUser = user;

      if (
        typeof payload.picture === "string" &&
        payload.picture.trim() &&
        payload.picture !== user.profile_picture
      ) {
        const { data: updatedUser, error: updateError } =
          await supabase
            .from("users")
            .update({
              profile_picture: payload.picture,
            })
            .eq("id", user.id)
            .select(USER_FIELDS)
            .single();

        if (updateError) {
          console.error(
            "GOOGLE PROFILE PICTURE UPDATE ERROR:",
            updateError
          );
        } else {
          currentUser = updatedUser;
        }
      }

      // Generate access token using the database role
      const token = createAccessToken(currentUser);

      return res.status(200).json({
        success: true,
        exists: true,
        token,
        user: formatUser(currentUser),
      });
    }


    // Administrator must already exist in the database
    if (isAdminEmail) {
      return res.status(403).json({
        success: false,
        message: "Administrator account not found.",
      });
    }

    // New school account: continue student registration
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
      message:
        "Google authentication failed. Please try again.",
    });
  }
});

// ======================================================
// GET STUDENT PROFILE
// ======================================================

router.get(
  "/user/:email",
  verifyStudentToken,
  async (req, res) => {
    try {
      const requestedEmail =
        req.params.email.toLowerCase();

      const authenticatedEmail =
        req.user.email.toLowerCase();

      if (requestedEmail !== authenticatedEmail) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to access this profile.",
        });
      }

      const {
        data: user,
        error,
      } = await supabase
        .from("users")
        .select(USER_FIELDS)
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
  }
);

export default router;