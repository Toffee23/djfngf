import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Message Schema — Governs direct messaging logs, notification unread states, and receipts.
 */
const MessageSchema = new Schema(
  {
    sender: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true // Single field index to speed up outbound mail filtering
    },
    receiver: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true // Single field index to speed up unread badge/notification scans
    },
    content: { 
      type: String, 
      required: true,
      trim: true // Automatically sanitizes trailing whitespace and line escapes from chat boxes
    },
    isRead: { 
      type: Boolean, 
      default: false,
      index: true // Indexes the read flag to optimize fast notification counting queries
    },
    readAt: { 
      type: Date 
    },
    timestamp: { 
      type: Date, 
      default: Date.now,
      index: true // Allows fast chronological sorting for chat room windows
    },
  },
  { timestamps: true } // Automatically manages underlying metadata tracking attributes
);

// ── Compound Index Generation ──────────────────────────────────────
// This creates a fast compound scan path in memory for conversational streams ($or queries)
MessageSchema.index({ sender: 1, receiver: 1, timestamp: 1 });
MessageSchema.index({ receiver: 1, isRead: 1 });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);