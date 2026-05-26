import { v2 as cloudinary } from "cloudinary";

/**
 * Supported media spaces and their target Cloudinary configurations.
 */
const SLOT_CONFIG = {
  video: { folder: "flixora_movies/videos", resourceType: "video" },
  trailer: { folder: "flixora_movies/trailers", resourceType: "video" },
  posterImage: {
    folder: "flixora_movies/assets/posters",
    resourceType: "image",
  },
  backdropImage: {
    folder: "flixora_movies/assets/backdrops",
    resourceType: "image",
  },
  bts: { folder: "flixora_movies/assets/bts", resourceType: "video" },
  subtitle: { folder: "flixora_movies/subtitles", resourceType: "raw" },
  profilePicture: {
    folder: "flixora_users/profile_pictures",
    resourceType: "image",
  },
  default: { folder: "flixora_misc", resourceType: "image" },
};

/**
 * Generates a single secure cryptographic signature for secure direct-to-cloud browser uploads.
 * * @param {string} slot - Key name from SLOT_CONFIG.
 * @param {string} [folderOverride] - Optional direct path override string.
 * @returns {Object} Complete authorization context needed by frontend FormData pipelines.
 */
export const generateSignature = (slot, folderOverride) => {
  const config = SLOT_CONFIG[slot] ?? SLOT_CONFIG.default;
  const folder = folderOverride ?? config.folder;
  const resourceType = config.resourceType;

  // Use an explicit fallback string if environment keys are missing to prevent backend method crashes
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  if (!apiSecret) {
    console.error("❌ [Cloudinary Configuration Error] CLOUDINARY_API_SECRET is missing from your environment keys.");
  }

  const timestamp = Math.round(Date.now() / 1000);

  // Aligns parameters with client-side FormData payloads
  const paramsToSign = {
    timestamp,
    folder,
  };

  // Generates secure SHA signature string
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    slot,
    signature,
    timestamp,
    folder,
    resourceType,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
  };
};

/**
 * Compiles a signature payload ledger for a batch of upload slots in a single round-trip.
 * * @param {string[]} slots - Array of target slot identifier strings.
 * @returns {Object[]} Array of compiled signing authentication configurations.
 */
export const generateBatchSignatures = (slots) => {
  if (!slots || !Array.isArray(slots)) return [];
  return slots.map((slot) => generateSignature(slot));
};