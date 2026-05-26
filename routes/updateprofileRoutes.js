import express from "express";
import {
  changePassword,
  updateUserDetails,
} from "../controllers/updateprofileController.js";
const router = express.Router();
import { protect, requireSubscription } from "../middleware/authMiddleware.js";
// const updateprofileController = require("../controllers/updateprofileController");

/**
 * @swagger
 * /api/updateprofile/updateProfile:
 *   put:
 *     summary: Update user details
 *     description: Allows an authenticated user to update their fullname, email, age, or username.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - email
 *               - age
 *               - username
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: Charles Jiwueze
 *               username:
 *                 type: string
 *                 example: charles2025
 *               email:
 *                 type: string
 *                 example: charles2025@example.com
 *               age:
 *                 type: integer
 *                 example: 21
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully.
 *       400:
 *         description: Bad request (validation or uniqueness error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email already in use.
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
 *         description: Failed to update user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to update user.
 */

router.put("/updateProfile", protect, updateUserDetails);

/**
 * @swagger
 * /api/updateprofile/updatePassword:
 *   put:
 *     summary: Change user password
 *     description: Allows an authenticated user to update their password.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: NewPass123!
 *               confirmPassword:
 *                 type: string
 *                 example: NewPass123!
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password updated successfully!
 *       400:
 *         description: Bad request (validation or mismatch error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Passwords do not match.
 *       500:
 *         description: Failed to change password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to change password.
 */

router.put("/updatePassword", protect, changePassword);

export default router;
