// models/movieAccess.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const MovieAccessSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true, // Speeds up queries searching for a specific user's purchased video library
    },

    movie: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
      index: true,
    },

    guestEmail: {
      type: String,
      trim: true,
      default: null,
      index: true, // Optimizes guest checkout tracing configurations
    },

    paidAmount: {
      type: Number,
      required: true,
    },

    stripeSessionId: {
      type: String,
      required: true,
      unique: true, // Rigid data constraint: Blocks duplicated ledger entries for a single checkout hook
      index: true,
    },

    grantedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// ── Compound Indexes For Streaming Optimization ──────────────────
// This creates an incredibly fast lookup path for checking streaming rights during movie access verification
MovieAccessSchema.index({ user: 1, movie: 1 });
MovieAccessSchema.index({ stripeSessionId: 1, movie: 1 });

export const MovieAccess =
  mongoose.models.MovieAccess ||
  mongoose.model("MovieAccess", MovieAccessSchema);