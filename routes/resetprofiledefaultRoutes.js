import express from "express";
import {
  resetPasswordToDefault,
  resetProfile,
} from "../controllers/resetprofiledefaultController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Account Reset Recovery
 * description: Restores account properties back to original registration states.
 */

// Global Interceptor Stack: Every single reset action requires verified authentication signatures
router.use(protect);

/**
 * @swagger
 * /api/resetprofile/resetProfile:
 * put:
 * summary: Reset active user profile values back to original signup configurations
 * description: Overwrites active user properties (fullname, username, email, age) with their original immutable default records.
 * tags: [Account Reset Recovery]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Profile reverted back to baseline default metrics successfully.
 * 404:
 * description: User profile or backup configuration states not found.
 * 409:
 * description: Operation aborted. Original username or email has since been claimed by another user record.
 * 500:
 * description: Internal server error processing data mutations.
 */
router.put("/resetProfile", resetProfile);

/**
 * @swagger
 * /api/resetprofile/resetPassword:
 * put:
 * summary: Revert user account password back to their original signup credentials
 * description: Replaces the active account password hash with the original default signup credentials.
 * tags: [Account Reset Recovery]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Account password hash successfully reset back to default parameters.
 * 404:
 * description: Target profile context or signup fallback hash mapping not found.
 * 500:
 * description: Internal error processing secure hash mutation routines.
 */
router.put("/resetPassword", resetPasswordToDefault);

export default router;