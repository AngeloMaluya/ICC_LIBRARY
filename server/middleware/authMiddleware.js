import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export const verifyStudentToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (
      decoded.type !== "access" ||
      decoded.role !== "student" ||
      !decoded.sub
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid student access.",
      });
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Your session is invalid or has expired. Please log in again.",
    });
  }
};


export const verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Administrator authentication required.",
      });
    }

    const token = authHeader.slice(7);

    // Verify JWT signature and expiration
    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session.",
      });
    }

    // Verify the token was issued for an admin
    if (
      decoded.type !== "access" ||
      decoded.role !== "admin" ||
      !decoded.sub
    ) {
      return res.status(403).json({
        success: false,
        message: "Administrator access only.",
      });
    }

    // Check the user's CURRENT role in Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("id", decoded.sub)
      .maybeSingle();

    if (error) {
      console.error("ADMIN ROLE CHECK ERROR:", error);

      return res.status(503).json({
        success: false,
        message: "Unable to verify administrator access.",
      });
    }

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator privileges have been revoked.",
      });
    }

    // Verify the account matches the JWT
    if (user.email !== decoded.email) {
      return res.status(403).json({
        success: false,
        message: "Account verification failed.",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("ADMIN AUTH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Administrator authentication failed.",
    });
  }
};


export const verifyAuthenticatedToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = authHeader.slice(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (
      decoded.type !== "access" ||
      !["student", "admin"].includes(decoded.role) ||
      !decoded.sub
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session.",
    });
  }
};
