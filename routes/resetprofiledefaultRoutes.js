import express from "express";
import {
  resetPasswordToDefault,
  resetProfile,
} from "../controllers/resetprofiledefaultController.js";
const router = express.Router();
import { protect, requireSubscription } from "../middleware/authMiddleware.js";
// const resetProfileDefaultController = require("../controllers/resetprofiledefaultController.js");

/**
 * @swagger
 * /api/resetprofile/resetProfile:
 *   put:
 *     summary: Reset user profile to default
 *     description: Resets the authenticated user's profile (fullname, username, email, age) to their original signup values.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile has been reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile has been reset to original signup details.
 *                 user:
 *                   type: object
 *                   properties:
 *                     fullname:
 *                       type: string
 *                       example: John Doe
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *                     age:
 *                       type: number
 *                       example: 22
 *       404:
 *         description: User or default profile not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User or default profile not found.
 *       409:
 *         description: Reset failed due to username/email conflict.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cannot reset profile. Original username or email is now in use by another user.
 *       500:
 *         description: Server error while resetting profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to reset profile.
 */

router.put("/resetProfile", protect, resetProfile);

/**
 * @swagger
 * /api/resetprofile/resetPassword:
 *   put:
 *     summary: Reset password to default
 *     description: Resets the authenticated user's password to the original password used during signup.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Password reset to original successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password has been reset to your original signup password.
 *       404:
 *         description: User or original password not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User or default password not found.
 *       500:
 *         description: Server error while resetting password.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to reset password.
 */

router.put("/resetPassword", protect, resetPasswordToDefault);

export default router;
