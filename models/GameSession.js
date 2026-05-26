import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * GameSession Schema — Governs arcade tile selections and token payouts.
 */
const GameSessionSchema = new Schema(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      unique: true, // Crucial index constraint: Enforces exactly one active game session per user profile
      index: true 
    },
    goldenTileIndex: { 
      type: Number, 
      required: true // Valid target choice parameter bounds (0 to 31)
    },
    slotsLeft: { 
      type: Number, 
      default: 3 
    },
    balance: { 
      type: Number, 
      default: 0 
    },
    hasChosenThisRound: { 
      type: Boolean, 
      default: false 
    },
    gameStartTime: { 
      type: Date, 
      default: Date.now,
      expires: 3600 // Automated Database Cleanup: Deletes abandoned session sheets automatically after 1 hour
    }
  },
  { timestamps: true }
);

// Gracefully export using standard ES Modules fallback patterns to prevent registration crashes
export default mongoose.models.GameSession || mongoose.model("GameSession", GameSessionSchema);