import axios from "axios";
import express from "express";
const router = express.Router();
import { protect } from "../middleware/authMiddleware.js";
import {
  bankPayment,
  bankPaymentForGameAccess,
  cardPayment,
  verifyPayment,
  verifyWebhook,
} from "../controllers/paystackcontroller.js";

/**
 * @swagger
 * /api/paystack/cardpayment:
 *   post:
 *     summary: Initialize premium subscription card payment
 *     description: Starts a Paystack transaction for a ₦2000 premium subscription. Only available to non-premium users.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentUrl:
 *                   type: string
 *                   example: https://checkout.paystack.com/xyz123
 *                 reference:
 *                   type: string
 *                   example: 7PVGX8MEk85tgeEpVDtD
 *       400:
 *         description: User is already a premium subscriber
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Already a premium user
 *       500:
 *         description: Failed to initialize payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Card payment initialization failed.
 */

router.post("/cardpayment", protect, cardPayment);

/**
 * @swagger
 * /api/paystack/bankpayment:
 *   post:
 *     summary: Initialize basic subscription bank payment
 *     description: Starts a Paystack transaction for a ₦500 basic subscription using bank payment. Only for users not yet subscribed.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bank payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentUrl:
 *                   type: string
 *                   example: https://checkout.paystack.com/xyz123
 *                 reference:
 *                   type: string
 *                   example: 8PVGX8MEk89hgjEpKTR9
 *       403:
 *         description: User already subscribed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User already subscribed. ₦500 payment not required.
 *       500:
 *         description: Failed to initialize bank payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bank payment initialization failed.
 */

router.post("/bankpayment", protect, bankPayment);

/**
 * @swagger
 * /api/paystack/bankpayment/accessgame:
 *   post:
 *     summary: Initialize ₦100 game access payment (for basic users)
 *     description: Starts a Paystack transaction for ₦100 to grant game access to basic users. Premium users do not need to pay.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Game access payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentUrl:
 *                   type: string
 *                   example: https://checkout.paystack.com/abc123
 *                 reference:
 *                   type: string
 *                   example: 7Xc2K9LsAkLq83dPqwDg
 *       400:
 *         description: User already has game access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User already has game access
 *       403:
 *         description: Premium users are not required to pay for game access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Premium users don't need to pay.
 *       500:
 *         description: Failed to initialize game access payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ₦100 Game Access payment failed
 */

router.post("/bankpayment/accessgame", protect, bankPaymentForGameAccess);

/**
 * INTERNAL ROUTE - DO NOT DOCUMENT IN SWAGGER
 * ----------------------------------------------------
 * This route is used by Paystack to redirect users
 * after completing a transaction. It verifies the
 * payment using the provided reference query parameter.
 *
 * ⚠️ Not intended to be called manually by the frontend.
 * The backend handles this logic internally.
 */

router.get("/verify", verifyPayment);
/**
 * PAYSTACK WEBHOOK ROUTE - DO NOT DOCUMENT IN SWAGGER
 * ----------------------------------------------------
 * This endpoint is triggered automatically by Paystack
 * to notify the server of transaction events (e.g., charge.success).
 * It verifies the Paystack signature to ensure authenticity.
 *
 * ⚠️ Not publicly accessible and should never be called manually.
 */

router.post("/webhook", express.json({ type: "*/*" }), verifyWebhook);

export default router;
