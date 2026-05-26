import express from "express";
import { protect, requireProducer } from "../middleware/authMiddleware.js";
import {
  getEarningsDashboard,
  getEarningsHistory,
} from "../controllers/earningController.js";
import { 
  getWithdrawalHistory, 
  requestManualWithdrawal 
} from "../controllers/withdrawalController.js";
import { payoutToProducer } from "../controllers/stripeController.js";

const router = express.Router();

// All underlying routes require validated authentication + explicit producer tier access
router.use(protect, requireProducer);

/**
 * @swagger
 * tags:
 * name: Earnings
 * description: Producer analytics tracker, balance evaluations, and payout gateways.
 */

/**
 * @swagger
 * /api/earnings/dashboard:
 * get:
 * summary: Get producer earnings statistics dashboard summary
 * tags: [Earnings]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Dashboard statistics computed and delivered successfully.
 */
router.get("/dashboard", getEarningsDashboard);

/**
 * @swagger
 * /api/earnings/history:
 * get:
 * summary: Get paginated historical breakdown of individual movie stream sales
 * tags: [Earnings]
 * security:
 * - bearerAuth: []
 */
router.get("/history", getEarningsHistory);

/**
 * @swagger
 * /api/earnings/withdraw/stripe:
 * post:
 * summary: Instant automated withdrawal via Stripe Connect Express channels
 * tags: [Earnings]
 * security:
 * - bearerAuth: []
 */
router.post("/withdraw/stripe", payoutToProducer);

/**
 * @swagger
 * /api/earnings/withdraw/manual:
 * post:
 * summary: Request localized manual bank transfer payout review (e.g., NG Local Bank Clearing)
 * tags: [Earnings]
 * security:
 * - bearerAuth: []
 */
router.post("/withdraw/manual", requestManualWithdrawal);

/**
 * @swagger
 * /api/earnings/withdrawals:
 * get:
 * summary: Get complete paginated history logs of all manual and automated withdrawals
 * tags: [Earnings]
 * security:
 * - bearerAuth: []
 */
router.get("/withdrawals", getWithdrawalHistory);

export default router;