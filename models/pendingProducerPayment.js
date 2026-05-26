import mongoose from "mongoose";
const { Schema } = mongoose;

const PendingProducerPaymentSchema = new Schema(
  {
    stripeSessionId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    fullName: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    status: {
      type: String,
      enum: ["paid", "form_submitted", "approved", "rejected"],
      default: "paid",
    },
    producerId: {
      type: Schema.Types.ObjectId,
      ref: "Producer",
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true },
);

export const PendingProducerPayment = mongoose.model(
  "PendingProducerPayment",
  PendingProducerPaymentSchema,
);
