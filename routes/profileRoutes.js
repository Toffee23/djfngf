import express from "express";
import {
  createExtraProfile,
  getExtraProfileById,
  getExtraProfiles,
  getProfilePicture,
  getUserProfile,
  uploadProfilePicture,
} from "../controllers/profileController.js";
import { protect, requireSubscription } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 * name: User Profiles
 * description: Core user workspace, avatar management, and secondary profile sub-slots.
 */

// Global Middleware Interceptor: All profile endpoints require verified token authenticity
router.use(protect);

// ── Open Account Identity Endpoints (Accessible to All Tiers) ───

/**
 * @swagger
 * /api/profile/user/profile:
 * get:
 * summary: Get authenticated user's profile and workspace metadata
 * description: Retrieves the main user record, active creator variables, and sub-profile sets. Open to all tiers to facilitate localized billing upgrades.
 * tags: [User Profiles]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Profile payload retrieved successfully.
 * 401:
 * description: Unauthorized token signature check failed.
 * 404:
 * description: User profile record match not found.
 */
router.get("/user/profile", getUserProfile); // FIXED: Removed requireSubscription so unpaid accounts can access upgrade menus

// ── Premium Multi-Profile Gated Feature Endpoints ───────────────

/**
 * @swagger
 * /api/profile/upload-picture:
 * post:
 * summary: Upload user profile picture asset url
 * tags: [User Profiles]
 * security:
 * - bearerAuth: []
 */
router.post("/upload-picture", requireSubscription, uploadProfilePicture);

/**
 * @swagger
 * /api/profile/profile-picture:
 * get:
 * summary: Fetch active user avatar asset tracking string
 * tags: [User Profiles]
 * security:
 * - bearerAuth: []
 */
router.get("/profile-picture", requireSubscription, getProfilePicture);

/**
 * @swagger
 * /api/profile/extra-profile:
 * post:
 * summary: Create an extra profile slot (Premium exclusive)
 * description: Provisions a secondary streaming space. Maximum allocation boundary is 3 profiles.
 * tags: [User Profiles]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - nickname
 * properties:
 * nickname:
 * type: string
 * example: John Jr.
 * description: Unique profile identifier name.
 * responses:
 * 201:
 * description: Secondary sub-profile initialized successfully.
 */
router.post("/extra-profile", requireSubscription, createExtraProfile); // FIXED: Kept securely gated via subscription checks

/**
 * @swagger
 * /api/profile/extra-profile:
 * get:
 * summary: List all active extra profile sub-slots
 * tags: [User Profiles]
 * security:
 * - bearerAuth: []
 */
router.get("/extra-profile", requireSubscription, getExtraProfiles);

/**
 * @swagger
 * /api/profile/extra-profile/{id}:
 * get:
 * summary: Retrieve details for a specific sub-profile index
 * tags: [User Profiles]
 * security:
 * - bearerAuth: []
 */
router.get("/extra-profile/:id", requireSubscription, getExtraProfileById);

export default router;