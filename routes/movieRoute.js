import express from "express";
const router = express.Router();
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
} from "../middleware/authMiddleware.js";

/**
 * @swagger
 * /api/movies:
 *   get:
 *     tags:
 *       - Movies
 *     summary: Get all movies
 *     description: Retrieve paginated movies.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Current page number
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *         description: Number of movies per page
 *
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre
 *
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by language
 *
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by release year
 *
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, rating, views]
 *         description: Sorting option
 *
 *     responses:
 *       200:
 *         description: Paginated movie list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 movies:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       genre:
 *                         type: array
 *                         items:
 *                           type: string
 *                       language:
 *                         type: string
 *                       year:
 *                         type: integer
 *                       rating:
 *                         type: number
 *                       views:
 *                         type: integer
 *
 *                 total:
 *                   type: integer
 *                   example: 120
 *
 *                 page:
 *                   type: integer
 *                   example: 1
 *
 *                 pages:
 *                   type: integer
 *                   example: 6
 */
router.get("/", getAllMovies);

/**
 * @swagger
 * /api/movies/premiers:
 *   get:
 *     tags:
 *       - Movies
 *     summary: Get upcoming premiers
 *     description: Retrieve a list of upcoming movie premiers.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *         description: Maximum number of premiers to return
 *     responses:
 *       200:
 *         description: A list of upcoming premiers
 *       500:
 *         description: Failed to fetch premiers
 */
router.get("/premiers", getPremiers);

/**
 * @swagger
 * /api/movies/{id}:
 *   get:
 *     tags:
 *       - Movies
 *     summary: Get a movie by ID
 *     description: Retrieve a movie by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A movie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The movie ID
 *                 title:
 *                   type: string
 *                   description: The movie title
 *                 genre:
 *                   type: string
 *                   description: The movie genre
 *                 language:
 *                   type: string
 *                   description: The movie language
 *                 year:
 *                   type: integer
 *                   description: The movie year
 *                 isPublished:
 *                   type: boolean
 *                   description: Whether the movie is published
 *                 approvedByAdmin:
 *                   type: boolean
 *                   description: Whether the movie is approved by the admin
 *                 rating:
 *                   type: number
 *                   description: The movie rating
 *
 */
router.get("/:id", getMovieById);

//  Authenticated users
/**
 * @swagger
 * /api/movies/{id}/stream:
 *   get:
 *     tags:
 *       - Movies
 *     summary: Stream a movie
 *     description: Stream a movie by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A movie stream
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 streamUrl:
 *                   type: string
 *                   description: The URL of the movie stream
 *                 subtitles:
 *                   type: string
 *                   description: The movie subtitles
 *                 audioTracks:
 *                   type: string
 *                   description: The movie audio tracks
 *                 resolution:
 *                   type: string
 *                   description: The movie resolution
 *
 *
 *
 */
router.get("/:id/stream", protect, streamMovie);

/**
 * @swagger
 * /api/movies/{id}/rate:
 *   post:
 *     tags:
 *       - Movies
 *     summary: Rate a movie
 *     description: Rate a movie by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 description: The rating of the movie
 *     responses:
 *       200:
 *         description: The rating was submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The rating was submitted
 *                 newRating:
 *                   type: number
 *                   description: The new rating of the movie
 */
router.post("/:id/rate", protect, rateMovie);

//  Producers
/**
 * @swagger
 * /api/movies:
 *   post:
 *     tags:
 *       - Movies
 *     summary: Upload a movie
 *     description: Upload a new movie (Producer only)
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - title
 *               - synopsis
 *               - releaseDate
 *               - year
 *               - runtime
 *               - language
 *               - countryOfOrigin
 *               - genre
 *               - ageRating
 *               - posterImage
 *               - streamUrl
 *               - resolution
 *               - producers
 *               - productionCompany
 *               - price
 *
 *             properties:
 *               title:
 *                 type: string
 *                 example: Blood Sisters
 *
 *               originalTitle:
 *                 type: string
 *                 example: Blood Sisters Original
 *
 *               synopsis:
 *                 type: string
 *                 example: Two best friends become entangled in a dangerous crime.
 *
 *               tagline:
 *                 type: string
 *                 example: Trust no one.
 *
 *               releaseDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-01
 *
 *               year:
 *                 type: integer
 *                 example: 2025
 *
 *               runtime:
 *                 type: integer
 *                 description: Runtime in minutes
 *                 example: 120
 *
 *               language:
 *                 type: string
 *                 example: English
 *
 *               countryOfOrigin:
 *                 type: string
 *                 example: Nigeria
 *
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - Action
 *                   - Drama
 *
 *               ageRating:
 *                 type: string
 *                 enum:
 *                   - G
 *                   - PG
 *                   - PG-13
 *                   - PG-16
 *                   - PG-18
 *                   - R
 *                   - NC-17
 *                 example: PG-18
 *
 *               contentWarnings:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - Violence
 *                   - Strong language
 *
 *               posterImage:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/poster.jpg
 *
 *               backdropImage:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/backdrop.jpg
 *
 *               trailerUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://youtube.com/trailer
 *
 *               streamUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://cdn.example.com/movie.mp4
 *
 *               btsUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://cdn.example.com/bts.mp4
 *
 *               subtitles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - language
 *                     - url
 *                   properties:
 *                     language:
 *                       type: string
 *                       example: English
 *
 *                     url:
 *                       type: string
 *                       format: uri
 *                       example: https://example.com/sub-en.vtt
 *
 *               audioTracks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - language
 *                   properties:
 *                     language:
 *                       type: string
 *                       example: English
 *
 *                     type:
 *                       type: string
 *                       enum:
 *                         - stereo
 *                         - 5.1
 *                         - atmos
 *                       example: stereo
 *
 *               resolution:
 *                 type: string
 *                 enum:
 *                   - SD
 *                   - HD
 *                   - FHD
 *                   - 4K
 *                 example: FHD
 *
 *               producers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - John Doe
 *                   - Jane Doe
 *
 *               cast:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Actor One
 *
 *                     character:
 *                       type: string
 *                       example: Detective Williams
 *
 *                     order:
 *                       type: integer
 *                       example: 1
 *
 *               productionCompany:
 *                 type: string
 *                 example: Prime Studios
 *
 *               distributor:
 *                 type: string
 *                 example: Netflix
 *
 *               premiering:
 *                 type: boolean
 *                 example: true
 *
 *               premierDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-12-25
 *
 *               showingImmediately:
 *                 type: boolean
 *                 example: false
 *
 *               acceptedViewCountries:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - Nigeria
 *                   - Ghana
 *
 *               viewerInterests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - Action
 *                   - Thriller
 *
 *               termsAccepted:
 *                 type: boolean
 *                 example: true
 *
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 15
 *
 *     responses:
 *       201:
 *         description: Movie uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Movie uploaded. Awaiting admin approval.
 *
 *                 movie:
 *                   type: object
 *
 *       400:
 *         description: Validation error
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Producer account required
 *
 *       500:
 *         description: Failed to upload movie
 */
router.post("/", protect, requireProducer, uploadMovie);
/**
 * @swagger
 * /api/movies/producer/my-movies:
 *   get:
 *     tags:
 *       - Movies
 *     summary: Get my movies
 *     description: Get all movies uploaded by the producer.
 *     responses:
 *       200:
 *         description: A list of movies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 movies:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: The movie ID
 *                       title:
 *                         type: string
 *                         description: The movie title
 *                       uploadedBy:
 *                         type: string
 *                         description: The producer ID who uploaded the movie
 *                       premiering:
 *                         type: boolean
 *                         description: Whether the movie is premiering
 *                       premierDate:
 *                         type: string
 *                         description: The premier date of the movie
 *                       showingImmediately:
 *                         type: boolean
 *                         description: Whether the movie is showing immediately
 *                       producers:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: The producers of the movie
 *                       termsAccepted:
 *                         type: boolean
 *                         description: Whether the movie terms have been accepted
 *                       acceptedViewCountries:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: The countries where the movie can be viewed
 *                       viewerInterests:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: The viewer interests of the movie
 *                       countryOfOrigin:
 *                         type: string
 *                         description: The country of origin of the movie
 *                       genre:
 *                         type: string
 *                         description: The genre of the movie
 *                       ageRating:
 *                         type: string
 *                         description: The age rating of the movie
 *
 *
 */
router.get("/producer/my-movies", protect, requireProducer, getMyMovies);

// Admin
/**
 * @swagger
 * /api/movies/premium/recently-played:
 *   get:
 *     tags:
 *       - Movies
 *     summary: Get premium user's recently played movies
 *     description: Retrieve the viewing history of a premium user. Requires an active premium subscription.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *         description: Maximum number of history items to return
 *     responses:
 *       200:
 *         description: A list of recently played movies
 *       401:
 *         description: Unauthorized. Invalid token.
 *       403:
 *         description: Access denied. Subscription premium required.
 */
router.get("/premium/recently-played", protect, getRecentlyPlayed);

/**
 * @swagger
 * /api/movies/{id}:
 *   put:
 *     tags:
 *       - Movies
 *     summary: Update a movie
 *     description: Update a movie by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *
 */
router.put("/:id", protect, requireProducer, updateMovie);
/**
 * @swagger
 * /api/movies/{id}:
 *   delete:
 *     tags:
 *       - Movies
 *     summary: Delete a movie
 *     description: Delete a movie by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete("/:id", protect, requireProducer, deleteMovie);

// Admin
/**
 * @swagger
 * /api/movies/{id}/approve:
 *   patch:
 *     tags:
 *       - Movies
 *     summary: Approve a movie
 *     description: Approve a movie by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch("/:id/approve", protect, requireAdmin, approveMovie);
/**
 * @swagger
 * /api/movies/{id}/reject:
 *   patch:
 *     tags:
 *       - Movies
 *     summary: Reject a movie
 *     description: Reject a movie by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch("/:id/reject", protect, requireAdmin, rejectMovie);

export default router;
