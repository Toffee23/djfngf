import { generateBatchSignatures } from '../utils/cloudinarySigner.js';

/**
 * POST /api/upload/signatures
 *
 * Universal presigned-signature endpoint for direct Cloudinary uploads.
 * Works for any upload type: profile pictures, movie videos, posters, etc.
 *
 * Request body:
 * {
 *   "slots": ["profilePicture"]                          // single
 *   "slots": ["video", "posterImage", "backdropImage"]  // batch
 * }
 *
 * Supported slot names (see cloudinarySigner.js for the full list):
 *   video | trailer | posterImage | backdropImage | bts | subtitle
 *   profilePicture | default
 *
 * Response:
 * {
 *   "signatures": [
 *     {
 *       "slot":         "posterImage",
 *       "signature":    "abc123...",
 *       "timestamp":    1716000000,
 *       "folder":       "flixora_movies/assets/posters",
 *       "resourceType": "image",
 *       "cloudName":    "your_cloud_name",
 *       "apiKey":       "your_api_key"
 *     }
 *   ]
 * }
 *
 * The frontend uses each payload to POST directly to:
 *   https://api.cloudinary.com/v1_1/<cloudName>/<resourceType>/upload
 * with the fields: file, api_key, timestamp, signature, folder.
 */
export const getUploadSignatures = (req, res) => {
  try {
    const { slots } = req.body;

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        message: '`slots` must be a non-empty array of slot names.',
        example: { slots: ['profilePicture'] },
      });
    }

    const MAX_SLOTS = 10;
    if (slots.length > MAX_SLOTS) {
      return res.status(400).json({
        message: `Maximum ${MAX_SLOTS} slots per request.`,
      });
    }

    const signatures = generateBatchSignatures(slots);
    return res.status(200).json({ signatures });
  } catch (err) {
    console.error('Signature generation error:', err);
    return res
      .status(500)
      .json({ message: 'Failed to generate signatures', error: err.message });
  }
};
