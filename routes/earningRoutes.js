import express from "express";

import { protect, requireProducer } from "../middleware/authMiddleware.js";

import {
  getEarningsDashboard,
  getEarningsHistory,
} from "../controllers/earningController.js";

import { getWithdrawalHistory } from "../controllers/withdrawalController.js";

import { payoutToProducer } from "../controllers/stripeController.js";

const router = express.Router();

// All routes require authentication + producer access
router.use(protect, requireProducer);

/**
 * @swagger
 * tags:
 *   name: Earnings
 *   description: Producer earnings & withdrawals
 */

/**
 * @swagger
 * /api/earnings/dashboard:
 *   get:
 *     summary: Get producer earnings dashboard
 *     description: Returns available balance, total earnings, total withdrawals, and unique viewers.
 *     tags: [Earnings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings dashboard fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               currentEarning: 245.5
 *               totalEarnings: 1240.75
 *               totalWithdrawal: 995.25
 *               totalViewers: 32
 *               currency: USD
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Producer account required
 */
router.get("/dashboard", getEarningsDashboard);

/**
 * @swagger
 * /api/earnings/history:
 *   get:
 *     summary: Get paginated earnings history
 *     tags: [Earnings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Earnings history fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               earnings:
 *                 - _id: "685f2cb7f91d7d6a91ab1201"
 *                   producer: "685f2a4df91d7d6a91ab1001"
 *                   movie:
 *                     _id: "685f2b6cf91d7d6a91ab1101"
 *                     title: "The Last Mission"
 *                     posterImage: "https://example.com/poster.jpg"
 *                   viewer:
 *                     _id: "685f2d10f91d7d6a91ab1301"
 *                     username: "john_doe"
 *                   grossAmount: 20
 *                   platformFeePercent: 20
 *                   netAmount: 16
 *                   currency: "USD"
 *                   withdrawn: false
 *                   createdAt: "2026-05-18T12:00:00.000Z"
 *               pagination:
 *                 total: 25
 *                 page: 1
 *                 limit: 20
 *                 totalPages: 2
 *       401:
 *         description: Unauthorized
 */
router.get("/history", getEarningsHistory);

/**
 * @swagger
 * /api/earnings/withdraw:
 *   post:
 *     summary: Withdraw producer earnings
 *     description: Transfers available balance to the producer Stripe Connect account.
 *     tags: [Earnings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               country:
 *                 type: string
 *                 example: Nigeria
 *     responses:
 *       201:
 *         description: Withdrawal successful
 *         content:
 *           application/json:
 *             example:
 *               message: "Withdrawal successful"
 *               amount: 245.5
 *               stripeTransferId: "tr_1Rt9AbCDeFG"
 *               withdrawalId: "685f312ef91d7d6a91ab1501"
 *       400:
 *         description: No available balance or Stripe onboarding incomplete
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Producer account required
 */
router.post("/withdraw", payoutToProducer);

/**
 * @swagger
 * /api/earnings/withdrawals:
 *   get:
 *     summary: Get paginated withdrawal history
 *     tags: [Earnings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Withdrawal history fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/withdrawals", getWithdrawalHistory);

export default router;
