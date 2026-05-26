import express from "express";
import {
  createExtraProfile,
  getExtraProfileById,
  getExtraProfiles,
  getProfilePicture,
  getUserProfile,
  uploadProfilePicture,
} from "../controllers/profileController.js";

// import { upload } from "../config/cloudinary.js";

import { protect, requireSubscription } from "../middleware/authMiddleware.js";
// const profileController = require("../controllers/profileController");
const router = express.Router();

/**
 * @swagger
 * /api/profile/upload-picture:
 *   post:
 *     summary: Upload user profile picture
 *     description: Uploads a profile picture for the authenticated user and updates the user’s profile.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 example: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/sample.jpg
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile picture uploaded
 *                 imageUrl:
 *                   type: string
 *                   example: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/sample.jpg
 *       500:
 *         description: Upload failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Upload failed
 *                 error:
 *                   type: string
 */

router.post(
  "/upload-picture",
  protect,
  requireSubscription,
  uploadProfilePicture,
);

/**
 * @swagger
 * /api/profile/profile-picture:
 *   get:
 *     summary: Get user profile picture
 *     description: Retrieves the profile picture URL of the authenticated user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved profile picture
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profilePicture:
 *                   type: string
 *                   nullable: true
 *                   example: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/sample.jpg
 *       401:
 *         description: Unauthorized – user not authenticated
 *       500:
 *         description: Server error
 */

router.get("/profile-picture", protect, requireSubscription, getProfilePicture);

/**
 * @swagger
 * /api/profile/extra-profile:
 *   post:
 *     summary: Create an extra profile
 *     description: Allows an authenticated user to create an extra profile. A maximum of 3 extra profiles are allowed per user.
 *     tags:
 *       - ExtraProfiles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - age
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Jr.
 *               age:
 *                 type: number
 *                 example: 13
 *               bio:
 *                 type: string
 *                 example: Loves soccer and math
 *     responses:
 *       201:
 *         description: Extra profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Extra profile created
 *                 profile:
 *                   $ref: '#/components/schemas/ExtraProfile'
 *       400:
 *         description: Maximum profile limit reached
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Maximum of 3 extra profiles allowed
 *       500:
 *         description: Server error
 */

router.post("/extra-profile", protect, requireSubscription, createExtraProfile);

/**
 * @swagger
 * /api/profile/extra-profile:
 *   get:
 *     summary: Get extra profiles
 *     description: Retrieves all extra profiles created by the authenticated user (maximum of 3 allowed).
 *     tags:
 *       - ExtraProfiles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved extra profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profiles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExtraProfile'
 *       401:
 *         description: Unauthorized – user not authenticated
 *       500:
 *         description: Server error
 */

router.get("/extra-profile", protect, requireSubscription, getExtraProfiles);

/**
 * @swagger
 * /api/profile/extra-profile/{id}:
 *   get:
 *     summary: Get a specific extra profile
 *     description: Retrieves a single extra profile by its ID, if it belongs to the authenticated user.
 *     tags:
 *       - ExtraProfiles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the extra profile to retrieve
 *         schema:
 *           type: string
 *           example: 64d20eb19b0a2c1f1c123456
 *     responses:
 *       200:
 *         description: Extra profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   $ref: '#/components/schemas/ExtraProfile'
 *       404:
 *         description: Extra profile not found or does not belong to user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Extra profile not found
 *       401:
 *         description: Unauthorized – user not authenticated
 *       500:
 *         description: Server error
 */

router.get(
  "/extra-profile/:id",
  protect,
  requireSubscription,
  getExtraProfileById,
);

/**
 * @swagger
 * /api/profile/user/profile:
 *   get:
 *     summary: Get authenticated user's profile (subscription required)
 *     description: |
 *       Retrieves the authenticated user's main profile data along with any extra profiles (up to 3).
 *       This endpoint is only accessible to users with an active subscription.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to your profile
 *                 fullname:
 *                   type: string
 *                   example: Jane Doe
 *                 username:
 *                   type: string
 *                   example: janedoe
 *                 email:
 *                   type: string
 *                   example: janedoe@example.com
 *                 profilePicture:
 *                   type: string
 *                   nullable: true
 *                   example: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/avatar.jpg
 *                 isSubscribed:
 *                   type: boolean
 *                   example: true
 *                 extraProfiles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExtraProfile'
 *       401:
 *         description: Unauthorized – token missing or invalid
 *       403:
 *         description: Forbidden – subscription required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subscription required to access this route
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

router.get("/user/profile", protect, requireSubscription, getUserProfile);

export default router;
