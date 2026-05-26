import { v2 as cloudinary } from "cloudinary";

/**
 * Supported slot names and their Cloudinary config.
 *
 * Add new slots here whenever you need a new upload category.
 * Each slot maps to:
 *   - folder      : Cloudinary folder path
 *   - resourceType: "image" | "video" | "raw"
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
 * Generate a single Cloudinary upload signature.
 *
 * @param {string} slot        - One of the keys in SLOT_CONFIG (or any custom string).
 * @param {string} [folderOverride] - Optional: override the folder for this slot.
 * @returns {object} Signature payload the frontend needs to upload directly.
 */
// export const generateSignature = (slot, folderOverride) => {
//   const config = SLOT_CONFIG[slot] ?? SLOT_CONFIG.default;
//   const folder = folderOverride ?? config.folder;
//   const resourceType = config.resourceType;

//   const timestamp = Math.round(Date.now() / 1000);

//   const paramsToSign = { timestamp, folder, resource_type: resourceType };

//   const signature = cloudinary.utils.api_sign_request(
//     paramsToSign,
//     process.env.CLOUDINARY_API_SECRET,
//   );

//   return {
//     slot,
//     signature,
//     timestamp,
//     folder,
//     resourceType,
//     cloudName: process.env.CLOUDINARY_CLOUD_NAME,
//     apiKey: process.env.CLOUDINARY_API_KEY,
//   };
// };
export const generateSignature = (slot, folderOverride) => {
  const config = SLOT_CONFIG[slot] ?? SLOT_CONFIG.default;
  const folder = folderOverride ?? config.folder;
  const resourceType = config.resourceType;

  const timestamp = Math.round(Date.now() / 1000);

  // FIX: ONLY sign parameters that the frontend passes inside FormData payloads.
  // Do not include resource_type here.
  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET,
  );

  return {
    slot,
    signature,
    timestamp,
    folder,
    resourceType,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  };
};

/**
 * Generate signatures for multiple slots in one call.
 *
 * @param {string[]} slots - Array of slot names.
 * @returns {object[]} Array of signature payloads.
 */
export const generateBatchSignatures = (slots) =>
  slots.map((slot) => generateSignature(slot));
