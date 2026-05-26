import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

// Middleware to protect routes and check for subscription status
// Adjust the path if different

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(401).json({ message: "Invalid token" });
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach only needed fields
    req.user = {
      id: user._id,
      username: user.username,
      subscriptionType: user.subscriptionType,
      hasGameAccess: user.hasGameAccess,
      isAdmin: user.isAdmin,
      isProducer: user.isProducer,
      isSubscribed: user.isSubscribed,
      subscriptionExpires: user.subscriptionExpires,
    };

    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const requireSubscription = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  if (
    !req.user ||
    !req.user.isSubscribed ||
    req.user.subscriptionExpires < new Date()
  ) {
    return res.status(403).json({ message: "Subscription required" });
  }
  // console.log("User in requireSubscription:", req.user);

  next();
};
// Require game access
export const requireGameAccess = async (req, res, next) => {
  if (
    !req.user ||
    (req.user.subscriptionType !== "premium" &&
      !(req.user.subscriptionType === "basic" && req.user.hasGameAccess))
  ) {
    return res.status(403).json({ message: "Game access not granted" });
  }
  next();
};

export const requireProducer = (req, res, next) => {
  if (!req.user || !req.user.isProducer) {
    return res.status(403).json({
      message: "Producer account required",
    });
  }

  next();
};

export const requireAdmin = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
