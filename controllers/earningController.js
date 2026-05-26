import { Earning } from "../models/earning.js";
import { Withdrawal } from "../models/withdrawal.js";
import { User } from "../models/User.js";
import Stripe from "stripe";

let stripeClient;
const getStripe = () => {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not defined in the environment variables.");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
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
    const uniqueViewers = new Set(earnings.map((e) => e.viewer ? e.viewer.toString() : "")).size;

    return res.status(200).json({
      currentEarning: parseFloat(currentEarning.toFixed(2)),
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      totalWithdrawal: parseFloat(totalWithdrawal.toFixed(2)),
      totalViewers: uniqueViewers,
      currency: "USD",
    });
  } catch (err) {
    console.error("Earnings Dashboard Core Error:", err);
    return res.status(500).json({ message: "Failed to fetch earnings dashboard" });
  }
};

// GET /api/earnings/history
export const getEarningsHistory = async (req, res) => {
  try {
    const producerId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
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

    return res.status(200).json({
      earnings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Earnings History Core Error:", err);
    return res.status(500).json({ message: "Failed to fetch earnings history" });
  }
};

// POST /api/earnings/withdraw (Main Withdrawal using Stripe Connect)
export const requestWithdrawal = async (req, res) => {
  try {
    const stripeInstance = getStripe(); // Fixed the critical unitialized instance call bug
    const producerId = req.user.id;
    const { country } = req.body;

    const user = await User.findById(producerId);
    if (!user) {
      return res.status(404).json({ message: "User account profile not found." });
    }

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

    // Using a safer fractional precision string parse to protect currency allocations
    const sanitizedBalance = parseFloat(availableBalance.toFixed(2));

    if (sanitizedBalance <= 0) {
      return res.status(400).json({ message: "No available balance to withdraw" });
    }

    // Process Stripe Connect Payout safely using the local module instance
    const transfer = await stripeInstance.transfers.create({
      amount: Math.round(sanitizedBalance * 100), // Converted cleanly to cents/kobo equivalent integers
      currency: "usd",
      destination: user.stripeAccountId,
      description: `Payout to producer ${user.username}`,
    });

    // Create the database tracking record
    const withdrawal = await Withdrawal.create({
      producer: producerId,
      amount: sanitizedBalance,
      currency: "USD",
      method: "stripe_connect",
      country: country || "unknown",
      status: "completed",
      stripeTransferId: transfer.id,
    });

    // Batch update the unwithdrawn earnings pool
    await Earning.updateMany(
      { _id: { $in: unwithdrawnEarnings.map((e) => e._id) } },
      { $set: { withdrawn: true } },
    );

    return res.status(201).json({
      message: "Withdrawal successful",
      amount: sanitizedBalance,
      stripeTransferId: transfer.id,
      withdrawalId: withdrawal._id,
    });
  } catch (err) {
    console.error("Withdrawal Core Processing error:", err);
    return res.status(500).json({ 
      message: "Failed to process withdrawal", 
      error: err.message 
    });
  }
};