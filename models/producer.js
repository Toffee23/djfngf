import mongoose from "mongoose";
const { Schema } = mongoose;

const ProducerSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
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
  },
  intendedProfit: {
    type: Number,
    required: true,
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
  },
});

export const Producer = mongoose.model("Producer", ProducerSchema);
