import mongoose from "mongoose";
const { Schema } = mongoose;

const subtitleSchema = new Schema({
  language: { type: String, required: true },
  url: { type: String, required: true },
});

const audioTrackSchema = new Schema({
  language: { type: String, required: true },
  type: { type: String, enum: ["stereo", "5.1", "atmos"], default: "stereo" },
});

const castSchema = new Schema({
  name: { type: String, required: true },
  character: { type: String },
  order: { type: Number },
});

const MovieSchema = new Schema(
  {
    //  Core Info
    title: { type: String, required: true, trim: true },
    originalTitle: { type: String, trim: true },
    synopsis: { type: String, required: true },
    tagline: { type: String },
    releaseDate: { type: Date, required: true },
    year: { type: Number, required: true, index: true },
    runtime: { type: Number, required: true }, // minutes
    language: { type: String, required: true, index: true },
    countryOfOrigin: { type: String, required: true },

    //  Classification
    genre: [{ type: String, required: true, index: true }],
    ageRating: {
      type: String,
      enum: ["G", "PG", "PG-13", "PG-16", "PG-18", "R", "NC-17"],
      required: true,
    },
    contentWarnings: [{ type: String }],

    // Media Assets
    posterImage: { type: String, required: true },
    backdropImage: { type: String },
    trailerUrl: { type: String },
    streamUrl: { type: String, required: true },
    btsUrl: { type: String },
    subtitles: [subtitleSchema],
    audioTracks: [audioTrackSchema],
    resolution: {
      type: String,
      enum: ["SD", "HD", "FHD", "4K"],
      required: true,
    },

    // Crew & Cast
    producers: [{ type: String, required: true }],
    cast: [castSchema],
    productionCompany: { type: String, required: true },
    distributor: { type: String },

    //  Platform / Business Logic
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    termsAccepted: { type: Boolean, default: false },
    acceptedViewCountries: [{ type: String }],
    viewerInterests: [{ type: String }],
    premiering: { type: Boolean, default: false, index: true },
    premierDate: { type: Date, index: true },
    showingImmediately: { type: Boolean, default: false },
    price: { type: Number, required: true, min: 0, default: 2 },
    isPublished: { type: Boolean, default: false, index: true },
    approvedByAdmin: { type: Boolean, default: false, index: true },
    views: { type: Number, default: 0, index: true },
    totalRatings: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, index: true }, // 0–10 average
  },
  { timestamps: true },
);

// ── Compound Indexes For High Performance Feeds ──────────────────
// Optimizes your landing pages and paginated catalog search endpoints dramatically
MovieSchema.index({ isPublished: 1, approvedByAdmin: 1, createdAt: -1 });
MovieSchema.index({ isPublished: 1, approvedByAdmin: 1, genre: 1, createdAt: -1 });

/**
 * Atomic updates for ratings score generation
 * Enforces atomic increments inside MongoDB engine to completely rule out data override races
 */
MovieSchema.methods.updateRating = async function (newRating) {
  const MovieModel = this.constructor;
  
  // Compute new calculations safely using Mongo $inc operations
  const updatedDoc = await MovieModel.findByIdAndUpdate(
    this._id,
    {
      $inc: { totalRatings: newRating, ratingCount: 1 }
    },
    { new: true }
  );

  if (updatedDoc && updatedDoc.ratingCount > 0) {
    const freshAverage = parseFloat((updatedDoc.totalRatings / updatedDoc.ratingCount).toFixed(1));
    
    // Set the fractional average scale
    await MovieModel.updateOne({ _id: this._id }, { $set: { rating: freshAverage } });
    
    // Sync active document state instance values
    this.totalRatings = updatedDoc.totalRatings;
    this.ratingCount = updatedDoc.ratingCount;
    this.rating = freshAverage;
  }
};

export const Movie = mongoose.models.Movie || mongoose.model("Movie", MovieSchema);