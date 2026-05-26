import { generateBatchSignatures } from '../utils/cloudinarySigner.js';

// Define a strict whitelist of supported upload slot locations 
// to prevent parameter injection and storage folder contamination
const ALLOWED_SLOTS = [
  'video', 
  'trailer', 
  'posterImage', 
  'backdropImage', 
  'bts', 
  'subtitle', 
  'profilePicture', 
  'default'
];

/**
 * POST /api/upload/signatures
 * Universal presigned-signature endpoint for direct, secure client-side Cloudinary uploads.
 */
export const getUploadSignatures = (req, res) => {
  try {
    const { slots } = req.body;

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        message: '`slots` parameter must be a non-empty array of valid slot names.',
        example: { slots: ['profilePicture'] },
      });
    }

    const MAX_SLOTS = 10;
    if (slots.length > MAX_SLOTS) {
      return res.status(400).json({
        message: `Request validation failed. Maximum allocation boundary is ${MAX_SLOTS} slots per batch.`,
      });
    }

    // Validate each slot entry explicitly against our structural whitelist
    const invalidSlots = slots.filter(slot => !ALLOWED_SLOTS.includes(slot));
    if (invalidSlots.length > 0) {
      return res.status(400).json({
        message: 'Signature generation rejected. Contains unmapped or unauthorized slot designations.',
        invalidSlots,
        allowedSlots: ALLOWED_SLOTS
      });
    }

    // Generate signatures using the underlying Cloudinary utilities engine
    const signatures = generateBatchSignatures(slots);
    
    return res.status(200).json({ signatures });
  } catch (err) {
    console.error('Signature Batch Generation Core Error:', err);
    return res.status(500).json({ 
      message: 'Failed to generate presigned upload signatures internally.', 
      error: err.message 
    });
  }
};