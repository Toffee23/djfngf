import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "primepitsecret";

/**
 * Global protection middleware to decrypt identity tokens and verify core permissions
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No authorization token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Invalid token validation parameters signature match." });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User account session no longer exists." });
    }

    // Attach essential permission criteria securely to the request stack context
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      subscriptionType: user.subscriptionType || "basic",
      hasGameAccess: user.hasGameAccess || false,
      isAdmin: user.isAdmin || false,
      isProducer: user.isProducer || false,
      isSubscribed: user.isSubscribed || false,
      subscriptionExpires: user.subscriptionExpires || null,
    };

    return next();
  } catch (err) {
    console.error("JWT Security Interceptor Failure:", err.message);
    return res.status(401).json({ message: "Authorization failed. Token is expired or malformed." });
  }
};

/**
 * Middleware layer to gate premium streaming subscription access
 */
export const requireSubscription = (req, res, next) => {
  try {
    if (!req.user || !req.user.isSubscribed) {
      return res.status(403).json({ message: "Access denied. Active subscription package required." });
    }

    // Protect against string type evaluation desync bugs using an explicit date comparison wrap
    if (req.user.subscriptionExpires && new Date(req.user.subscriptionExpires) < new Date()) {
      return res.status(403).json({ message: "Access denied. Your active subscription period has expired." });
    }

    return next();
  } catch (err) {
    console.error("Subscription Gating Internal Error:", err);
    return res.status(500).json({ message: "Internal server validation failure." });
  }
};

/**
 * Middleware layer to validate specialized arcade game entry access
 */
export const requireGameAccess = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "Authentication validation state context missing." });
    }

    // Premium users bypass entry fees. Basic tiers must have an validated payment token flag active.
    const hasPremiumPass = req.user.subscriptionType === "premium";
    const hasPaidBasicEntry = req.user.subscriptionType === "basic" && req.user.hasGameAccess;

    if (!hasPremiumPass && !hasPaidBasicEntry) {
      return res.status(403).json({ message: "Access denied. Valid game session entry payment token required." });
    }

    return next();
  } catch (err) {
    console.error("Game Access Gate Error:", err);
    return res.status(500).json({ message: "Internal server verification failure." });
  }
};

/**
 * Middleware layer to protect creator content management features
 */
export const requireProducer = (req, res, next) => {
  if (!req.user || !req.user.isProducer) {
    return res.status(403).json({
      message: "Access denied. Verified producer portal credentials required.",
    });
  }
  return next();
};

/**
 * Middleware layer to restrict platform settings to system administrators
 */
export const requireAdmin = (req, res, next) => {
  // Optimized: Evaluates flag values immediately from memory state without hitting DB again
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied. Administrative credentials required." });
  }
  return next();
};