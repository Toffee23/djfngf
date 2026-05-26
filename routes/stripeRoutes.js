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

// ── CRITICAL STRIPE WEBHOOK LISTENER ───────────────────────────────
// RESTORED: Must stay un-commented and explicitly wrapped in express.raw 
// to pass raw unparsed binary buffers directly down to the signature validation routines.
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// ── CUSTOMER SUBSCRIPTION INSTANCE MANAGEMENT ──────────────────────

/**
 * @swagger
 * /api/stripe/subscribe/premium:
 * post:
 * summary: Initialize a premium recurring subscription checkout session ($5/mo)
 * tags: [Stripe Gateway]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Stripe Checkout Session initialized successfully. Returns authorization url link.
 */
router.post("/subscribe/premium", protect, subscribePremium);

/**
 * @swagger
 * /api/stripe/producer/subscribe:
 * post:
 * summary: Create a creator producer subscription checkout session ($100/mo)
 * description: Initializes a hosted payment intent configuration script to unlock creator uploading profiles.
 * tags: [Stripe Gateway]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [email, fullName]
 * properties:
 * email:
 * type: string
 * example: john@example.com
 * fullName:
 * type: string
 * example: John Doe
 * responses:
 * 200:
 * description: Onboarding transaction initialized successfully.
 */
router.post("/producer/subscribe", createProducerSubscription); // FIXED: Removed paymentMethodId from requirements contract mapping to match our refactored controller parameters

// ── TRANSACTIONS & ACCESS CONFIRMATIONS ────────────────────────────

/**
 * @swagger
 * /api/stripe/pay:
 * post:
 * summary: Unified pay-per-view single movie checkout gateway
 * tags: [Stripe Gateway]
 */
router.post(
  "/pay",
  (req, res, next) => {
    if (req.headers.authorization || req.cookies?.token) {
      return protect(req, res, next);
    }
    return next();
  },
  initiatePayment,
);

/**
 * @swagger
 * /api/stripe/producer-payment/verify:
 * get:
 * summary: Verify session payment completion before serving creator onboarding form entries
 * tags: [Stripe Gateway]
 */
router.get("/producer-payment/verify", verifyProducerPayment);

/**
 * @swagger
 * /api/stripe/movie-access/verify:
 * get:
 * summary: Live permission check to grant movie playback visibility to guest or logged-in accounts
 * tags: [Stripe Gateway]
 */
router.get(
  "/movie-access/verify",
  (req, res, next) => {
    if (req.headers.authorization || req.cookies?.token) {
      return protect(req, res, next);
    }
    return next();
  },
  verifyMovieAccess,
);

// ── STRIPE EXPRESS CONNECT PORTALS (CREATOR PAYOUTS) ───────────────

/**
 * @swagger
 * /api/stripe/connect/onboard:
 * post:
 * summary: Generate a dynamic onboarding link for a producer's Stripe Express account split
 * tags: [Stripe Connect Split]
 * security:
 * - bearerAuth: []
 */
router.post("/connect/onboard", protect, requireProducer, createConnectAccount);

/**
 * @swagger
 * /api/stripe/connect/payout:
 * post:
 * summary: Process instant automated earnings withdrawal transfer directly to a creator's linked balance
 * tags: [Stripe Connect Split]
 * security:
 * - bearerAuth: []
 */
router.post("/connect/payout", protect, requireProducer, payoutToProducer);

export default router;