import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Withdrawal  one record per withdrawal request from a producer.
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
      required: true, // amount requested (in USD)
    },
    currency: {
      type: String,
      default: "USD",
    },
    country: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    // Bank transfer details (stored only if method === 'bank_transfer')
    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountName: { type: String },
      routingNumber: { type: String }, // for USD transfers
      sortCode: { type: String }, // for GBP transfers
      iban: { type: String },
    },
    stripeTransferId: { type: String },
    method: {
      type: String,
      enum: ["bank_transfer", "debit_card", "stripe_connect"],
      required: true,
    },
    // Debit card details (stored only if method === 'debit_card')
    cardDetails: {
      last4: { type: String },
      cardNetwork: { type: String }, // Visa, Mastercard …
    },
    // Internal notes (admin use)
    adminNote: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true },
);

export const Withdrawal = mongoose.model("Withdrawal", WithdrawalSchema);
