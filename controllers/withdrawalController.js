import { Earning } from '../models/earning.js';
import { Withdrawal } from '../models/withdrawal.js';

const SUPPORTED_CURRENCIES = ['USD', 'GBP'];

/**
 * POST /api/earnings/withdraw-manual
 * Initiates a manual country-specific withdrawal review request.
 * (Renamed from requestWithdrawal to resolve the naming collision with Stripe Connect endpoints)
 */
export const requestManualWithdrawal = async (req, res) => {
  try {
    const producerId = req.user.id;
    const {
      method,
      country,
      currency = 'USD',
      bankDetails,
      cardDetails,
    } = req.body;

    // ── Validation Layers ──────────────────────────────────────────
    if (!method || !['bank_transfer', 'debit_card'].includes(method)) {
      return res.status(400).json({
        message: 'Invalid withdrawal method specified. Must be "bank_transfer" or "debit_card".',
      });
    }

    if (!country || !country.trim()) {
      return res.status(400).json({ message: 'Target country location context is required.' });
    }

    const targetedCurrency = currency.toUpperCase().trim();
    if (!SUPPORTED_CURRENCIES.includes(targetedCurrency)) {
      return res.status(400).json({
        message: `Currency parameter rejected. Must be one of: ${SUPPORTED_CURRENCIES.join(', ')}.`,
      });
    }

    if (method === 'bank_transfer') {
      if (
        !bankDetails?.bankName || !bankDetails?.bankName.trim() ||
        !bankDetails?.accountNumber || !bankDetails?.accountNumber.trim() ||
        !bankDetails?.accountName || !bankDetails?.accountName.trim()
      ) {
        return res.status(400).json({
          message: 'bankName, accountNumber, and accountName parameter items are required for bank transfers.',
        });
      }
    }

    if (method === 'debit_card') {
      if (!cardDetails?.last4 || !cardDetails?.cardNetwork) {
        return res.status(400).json({
          message: 'cardDetails.last4 and cardDetails.cardNetwork parameters are required for debit card extractions.',
        });
      }
    }

    // ── Segregated Currency Balance Engine ──────────────────────────
    // Enforce isolation rules: Query exclusively for records matching the target request currency
    const matchingUnwithdrawnEarnings = await Earning.find({
      producer: producerId,
      currency: targetedCurrency,
      withdrawn: false,
    });

    const isolatedCurrencyBalance = matchingUnwithdrawnEarnings.reduce(
      (sum, e) => sum + (e.netAmount || 0),
      0,
    );

    const sanitizedBalance = parseFloat(isolatedCurrencyBalance.toFixed(2));

    if (sanitizedBalance <= 0) {
      return res.status(400).json({
        message: `Insufficient financial ledger balance allocation for requested currency: ${targetedCurrency}`,
        availableBalance: 0,
        currency: targetedCurrency
      });
    }

    // ── Create Withdrawal Entry ───────────────────────────────────
    const withdrawal = await Withdrawal.create({
      producer: producerId,
      amount: sanitizedBalance,
      currency: targetedCurrency,
      method,
      country: country.trim(),
      bankDetails: method === 'bank_transfer' ? {
        bankName: bankDetails.bankName.trim(),
        accountNumber: bankDetails.accountNumber.trim(),
        accountName: bankDetails.accountName.trim(),
        routingNumber: bankDetails.routingNumber?.trim(),
        sortCode: bankDetails.sortCode?.trim(),
        iban: bankDetails.iban?.trim()
      } : undefined,
      cardDetails: method === 'debit_card' ? {
        last4: cardDetails.last4.trim(),
        cardNetwork: cardDetails.cardNetwork.trim()
      } : undefined,
      status: 'pending',
    });

    // ── Mutate Target Earning Records Pool ──────────────────────────
    const targetEarningIds = matchingUnwithdrawnEarnings.map((e) => e._id);
    await Earning.updateMany(
      { _id: { $in: targetEarningIds } },
      { $set: { withdrawn: true } },
    );

    return res.status(201).json({
      message: 'Manual country withdrawal review request submitted successfully.',
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
    console.error('Manual Withdrawal Core Exception Error:', err);
    return res.status(500).json({ message: 'Failed to process withdrawal parameters request.', error: err.message });
  }
};

/**
 * GET /api/earnings/withdrawals
 * Paginated manual withdrawal history log for the creator dashboard context.
 */
export const getWithdrawalHistory = async (req, res) => {
  try {
    const producerId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find({ producer: producerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          '-bankDetails.accountNumber -bankDetails.iban -bankDetails.routingNumber -bankDetails.sortCode -cardDetails.token',
        ), // Clean scrub of underlying raw account vectors before passing to the interface
      Withdrawal.countDocuments({ producer: producerId }),
    ]);

    return res.status(200).json({
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
    console.error('Withdrawal history execution error:', err);
    return res.status(500).json({
      message: 'Failed to fetch withdrawal historical record tracks.',
      error: err.message,
    });
  }
};