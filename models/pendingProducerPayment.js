import mongoose from "mongoose";
const { Schema } = mongoose;

const PendingProducerPaymentSchema = new Schema(
  {
    stripeSessionId: { 
      type: String, 
      required: true, 
      unique: true,
      index: true 
    },
    email: { 
      type: String, 
      required: true,
      trim: true,
      index: true
    },
    fullName: { 
      type: String, 
      required: true,
      trim: true 
    },
    amountPaid: { 
      type: Number, 
      required: true,
      default: 0
    },
    status: {
      type: String,
      // Added "pending" to fix the fatal controller enum validation conflict crash
      enum: ["pending", "paid", "form_submitted", "approved", "rejected"],
      default: "pending",
      index: true
    },
    producerId: {
      type: Schema.Types.ObjectId,
      ref: "Producer",
      default: null,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: true // Required for the TTL engine down below
    },
  },
  { timestamps: true },
);

// ── Automated TTL Database Cleanup Engine ───────────────────────
// Tells MongoDB to automatically drop this document from the disk exactly at the expiresAt date 
// if it remains abandoned or incomplete, keeping your production database clean.
PendingProducerPaymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingProducerPayment = 
  mongoose.models.PendingProducerPayment || 
  mongoose.model("PendingProducerPayment", PendingProducerPaymentSchema);