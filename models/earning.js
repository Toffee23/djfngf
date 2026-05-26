import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Earning — one record per movie view purchase.
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
      ref: "Movie",
      required: true,
    },
    viewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    grossAmount: {
      type: Number,
      required: true, // full amount the viewer paid (in USD)
    },
    platformFeePercent: {
      type: Number,
      default: 20, // platform takes 20%
    },
    netAmount: {
      type: Number,
      required: true, // grossAmount * (1 - platformFeePercent / 100)
    },
    currency: {
      type: String,
      default: "USD",
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

export const Earning =
  mongoose.models.Earning || mongoose.model("Earning", EarningSchema);
