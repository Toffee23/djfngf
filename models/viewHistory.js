import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * ViewHistory Schema — Tracks user interaction logs for premium watch history features.
 */
const ViewHistorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Optimizes individual account lookup sweeps and cascade account purges
    },
    movie: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    lastPlayedAt: {
      type: Date,
      default: Date.now,
      index: true, // Speeds up chronological sorting operations
    },
  },
  { timestamps: true },
);

// ── Compound Indexes For Premium Data Delivery ──────────────────
// Enforces single-instance logic per movie per account profile
ViewHistorySchema.index({ user: 1, movie: 1 }, { unique: true });

// Crucial Query Tuning: Optimizes the recent history feed by indexing the user and timestamp together
ViewHistorySchema.index({ user: 1, lastPlayedAt: -1 });

export const ViewHistory =
  mongoose.models.ViewHistory ||
  mongoose.model("ViewHistory", ViewHistorySchema);