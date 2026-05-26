import express from "express";
const router = express.Router();
// const { signUp, signIn, logout } = require('../controllers/authController');
import { signUp, signIn, logout } from "../controllers/authController.js";
import { becomeProducer } from "../controllers/userController.js";

/**
 * @swagger
 * /api/users/signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account after validating inputs and hashing the password. Returns a JWT token upon success.
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
 *               - password
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: Charles Jiwueze
 *               email:
 *                 type: string
 *                 example: charles@example.com
 *               age:
 *                 type: integer
 *                 example: 20
 *               username:
 *                 type: string
 *                 example: charles20
 *               password:
 *                 type: string
 *                 example: StrongP@ssword1
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully!
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR...
 *                 fullname:
 *                   type: string
 *                 email:
 *                   type: string
 *                 username:
 *                   type: string
 *                 isSubscribed:
 *                   type: boolean
 *                   example: false
 *                 hasGameAccess:
 *                   type: boolean
 *                   example: false
 *                 subscriptionType:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Username or email already in use.
 *       500:
 *         description: Server error during signup
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Signup failed.
 */

router.post("/signup", signUp);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Log in an existing user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: janedoe123
 *               password:
 *                 type: string
 *                 example: StrongP@ss123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful.
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 fullname:
 *                   type: string
 *                   example: Jane Doe
 *                 email:
 *                   type: string
 *                   example: janedoe@example.com
 *                 userId:
 *                   type: string
 *                   example: 64a16e04a4f734b693adfe0d
 *                 isSubscribed:
 *                   type: boolean
 *                   example: true
 *                 hasGameAccess:
 *                   type: boolean
 *                   example: true
 *                 subscriptionType:
 *                   type: string
 *                   enum: [basic, premium, null]
 *                   example: basic
 *       400:
 *         description: Missing username or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Username and password are required.
 *       401:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid password.
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
 *         description: Server error during login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error logging in. Please try again.
 */

router.post("/login", signIn);

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Logout user
 *     description: Logs out the currently authenticated user. Token should be removed client-side (e.g., from localStorage or cookies).
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logout successful. Please remove token on client side.
 */

router.post("/logout", logout);

/**
 * @swagger
 * /api/users/become-producer:
 *   post:
 *     summary: Become a producer
 *     description: Creates a new user account with producer privileges and stores producer application details.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - fullName
 *               - productionName
 *               - countryOfResidence
 *               - prodCountry
 *             properties:
 *               stripeSessionId:
 *                 type: string
 *                 example: session_id
 *               email:
 *                  type: string
 *                  example: johndoe@mailer.com
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               productionName:
 *                 type: string
 *                 example: Doe Productions
 *               countryOfResidence:
 *                 type: string
 *                 example: Nigeria
 *               prodCountry:
 *                 type: string
 *                 example: USA
 *               existingApplication:
 *                 type: boolean
 *                 example: false
 *               campaignSource:
 *                 type: string
 *                 example: Instagram
 *               bio:
 *                 type: string
 *                 example: Experienced film producer
 *               prodDesc:
 *                 type: string
 *                 example: We produce independent movies and documentaries.
 *               budget:
 *                 type: number
 *                 example: 50000
 *               intendedProfit:
 *                 type: number
 *                 example: 150000
 *               promoteIntent:
 *                 type: string
 *                 example: Social media campaigns
 *               whyUs:
 *                 type: string
 *                 example: Your platform offers the best audience reach.
 *               others:
 *                 type: string
 *                 example: Additional notes here.
 *     responses:
 *       200:
 *         description: Producer status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Producer status updated successfully
 *                 credentials:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: johndoe_123
 *                     password:
 *                       type: string
 *                       example: TempPass123
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/become-producer", becomeProducer);

export default router;
