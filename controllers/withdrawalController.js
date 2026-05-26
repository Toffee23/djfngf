import { Earning } from '../models/earning.js';
import { Withdrawal } from '../models/withdrawal.js';

// Supported currencies per the UI note ("USD AND GBP as base currencies")
const SUPPORTED_CURRENCIES = ['USD', 'GBP'];

/**
 * POST /api/earnings/withdraw
 *
 * Initiates a withdrawal request.
 *
 * Body:
 * {
 *   "method":   "bank_transfer" | "debit_card",
 *   "country":  "Nigeria",
 *   "currency": "USD",           // optional, defaults to USD
 *
 *   // if method === "bank_transfer":
 *   "bankDetails": {
 *     "bankName":      "GTBank",
 *     "accountNumber": "0123456789",
 *     "accountName":   "John Doe",
 *     "routingNumber": "...",   // USD wires
 *     "sortCode":      "...",   // GBP wires
 *     "iban":          "..."    // optional
 *   },
 *
 *   // if method === "debit_card":
 *   "cardDetails": {
 *     "last4":       "4242",
 *     "cardNetwork": "Visa"
 *   }
 * }
 */
export const requestWithdrawal = async (req, res) => {
  try {
    const producerId = req.user.id;
    const {
      method,
      country,
      currency = 'USD',
      bankDetails,
      cardDetails,
    } = req.body;

    // ── Validation ────────────────────────────────────────────────
    if (!method || !['bank_transfer', 'debit_card'].includes(method)) {
      return res.status(400).json({
        message: 'method must be "bank_transfer" or "debit_card".',
      });
    }

    if (!country) {
      return res.status(400).json({ message: 'country is required.' });
    }

    if (!SUPPORTED_CURRENCIES.includes(currency.toUpperCase())) {
      return res.status(400).json({
        message: `currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}.`,
      });
    }

    if (method === 'bank_transfer') {
      if (
        !bankDetails?.bankName ||
        !bankDetails?.accountNumber ||
        !bankDetails?.accountName
      ) {
        return res.status(400).json({
          message:
            'bankDetails.bankName, accountNumber, and accountName are required for bank transfers.',
        });
      }
    }

    if (method === 'debit_card') {
      if (!cardDetails?.last4 || !cardDetails?.cardNetwork) {
        return res.status(400).json({
          message:
            'cardDetails.last4 and cardDetails.cardNetwork are required for debit card withdrawals.',
        });
      }
    }

    // ── Available balance ─────────────────────────────────────────
    const unwithdrawnEarnings = await Earning.find({
      producer: producerId,
      withdrawn: false,
    });

    const availableBalance = unwithdrawnEarnings.reduce(
      (sum, e) => sum + e.netAmount,
      0,
    );

    if (availableBalance <= 0) {
      return res.status(400).json({
        message: 'No available balance to withdraw.',
        availableBalance: 0,
      });
    }

    // ── Create withdrawal record ───────────────────────────────────
    const withdrawal = await Withdrawal.create({
      producer: producerId,
      amount: parseFloat(availableBalance.toFixed(2)),
      currency: currency.toUpperCase(),
      method,
      country,
      bankDetails: method === 'bank_transfer' ? bankDetails : undefined,
      cardDetails: method === 'debit_card' ? cardDetails : undefined,
      status: 'pending',
    });

    // ── Mark earnings as withdrawn ─────────────────────────────────
    const earningIds = unwithdrawnEarnings.map((e) => e._id);
    await Earning.updateMany(
      { _id: { $in: earningIds } },
      { $set: { withdrawn: true } },
    );

    res.status(201).json({
      message: 'Withdrawal request submitted successfully.',
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        method: withdrawal.method,
        country: withdrawal.country,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
    });
  } catch (err) {
    console.error('Withdrawal error:', err);
    res
      .status(500)
      .json({ message: 'Failed to process withdrawal', error: err.message });
  }
};

/**
 * GET /api/earnings/withdrawals?page=1&limit=10
 *
 * Paginated withdrawal history for the authenticated producer.
 */
export const getWithdrawalHistory = async (req, res) => {
  try {
    const producerId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find({ producer: producerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          '-bankDetails.accountNumber -bankDetails.iban -bankDetails.routingNumber -bankDetails.sortCode',
        ), // hide sensitive fields
      Withdrawal.countDocuments({ producer: producerId }),
    ]);

    res.status(200).json({
      withdrawals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error('Withdrawal history error:', err);
    res
      .status(500)
      .json({
        message: 'Failed to fetch withdrawal history',
        error: err.message,
      });
  }
};
