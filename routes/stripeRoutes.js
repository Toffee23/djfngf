import express from "express";
import { protect, requireProducer } from "../middleware/authMiddleware.js";
import {
  subscribePremium,
  createProducerSubscription,
  initiatePayment,
  stripeWebhook,
  createConnectAccount,
  payoutToProducer,
  verifyProducerPayment,
  verifyMovieAccess,
} from "../controllers/stripeController.js";

const router = express.Router();

// // ====================== WEBHOOK ======================
// router.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   stripeWebhook,
// );

// ====================== SUBSCRIPTIONS ======================

/**
 * @swagger
 * /api/stripe/subscribe/premium:
 *   post:
 *     summary: Subscribe to Premium Plan (Monthly Recurring)
 *     description: Creates a Stripe Checkout session for premium monthly subscription.
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stripe Checkout session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentUrl:
 *                   type: string
 *                 sessionId:
 *                   type: string
 */
router.post("/subscribe/premium", protect, subscribePremium);

/**
 * @swagger
 * /api/stripe/producer/subscribe:
 *   post:
 *     summary: Create Producer Monthly Recurring Subscription ($)
 *     description: >
 *       payment endpoint to become a producer
 *     tags: [Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, fullName, paymentMethodId]
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       200:
 *         description: Subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 subscriptionId:
 *                   type: string
 *                 clientSecret:
 *                   type: string
 *                 pendingId:
 *                   type: string
 *       400:
 *         description: Missing required fields or duplicate subscription
 *       500:
 *         description: Server error
 */
router.post("/producer/subscribe", createProducerSubscription);

// ====================== ONE-TIME PAYMENTS ======================

/**
 * @swagger
 * /api/stripe/pay:
 *   post:
 *     summary: Unified one-time payment endpoint
 *     description: Currently used for movie purchases.
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [movie]
 *               movieId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stripe Checkout session created
 */
router.post(
  "/pay",
  (req, res, next) => {
    if (req.headers.authorization || req.cookies?.token) {
      return protect(req, res, next);
    }
    next();
  },
  initiatePayment,
);

// ====================== PRODUCER REGISTRATION FLOW ======================

/**
 * @swagger
 * /api/stripe/producer-payment/verify:
 *   get:
 *     summary: Verify producer subscription payment before showing application form
 *     description: Called after successful payment to verify the session and pre-fill the form.
 *     tags: [Stripe]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe Subscription ID or Session ID
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: sessionId is required
 *       404:
 *         description: No payment found
 *       410:
 *         description: Payment session expired
 */
router.get("/producer-payment/verify", verifyProducerPayment);

// ====================== STRIPE CONNECT (Payouts) ======================

/**
 * @swagger
 * /api/stripe/connect/onboard:
 *   post:
 *     summary: Start Stripe Connect onboarding for producers
 *     tags: [Stripe Connect]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding URL returned
 */
router.post("/connect/onboard", protect, requireProducer, createConnectAccount);

/**
 * @swagger
 * /api/stripe/connect/payout:
 *   post:
 *     summary: Request payout of available earnings
 *     tags: [Stripe Connect]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Payout successful
 */
router.post("/connect/payout", protect, requireProducer, payoutToProducer);

/**
 * @swagger
 * /api/stripe/movie-access/verify:
 *   get:
 *     summary: Verify movie access (guest or logged-in user)
 *     tags: [Stripe]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe Session ID
 *       - in: query
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Access granted
 *       400:
 *         description: sessionId and movieId are required
 *       403:
 *         description: Access not granted
 *       404:
 *         description: Movie not found
 */

router.get(
  "/movie-access/verify",
  (req, res, next) => {
    if (req.headers.authorization || req.cookies?.token) {
      return protect(req, res, next);
    }
    next();
  },
  verifyMovieAccess,
);

export default router;
