import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Withdrawal — Tracks manual bank transfers, debit cards, and automated Stripe payouts.
 */
const WithdrawalSchema = new Schema(
  {
    producer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01, // Enforces that negative or zero-value transactions can never commit to disk
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "GBP"], // Aligns perfectly with our supported base payout metrics
      index: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true, // Speeds up admin approval feeds filtering for "pending" transactions
    },
    // Bank transfer details (stored only if method === 'bank_transfer')
    bankDetails: {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      accountName: { type: String, trim: true },
      routingNumber: { type: String, trim: true }, // for USD wire clearing
      sortCode: { type: String, trim: true },       // for GBP wire clearing
      iban: { type: String, trim: true },
    },
    stripeTransferId: { 
      type: String, 
      index: true, 
      sparse: true // Allows multiple null values for manual transfers while keeping unique/fast index reads for Stripe ids
    },
    method: {
      type: String,
      // Added "stripe_connect" to completely eliminate Mongoose model validation crashes during instant automated payouts
      enum: ["bank_transfer", "debit_card", "stripe_connect"],
      required: true,
      index: true,
    },
    // Debit card details (stored only if method === 'debit_card')
    cardDetails: {
      last4: { type: String, trim: true },
      cardNetwork: { type: String, trim: true }, // Visa, Mastercard, Verve, etc.
    },
    // Internal notes (admin use)
    adminNote: { 
      type: String, 
      trim: true 
    },
    processedAt: { 
      type: Date 
    },
  },
  { timestamps: true },
);

// ── Compound Indexes For Accounting Audits ───────────────────────
// Speeds up analytics operations checking a producer's chronological payout history
WithdrawalSchema.index({ producer: 1, createdAt: -1 });
WithdrawalSchema.index({ status: 1, method: 1 });

export const Withdrawal = 
  mongoose.models.Withdrawal || 
  mongoose.model("Withdrawal", WithdrawalSchema);