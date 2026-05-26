import mongoose from "mongoose";

const { Schema } = mongoose;

const ViewHistorySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    movie: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    lastPlayedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

ViewHistorySchema.index({ user: 1, movie: 1 }, { unique: true });

export const ViewHistory =
  mongoose.models.ViewHistory ||
  mongoose.model("ViewHistory", ViewHistorySchema);
