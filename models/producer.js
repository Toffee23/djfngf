import mongoose from "mongoose";
const { Schema } = mongoose;

const ProducerSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User", // Must cleanly match the registered model name string inside models/User.js
      required: true,
      unique: true, // Rigid constraint: Protects data systems against duplicate producer mappings on a single user profile
      index: true,
    },
    productionName: {
      type: String,
      required: true,
      trim: true,
    },
    countryOfResidence: {
      type: String,
      required: true,
      trim: true,
    },
    prodCountry: {
      type: String,
      required: true,
      trim: true,
    },
    existingApplication: {
      type: String,
      required: true,
      trim: true,
    },
    campaignSource: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      required: true,
      trim: true,
    },
    prodDesc: {
      type: String,
      required: true,
      trim: true,
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    intendedProfit: {
      type: Number,
      required: true,
      min: 0,
    },
    promoteIntent: {
      type: String,
      required: true,
      trim: true,
    },
    whyUs: {
      type: String,
      required: true,
      trim: true,
    },
    others: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true, // Optimizes fast admin dashboard lookups for pending applications queue filtering
    },
  },
  { timestamps: true } // Added tracking timestamps to capture precise application submission dates
);

export const Producer = mongoose.models.Producer || mongoose.model("Producer", ProducerSchema);