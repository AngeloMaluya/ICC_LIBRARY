
import { verifyStudentToken } from "../middleware/authMiddleware.js";
import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
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
  "id, email, f_name, l_name, course, year, profile_picture, role, education_level";

const HANDOFF_LIFETIME_MS = 90 * 1000;

// ======================================================
// HELPERS
// ======================================================

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
  educationLevel: user.education_level,
  course: user.course,
  year: user.year,
  profilePicture: user.profile_picture,
  role: user.role === "admin" ? "admin" : "student",
});

const sha256Hex = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const base64Url = (bytes) =>
  Buffer.from(bytes).toString("base64url");

// ======================================================
// VERIFY GOOGLE ACCOUNT AND BUILD LOGIN RESULT
// ======================================================

const authenticateGoogle = async (credential) => {
  if (typeof credential !== "string" || !credential) {
    return {
      status: 400,
      body: {
        success: false,
        message: "Google credential is required.",
      },
    };
  }

  let payload;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: [
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_DESKTOP_CLIENT_ID,
      ].filter(Boolean),
    });

    payload = ticket.getPayload();
  } catch {
    return {
      status: 401,
      body: {
        success: false,
        message:
          "Google authentication failed. Please try again.",
      },
    };
  }

  if (
    !payload ||
    !payload.email ||
    payload.email_verified !== true
  ) {
    return {
      status: 401,
      body: {
        success: false,
        message: "Google account verification failed.",
      },
    };
  }

  const email = payload.email.trim().toLowerCase();

  const isSchoolEmail =
    email.endsWith(`@${SCHOOL_DOMAIN}`);

  const isAdminEmail = email === ADMIN_EMAIL;

  if (!isSchoolEmail && !isAdminEmail) {
    return {
      status: 403,
      body: {
        success: false,
        message:
          "Only verified ICC school accounts are allowed.",
      },
    };
  }

  const { data: user, error } = await supabase
    .from("users")
    .select(USER_FIELDS)
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  // EXISTING ACCOUNT
  if (user) {
    if (isAdminEmail && user.role !== "admin") {
      return {
        status: 403,
        body: {
          success: false,
          message: "Administrator account is not configured.",
        },
      };
    }

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

    return {
      status: 200,
      body: {
        success: true,
        exists: true,
        token: createAccessToken(currentUser),
        user: formatUser(currentUser),
      },
    };
  }

  // ADMIN MUST ALREADY BE REGISTERED
  if (isAdminEmail) {
    return {
      status: 403,
      body: {
        success: false,
        message: "Administrator account not found.",
      },
    };
  }

  // NEW STUDENT
  const googleUser = {
    email,
    name: payload.name || "",
    picture: payload.picture || null,
  };

  return {
    status: 200,
    body: {
      success: true,
      exists: false,
      signupToken: createSignupToken(googleUser),
      googleUser,
    },
  };
};

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
      signupToken,
    } = req.body;

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
      !signupToken
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const COLLEGE_PROGRAMS = [
      "BSCS",
      "BSBA",
      "BSED",
      "BEED",
      "BSTM",
      "BSCrim",
    ];

    const SHS_STRANDS = [
      "STEM",
      "ABM",
      "HUMSS",
      "GAS",
      "HE",
      "ICT",
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
        message:
          "Invalid education level, course/strand, or year.",
      });
    }

    let googleUser;

    try {
      googleUser = jwt.verify(
        signupToken,
        process.env.JWT_SECRET
      );
    } catch {
      return res.status(401).json({
        success: false,
        message:
          "Google signup session expired. Please sign in again.",
      });
    }

    if (
      googleUser.type !== "google_signup" ||
      typeof googleUser.email !== "string" ||
      !googleUser.email
        .toLowerCase()
        .endsWith(`@${SCHOOL_DOMAIN}`)
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid Google signup session.",
      });
    }

    const email = googleUser.email.trim().toLowerCase();

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

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

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

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token: createAccessToken(newUser),
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

// ======================================================
// EMAIL / PASSWORD LOGIN
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

    const { data: user, error } = await supabase
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

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: createAccessToken(user),
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
// EXISTING GOOGLE LOGIN
// ======================================================

router.post("/google-login", async (req, res) => {
  try {
    const result = await authenticateGoogle(
      req.body?.credential
    );

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

// ======================================================
// DESKTOP LOGIN - CREATE ONE-TIME HANDOFF CODE
// ======================================================

router.post(
  "/auth/desktop/handoff",
  async (req, res) => {
    try {
      const { credential, challenge } = req.body || {};

      // The challenge is the base64url SHA-256 hash
      // of a random verifier retained by WPF.
      if (
        typeof challenge !== "string" ||
        !/^[A-Za-z0-9_-]{43}$/.test(challenge)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid desktop login challenge.",
        });
      }

      const result = await authenticateGoogle(
        credential
      );

      if (result.status !== 200) {
        return res
          .status(result.status)
          .json(result.body);
      }

      const code = base64Url(
        crypto.randomBytes(32)
      );

      const codeHash = sha256Hex(code);

      const expiresAt = new Date(
        Date.now() + HANDOFF_LIFETIME_MS
      ).toISOString();

      const { error } = await supabase
        .from("desktop_login_handoffs")
        .insert({
          code_hash: codeHash,
          verifier_challenge: challenge,
          login_result: result.body,
          expires_at: expiresAt,
        });

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        code,
        expiresIn: 90,
      });
    } catch (error) {
      console.error(
        "DESKTOP HANDOFF ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to prepare desktop login.",
      });
    }
  }
);

// ======================================================
// DESKTOP LOGIN - REDEEM ONE-TIME CODE
// ======================================================

router.post(
  "/auth/desktop/exchange",
  async (req, res) => {
    try {
      const { code, verifier } = req.body || {};

      if (
        typeof code !== "string" ||
        !/^[A-Za-z0-9_-]{43}$/.test(code) ||
        typeof verifier !== "string" ||
        !/^[A-Za-z0-9_-]{43,128}$/.test(verifier)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid desktop login credentials.",
        });
      }

      const codeHash = sha256Hex(code);

      const challenge = base64Url(
        crypto
          .createHash("sha256")
          .update(verifier, "ascii")
          .digest()
      );

      // Supabase RPC atomically deletes the code
      // and returns its associated login result.
      const { data, error } = await supabase.rpc(
        "redeem_desktop_login_handoff",
        {
          p_code_hash: codeHash,
          p_challenge: challenge,
        }
      );

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(401).json({
          success: false,
          message:
            "Desktop login expired or already used. Please sign in again.",
        });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error(
        "DESKTOP EXCHANGE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to complete desktop login.",
      });
    }
  }
);

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

      const { data: user, error } = await supabase
        .from("users")
        .select(USER_FIELDS)
        .eq("email", authenticatedEmail)
        .maybeSingle();

      if (error) {
        console.error(
          "PROFILE DATABASE ERROR:",
          error
        );

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
      console.error(
        "PROFILE FETCH ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  }
);

export default router;
