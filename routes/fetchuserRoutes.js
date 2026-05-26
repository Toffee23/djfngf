import express from "express";
import { getProfile } from "../controllers/fetchuserController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Identity Retrieval
 * description: Core authenticated account profiling lookups.
 */

/**
 * @swagger
 * /api/fetchuser/fetchedProfile:
 * get:
 * summary: Get the current authenticated user's profile info
 * description: Retrieves core profile parameters of the user bound to the active JWT token.
 * tags: [Identity Retrieval]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Successfully retrieved user profile metrics context.
 * 401:
 * description: Unauthorized. Missing or malformed authentication token.
 * 404:
 * description: User profile matching token claims not found.
 * 500:
 * description: Server structural error during identity extraction.
 */
router.get("/fetchedProfile", protect, getProfile);

export default router;