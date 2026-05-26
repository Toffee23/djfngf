import express from "express";
import {
  changePassword,
  updateUserDetails,
} from "../controllers/updateprofileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Identity Mutation
 * description: Endpoints for changing active security credentials and editing core profile parameters.
 */

// Global Interceptor Chain: All profile mutation channels require verified authorization tokens
router.use(protect);

/**
 * @swagger
 * /api/updateprofile/updateProfile:
 * put:
 * summary: Update active user account parameters
 * description: Allows an authenticated user profile to rewrite their fullname, email string, age, or unique username.
 * tags: [Identity Mutation]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - fullname
 * - email
 * - age
 * - username
 * properties:
 * fullname:
 * type: string
 * example: Charles Jiwueze
 * username:
 * type: string
 * example: charles2026
 * email:
 * type: string
 * example: charles2026@example.com
 * age:
 * type: integer
 * example: 21
 * responses:
 * 200:
 * description: Identity properties modified successfully in MongoDB.
 * 400:
 * description: Request validation failure. Username or email string is already claimed.
 * 404:
 * description: Target user instance not found.
 * 500:
 * description: Internal structural exception handling document update operations.
 */
router.put("/updateProfile", updateUserDetails);

/**
 * @swagger
 * /api/updateprofile/updatePassword:
 * put:
 * summary: Securely change user account password strings
 * description: Mutates active account password hashes after passing matching structural parameters.
 * tags: [Identity Mutation]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - newPassword
 * - confirmPassword
 * properties:
 * newPassword:
 * type: string
 * example: NewPass123!
 * confirmPassword:
 * type: string
 * example: NewPass123!
 * responses:
 * 200:
 * description: Password updated and newly re-hashed to disk successfully.
 * 400:
 * description: Validation block drop. Input parameters do not match structural formatting criteria.
 * 500:
 * description: Internal encryption engine exception handling hash operations.
 */
router.put("/updatePassword", changePassword);

export default router;