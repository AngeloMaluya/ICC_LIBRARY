import jwt from "jsonwebtoken";

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


export const verifyAdminToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Administrator authentication required.",
      });
    }

    const token = authHeader.slice(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

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

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired administrator session.",
    });
  }
};
