import express from "express";
const router = express.Router();
import { getProfile } from "../controllers/fetchuserController.js";
import { protect, requireSubscription } from "../middleware/authMiddleware.js";

/**
 * @swagger
 * /api/fetchuser/fetchedProfile:
 *   get:
 *     summary: Get the current user's profile
 *     description: Retrieves the profile information of the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fullname:
 *                   type: string
 *                   example: Charles Jiwueze
 *                 username:
 *                   type: string
 *                   example: charles20
 *                 email:
 *                   type: string
 *                   example: charles@example.com
 *                 age:
 *                   type: integer
 *                   example: 20
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found.
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error while fetching profile.
 */

router.get("/fetchedProfile", protect, getProfile);

export default router;
