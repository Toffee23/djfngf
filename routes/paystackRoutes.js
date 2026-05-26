import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  bankPayment,
  bankPaymentForGameAccess,
  cardPayment,
  verifyPayment,
  verifyWebhook,
} from "../controllers/paystackcontroller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Paystack Gateway
 * description: Localized Nigerian payment solutions for regional subscription cards and bank channels.
 */

/**
 * @swagger
 * /api/paystack/cardpayment:
 * post:
 * summary: Initialize premium subscription card transaction settlement
 * tags: [Paystack Gateway]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Transaction initialization successful. Returns Paystack billing URL.
 * 400:
 * description: Account level criteria conflict. User is already premium.
 */
router.post("/cardpayment", protect, cardPayment);

/**
 * @swagger
 * /api/paystack/bankpayment:
 * post:
 * summary: Initialize basic subscription payment via regional bank verification
 * tags: [Paystack Gateway]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Bank verification payment window initialized successfully.
 */
router.post("/bankpayment", protect, bankPayment);

/**
 * @swagger
 * /api/paystack/bankpayment/accessgame:
 * post:
 * summary: Process arcade arena entry single-session token purchase (Basic members only)
 * tags: [Paystack Gateway]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Arcade entrance fee initialization generated successfully.
 */
router.post("/bankpayment/accessgame", protect, bankPaymentForGameAccess);

/**
 * INTERNAL REDIRECT ROUTE - EXCLUDED FROM SWAGGER SCHEMAS
 * Captures verification requests incoming from client redirect flows.
 */
router.get("/verify", verifyPayment);

/**
 * BACKGROUND WEBHOOK INTEGRATION HOOK - EXCLUDED FROM SWAGGER SCHEMAS
 * Cleared of duplicate inline parsing blocks to safeguard request buffer stream integrity.
 */
router.post("/webhook", verifyWebhook);

export default router;