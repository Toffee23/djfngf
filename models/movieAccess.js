// models/movieAccess.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const MovieAccessSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    }, // <- missing closing brace was here

    movie: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },

    guestEmail: {
      type: String,
      trim: true,
      default: null,
    },

    paidAmount: {
      type: Number,
      required: true,
    },

    stripeSessionId: {
      type: String,
      required: true,
      unique: true,
    },

    grantedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export const MovieAccess =
  mongoose.models.MovieAccess ||
  mongoose.model("MovieAccess", MovieAccessSchema);
