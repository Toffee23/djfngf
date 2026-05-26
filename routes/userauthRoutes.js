import express from "express";
import { signUp, signIn, logout } from "../controllers/authController.js";
import { becomeProducer } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Authentication & Access
 * description: Entry gates for profile registration, login state control, and status verification.
 */

// ── PUBLIC GATEWAYS ──────────────────────────────────────────────────

/**
 * @swagger
 * /api/users/signup:
 * post:
 * summary: Register a new consumer account profiling node
 * tags: [Authentication & Access]
 */
router.post("/signup", signUp);

/**
 * @swagger
 * /api/users/login:
 * post:
 * summary: Authorize and issue an expiration-gated JWT access token
 * tags: [Authentication & Access]
 */
router.post("/login", signIn);

// ── PROTECTED IDENTITY GATEWAYS ──────────────────────────────────────

/**
 * @swagger
 * /api/users/logout:
 * post:
 * summary: Clear and invalidate active session tokens
 * tags: [Authentication & Access]
 * security:
 * - bearerAuth: []
 */
router.post("/logout", protect, logout);

/**
 * @swagger
 * /api/users/become-producer:
 * post:
 * summary: Submit a creator application profile form
 * description: |
 * Updates the user's role parameters to include full creator properties in MongoDB.
 * **Security Check:** Strictly requires a valid bearer authentication token from the purchasing user account.
 * tags: [Authentication & Access]
 * security:
 * - bearerAuth: []
 */
// FIXED: Wrapped securely with the protect interceptor to block anonymous profile privilege hijacking exploits
router.post("/become-producer", protect, becomeProducer);

export default router;