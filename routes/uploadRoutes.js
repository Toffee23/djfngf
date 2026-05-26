import express from 'express';
import { getUploadSignatures } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/upload/signatures:
 *   post:
 *     summary: Get Cloudinary upload signatures
 *     description: |
 *       Returns presigned Cloudinary upload signatures for one or more file slots.
 *       Use these signatures to upload files **directly from the browser** to Cloudinary
 *       without routing the file through your backend server.
 *
 *       **Supported slots:**
 *       `video`, `trailer`, `posterImage`, `backdropImage`, `bts`, `subtitle`,
 *       `profilePicture`, `default`
 *
 *       **Frontend upload flow:**
 *       1. Call this endpoint to get a signature for the slot(s) you need.
 *       2. POST the file directly to:
 *          `https://api.cloudinary.com/v1_1/<cloudName>/<resourceType>/upload`
 *          with fields: `file`, `api_key`, `timestamp`, `signature`, `folder`.
 *       3. Save the returned Cloudinary URL in your own API (e.g. movie metadata, user profile).
 *     tags:
 *       - Uploads
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slots
 *             properties:
 *               slots:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum:
 *                     - video
 *                     - trailer
 *                     - posterImage
 *                     - backdropImage
 *                     - bts
 *                     - subtitle
 *                     - profilePicture
 *                     - default
 *                 example: ["posterImage", "video"]
 *     responses:
 *       200:
 *         description: Signatures generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 signatures:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       slot:
 *                         type: string
 *                         example: posterImage
 *                       signature:
 *                         type: string
 *                         example: abc123def456...
 *                       timestamp:
 *                         type: integer
 *                         example: 1716000000
 *                       folder:
 *                         type: string
 *                         example: flixora_movies/assets/posters
 *                       resourceType:
 *                         type: string
 *                         example: image
 *                       cloudName:
 *                         type: string
 *                         example: your_cloud_name
 *                       apiKey:
 *                         type: string
 *                         example: your_api_key
 *       400:
 *         description: Invalid or missing slots array
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to generate signatures
 */
router.post('/signatures', protect, getUploadSignatures);

export default router;
