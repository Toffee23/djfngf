import express from "express";
import {
  getAllMovies,
  getMovieById,
  streamMovie,
  rateMovie,
  uploadMovie,
  getMyMovies,
  updateMovie,
  deleteMovie,
  approveMovie,
  rejectMovie,
  getRecentlyPlayed,
  getPremiers,
} from "../controllers/moviesController.js";
import {
  protect,
  requireProducer,
  requireAdmin,
  requireSubscription,
} from "../middleware/authMiddleware.js";
import { ownerOrAdminGuard, streamAccessGuard } from "../middleware/guard.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Movies
 * description: Core catalog curation, premium playback streaming, and producer asset managers.
 */

// ── public listings endpoints ──────────────────────────────────────

/**
 * @swagger
 * /api/movies:
 * get:
 * tags: [Movies]
 * summary: Get all movies
 * description: Retrieve paginated, approved public movie listings.
 */
router.get("/", getAllMovies);

/**
 * @swagger
 * /api/movies/premiers:
 * get:
 * tags: [Movies]
 * summary: Get upcoming platform premiers
 */
// FIXED: Moved ABOVE dynamic /:id parameter to completely block path hijacking bugs
router.get("/premiers", getPremiers);

/**
 * @swagger
 * /api/movies/producer/my-movies:
 * get:
 * tags: [Movies]
 * summary: Get all movies uploaded by the authenticated producer profile
 */
// FIXED: Kept safe above dynamic params block
router.get("/producer/my-movies", protect, requireProducer, getMyMovies);

/**
 * @swagger
 * /api/movies/premium/recently-played:
 * get:
 * tags: [Movies]
 * summary: Get user chronological watch history ledger logs
 */
// FIXED: Chained requireSubscription to enforce the premium access rules declared in Swagger contracts
router.get("/premium/recently-played", protect, requireSubscription, getRecentlyPlayed);

/**
 * @swagger
 * /api/movies/{id}:
 * get:
 * tags: [Movies]
 * summary: Get specific movie details metadata by object ID
 */
router.get("/:id", getMovieById);

// ── authenticated streaming & interaction endpoints ──────────────────

/**
 * @swagger
 * /api/movies/{id}/stream:
 * get:
 * tags: [Movies]
 * summary: Retrieve media stream playback signing urls
 */
// FIXED: Wrapped securely with streamAccessGuard to authorize video access permissions
router.get("/:id/stream", protect, streamAccessGuard, streamMovie);

/**
 * @swagger
 * /api/movies/{id}/rate:
 * post:
 * tags: [Movies]
 * summary: Submit a content review rating score
 */
router.post("/:id/rate", protect, rateMovie);

// ── creator asset management endpoints ──────────────────────────────

/**
 * @swagger
 * /api/movies:
 * post:
 * tags: [Movies]
 * summary: Upload a new movie asset structure (Producer only)
 */
router.post("/", protect, requireProducer, uploadMovie);

/**
 * @swagger
 * /api/movies/{id}:
 * put:
 * tags: [Movies]
 * summary: Update movie metadata configurations
 */
// FIXED: Added ownerOrAdminGuard to block producers from manipulating files uploaded by others
router.put("/:id", protect, requireProducer, ownerOrAdminGuard('id'), updateMovie);

/**
 * @swagger
 * /api/movies/{id}:
 * delete:
 * tags: [Movies]
 * summary: Purge a movie asset permanently from platform logs
 */
router.delete("/:id", protect, requireProducer, ownerOrAdminGuard('id'), deleteMovie);

// ── administrative moderation endpoints ──────────────────────────────

/**
 * @swagger
 * /api/movies/{id}/approve:
 * patch:
 * tags: [Movies]
 * summary: Approve a movie for general public streaming publication
 */
router.patch("/:id/approve", protect, requireAdmin, approveMovie);

/**
 * @swagger
 * /api/movies/{id}/reject:
 * patch:
 * tags: [Movies]
 * summary: Reject a movie submission and return it to draft state
 */
router.patch("/:id/reject", protect, requireAdmin, rejectMovie);

export default router;