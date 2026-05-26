import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    defaultProfile: {
      fullname: String,
      age: Number,
      username: String,
      email: String,
    },
    defaultPasswordHash: {
      type: String,
      required: true,
    },

    isSubscribed: {
      type: Boolean,
      default: false,
    },
    subscriptionExpires: Date,

    subscriptionType: {
      type: String,
      enum: ["basic", "premium"],
      default: "basic",
    },
    stripeAccountId: { type: String },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    subscriptionStatus: {
      type: String,
      enum: [
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "trialing",
        "inactive",
      ],
      default: "inactive",
    },
    subscriptionPlan: {
      type: String,
      enum: ["basic", "premium", "producer"],
      default: "basic",
    },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },

    hasGameAccess: {
      type: Boolean,
      default: false,
    },

    profilePicture: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isProducer: {
      type: Boolean,
      default: false,
    },
    producerSince: {
      type: Date,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
