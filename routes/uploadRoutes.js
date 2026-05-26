import express from 'express';
import { getUploadSignatures } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Storage Uploads
 * description: Presigned cryptographic keys for secure direct-to-cloud media hosting.
 */

/**
 * @swagger
 * /api/upload/signatures:
 * post:
 * summary: Request presigned Cloudinary upload configurations
 * description: |
 * Returns cryptographic validation signatures for one or more target storage spaces.
 * Enforces explicit account checking: Media slots (`video`, `trailer`, `bts`) strictly require a validated Producer account status.
 * tags: [Storage Uploads]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - slots
 * properties:
 * slots:
 * type: array
 * items:
 * type: string
 * enum: [video, trailer, posterImage, backdropImage, bts, subtitle, profilePicture, default]
 * example: ["profilePicture"]
 * responses:
 * 200:
 * description: Direct upload authorizations issued successfully.
 * 400:
 * description: Validation exception. Request body format invalid.
 * 403:
 * description: Forbidden. Insufficient account role privileges for the requested slots.
 */
router.post(
  '/signatures',
  protect,
  (req, res, next) => {
    const { slots } = req.body;

    // Structural Array Validation Guard
    if (!slots || !Array.isArray(slots)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request payload. 'slots' parameter must be a valid array.",
      });
    }

    // Role-Privilege Verification Guard
    // Identifies high-value media slots that should be restricted to validated Producers
    const restrictedMediaSlots = ["video", "trailer", "bts", "subtitle", "posterImage", "backdropImage"];
    const requestedRestrictedSlots = slots.filter(slot => restrictedMediaSlots.includes(slot));

    if (requestedRestrictedSlots.length > 0 && !req.user.isProducer && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: `Access Denied. Upload signatures for media slots (${requestedRestrictedSlots.join(', ')}) require an active Producer status tier.`,
      });
    }

    next();
  },
  getUploadSignatures
);

export default router;