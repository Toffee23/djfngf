import { Earning } from "../models/earning.js";
import { Withdrawal } from "../models/withdrawal.js";
import { User } from "../models/User.js";
import Stripe from "stripe";

let stripe;
const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY)
      throw new Error("STRIPE_SECRET_KEY not set");
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};
// GET /api/earnings/dashboard
export const getEarningsDashboard = async (req, res) => {
  try {
    const producerId = req.user.id;

    const earnings = await Earning.find({ producer: producerId });
    const totalEarnings = earnings.reduce((sum, e) => sum + e.netAmount, 0);
    const currentEarning = earnings
      .filter((e) => !e.withdrawn)
      .reduce((sum, e) => sum + e.netAmount, 0);

    const withdrawals = await Withdrawal.find({
      producer: producerId,
      status: "completed",
    });

    const totalWithdrawal = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const uniqueViewers = new Set(earnings.map((e) => e.viewer.toString()))
      .size;

    res.status(200).json({
      currentEarning: parseFloat(currentEarning.toFixed(2)),
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      totalWithdrawal: parseFloat(totalWithdrawal.toFixed(2)),
      totalViewers: uniqueViewers,
      currency: "USD",
    });
  } catch (err) {
    console.error("Earnings dashboard error:", err);
    res.status(500).json({ message: "Failed to fetch earnings dashboard" });
  }
};

// GET /api/earnings/history
export const getEarningsHistory = async (req, res) => {
  try {
    const producerId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [earnings, total] = await Promise.all([
      Earning.find({ producer: producerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("movie", "title posterImage")
        .populate("viewer", "username"),
      Earning.countDocuments({ producer: producerId }),
    ]);

    res.status(200).json({
      earnings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch earnings history" });
  }
};

// POST /api/earnings/withdraw (Main Withdrawal using Stripe Connect)
export const requestWithdrawal = async (req, res) => {
  try {
    const producerId = req.user.id;
    const { country } = req.body; // optional

    const user = await User.findById(producerId);
    if (!user.stripeAccountId) {
      return res.status(400).json({
        message: "Please complete Stripe Connect onboarding first.",
      });
    }

    const unwithdrawnEarnings = await Earning.find({
      producer: producerId,
      withdrawn: false,
    });

    const availableBalance = unwithdrawnEarnings.reduce(
      (sum, e) => sum + e.netAmount,
      0,
    );

    if (availableBalance <= 0) {
      return res
        .status(400)
        .json({ message: "No available balance to withdraw" });
    }

    // Use Stripe Connect Payout
    const transfer = await stripe.transfers.create({
      amount: Math.round(availableBalance * 100),
      currency: "usd",
      destination: user.stripeAccountId,
      description: `Payout to producer ${user.username}`,
    });

    // Record withdrawal
    const withdrawal = await Withdrawal.create({
      producer: producerId,
      amount: parseFloat(availableBalance.toFixed(2)),
      currency: "USD",
      method: "stripe_connect",
      country: country || "unknown",
      status: "completed",
      stripeTransferId: transfer.id,
    });

    // Mark earnings as withdrawn
    await Earning.updateMany(
      { _id: { $in: unwithdrawnEarnings.map((e) => e._id) } },
      { $set: { withdrawn: true } },
    );

    res.status(201).json({
      message: "Withdrawal successful",
      amount: availableBalance,
      stripeTransferId: transfer.id,
      withdrawalId: withdrawal._id,
    });
  } catch (err) {
    console.error("Withdrawal error:", err);
    res
      .status(500)
      .json({ message: "Failed to process withdrawal", error: err.message });
  }
};
