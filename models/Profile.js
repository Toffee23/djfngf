import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * ExtraProfile Schema — Governs secondary user profiles for multi-device streaming setups.
 */
const ExtraProfileSchema = new Schema(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true,
      index: true // Speeds up lookups on profile switcher interfaces dramatically
    },
    nickname: { 
      type: String, 
      required: true,
      trim: true
    },
  },
  { timestamps: true } // Captures account modification windows automatically
);

// Enforce compound identifier security: Blocks creation of matching duplicate sub-profiles on a single account
ExtraProfileSchema.index({ user: 1, nickname: 1 }, { unique: true });

// Export with absolute consistency, checking for pre-compiled instances to stop hot-reload server crashes
export const Profile = mongoose.models.ExtraProfile || mongoose.model('ExtraProfile', ExtraProfileSchema);