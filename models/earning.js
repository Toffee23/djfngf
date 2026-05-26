import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Earning — Tracks single movie purchase distributions and platform fee allocations.
 */
const EarningSchema = new Schema(
  {
    producer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    movie: {
      type: Schema.Types.ObjectId,
      ref: "Movie", // Ensure this case match maps perfectly to mongoose.model("Movie", ...) inside models/movies.js
      required: true,
    },
    viewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    grossAmount: {
      type: Number,
      required: true, // Full fractional value amount viewer processed
    },
    platformFeePercent: {
      type: Number,
      default: 20, // Platform default commissions slice allocation
    },
    netAmount: {
      type: Number,
      required: true,
      default: 0, // Automatically evaluated dynamically via our pre-save document hook lifecycle below
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "GBP"], // Restricts entries to explicitly supported currencies
    },
    stripeSessionId: {
      type: String,
    },
    withdrawn: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

/**
 * Mongoose Pre-Save Lifecycle Middleware Hook
 * Automatically runs right before saving a document instance to prevent manual calculation drifts.
 */
EarningSchema.pre("validate", function (next) {
  if (this.grossAmount !== undefined) {
    const rawNet = this.grossAmount * (1 - (this.platformFeePercent || 20) / 100);
    // Force strict 2-decimal point currency precision limits to eliminate floating point inflation bugs
    this.netAmount = parseFloat(rawNet.toFixed(2));
  }
  next();
});

export const Earning = mongoose.models.Earning || mongoose.model("Earning", EarningSchema);