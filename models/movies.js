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
    year: { type: Number, required: true },
    runtime: { type: Number, required: true }, // minutes
    language: { type: String, required: true },
    countryOfOrigin: { type: String, required: true },

    //  Classification
    genre: [{ type: String, required: true }],
    ageRating: {
      type: String,
      enum: ["G", "PG", "PG-13", "PG-16", "PG-18", "R", "NC-17"],
      required: true,
    },
    contentWarnings: [{ type: String }],

    //Media Assets
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

    //Crew & Cast
    producers: [{ type: String, required: true }],
    cast: [castSchema],
    productionCompany: { type: String, required: true },
    distributor: { type: String },

    //  Platform / Business Logic
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    termsAccepted: { type: Boolean, default: false },
    acceptedViewCountries: [{ type: String }],
    viewerInterests: [{ type: String }],
    premiering: { type: Boolean, default: false },
    premierDate: { type: Date },
    showingImmediately: { type: Boolean, default: false },
    price: { type: Number, required: true, min: 0, default: 2 },
    isPublished: { type: Boolean, default: false },
    approvedByAdmin: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }, // 0–10 average
  },
  { timestamps: true },
);

MovieSchema.methods.updateRating = async function (newRating) {
  this.totalRatings += newRating;
  this.ratingCount += 1;
  this.rating = parseFloat((this.totalRatings / this.ratingCount).toFixed(1));
  await this.save();
};

export const Movie = mongoose.model("Movie", MovieSchema);
