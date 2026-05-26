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
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
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
      index: true,
    },
    subscriptionExpires: { 
      type: Date,
      index: true
    },

    subscriptionType: {
      type: String,
      enum: ["basic", "premium", "producer"], // Added producer to eliminate role conflicts across controllers
      default: "basic",
      index: true,
    },
    stripeAccountId: { type: String, index: true },
    stripeCustomerId: { type: String, index: true },
    stripeSubscriptionId: { type: String, index: true },
    subscriptionStatus: {
      type: String,
      // Expanded enum array options to accept all possible native Stripe event response statuses safely
      enum: [
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "incomplete",
        "incomplete_expired",
        "trialing",
        "paused",
        "inactive",
      ],
      default: "inactive",
      index: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ["basic", "premium", "producer"],
      default: "basic",
      index: true,
    },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },

    hasGameAccess: {
      type: Boolean,
      default: false,
    },

    profilePicture: {
      type: String,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    isProducer: {
      type: Boolean,
      default: false,
      index: true,
    },
    producerSince: {
      type: Date,
    },
  },
  { timestamps: true },
);

// ── Lifecycle Hook Mirror Synchronization ────────────────────────
// Pre-save validation engine interceptor that forces subscriptionType and subscriptionPlan 
// to mirror each other automatically. This prevents gating bugs between auth middleware maps.
UserSchema.pre("save", function (next) {
  if (this.isModified("subscriptionPlan")) {
    this.subscriptionType = this.subscriptionPlan;
  } else if (this.isModified("subscriptionType")) {
    this.subscriptionPlan = this.subscriptionType;
  }
  next();
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);