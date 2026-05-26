import { Movie } from "../models/movies.js";
import { MovieAccess } from "../models/movieAccess.js";
import { User } from "../models/User.js";
import paginate from "../utils/paginate.js";
import { Producer } from "../models/producer.js";
import { ViewHistory } from "../models/viewHistory.js";

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// GET /api/movies
export const getAllMovies = async (req, res) => {
  try {
    const {
      genre,
      language,
      year,
      sort = "newest",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {
      isPublished: true,
      approvedByAdmin: true,
    };

    if (genre) filter.genre = { $in: [genre] };
    if (language) filter.language = language;
    if (year) filter.year = Number(year);

    const sortMap = {
      newest: { createdAt: -1 },
      rating: { rating: -1 },
      views: { views: -1 },
    };

    const result = await paginate({
      model: Movie,
      filter,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      sort: sortMap[sort] || { createdAt: -1 },
      select: "-streamUrl",
      populate: {
        path: "uploadedBy",
        select: "fullname username",
      },
    });

    return res.json(result);
  } catch (err) {
    console.error("Get All Movies Error:", err);
    return res.status(500).json({
      message: "Failed to fetch movies",
      error: err.message,
    });
  }
};

// GET /api/movies/:id
export const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .select("-streamUrl")
      .populate("uploadedBy", "fullname username");

    if (!movie || !movie.isPublished || !movie.approvedByAdmin) {
      return res.status(404).json({ message: "Movie not found" });
    }

    return res.json({ movie });
  } catch (err) {
    console.error("Get Movie By ID Error:", err);
    return res.status(500).json({ message: "Failed to fetch movie", error: err.message });
  }
};

// GET /api/movies/:id/stream
export const streamMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie || !movie.isPublished || !movie.approvedByAdmin) {
      return res.status(404).json({ message: "Movie not found" });
    }

    let access = null;

    if (req.user?.id) {
      access = await MovieAccess.findOne({
        user: req.user.id,
        movie: movie._id,
      });
    } else {
      const { session_id } = req.query;
      if (session_id) {
        access = await MovieAccess.findOne({
          stripeSessionId: session_id,
          movie: movie._id,
        });
      }
    }

    if (!access) {
      return res.status(403).json({
        message: "Purchase required. Pay to unlock streaming access for this movie.",
        price: movie.price,
      });
    }

    movie.views = (movie.views || 0) + 1;
    await movie.save();

    if (req.user?.id && req.user?.isSubscribed) {
      await ViewHistory.findOneAndUpdate(
        { user: req.user.id, movie: movie._id },
        { lastPlayedAt: new Date() },
        { upsert: true, new: true },
      );
    }

    return res.json({
      message: "Stream access granted",
      streamUrl: movie.streamUrl,
      subtitles: movie.subtitles || [],
      audioTracks: movie.audioTracks || [],
      resolution: movie.resolution || "1080p",
    });
  } catch (err) {
    console.error("Stream Movie System Error:", err);
    return res.status(500).json({ message: "Failed to get stream", error: err.message });
  }
};

// POST /api/movies/:id/rate
export const rateMovie = async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 10) {
      return res.status(400).json({ message: "Rating must be between 1 and 10" });
    }

    const access = await MovieAccess.findOne({
      user: req.user.id,
      movie: req.params.id,
    });
    
    if (!access) {
      return res.status(403).json({ message: "You must purchase the movie before rating it" });
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    await movie.updateRating(Number(rating));
    return res.json({ message: "Rating submitted", newRating: movie.rating });
  } catch (err) {
    console.error("Rate Movie Error:", err);
    return res.status(500).json({ message: "Failed to rate movie", error: err.message });
  }
};

// ==========================================
// PRODUCER ENDPOINTS
// ==========================================

// POST /api/movies/upload
export const uploadMovie = async (req, res) => {
  try {
    // Encapsulated safe inside the core try block to shield against open query crashes
    const verifiedProducer = await Producer.findOne({
      user: req.user.id,
      isVerified: true,
    });
    
    if (!verifiedProducer) {
      return res.status(403).json({
        message: "Producer account required. Complete onboarding or await administration verification status approval.",
      });
    }

    const movieData = {
      ...req.body,
      uploadedBy: req.user.id,
      isPublished: false,
      approvedByAdmin: false, // Default safety layer override
      views: 0,
      rating: 0,
    };

    if (req.body.showingImmediately === true) {
      movieData.showingImmediately = true;
      movieData.approvedByAdmin = true;
      movieData.isPublished = true;
    }

    const movie = await Movie.create(movieData);
    return res.status(201).json({
      message: "Movie metadata saved successfully.",
      movie,
    });
  } catch (err) {
    console.error("Upload Movie Core Error:", err);
    return res.status(500).json({ message: "Failed to finalize movie upload", error: err.message });
  }
};

// GET /api/movies/my-movies
export const getMyMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ uploadedBy: req.user.id }).sort({ createdAt: -1 });
    return res.json({ movies });
  } catch (err) {
    console.error("Get My Movies Error:", err);
    return res.status(500).json({ message: "Failed to fetch your movies", error: err.message });
  }
};

// PUT /api/movies/:id
export const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    const isOwner = movie.uploadedBy.toString() === req.user.id.toString();
    const isAdmin = req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to edit this movie" });
    }

    // Isolate updating body variables to prevent parameter escalation hacks
    const updates = { ...req.body };
    delete updates.uploadedBy;
    delete updates.views;
    delete updates.rating;

    if (isOwner && !isAdmin) {
      updates.approvedByAdmin = false;
      updates.isPublished = false;
    }

    const updated = await Movie.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    return res.json({ message: "Movie updated successfully", movie: updated });
  } catch (err) {
    console.error("Update Movie Error:", err);
    return res.status(500).json({ message: "Failed to update movie", error: err.message });
  }
};

// DELETE /api/movies/:id
export const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    const isOwner = movie.uploadedBy.toString() === req.user.id.toString();
    const isAdmin = req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this movie" });
    }

    await Movie.findByIdAndDelete(req.params.id);
    return res.json({ message: "Movie deleted successfully" });
  } catch (err) {
    console.error("Delete Movie Error:", err);
    return res.status(500).json({ message: "Failed to delete movie", error: err.message });
  }
};

// GET /api/movies/premiers
export const getPremiers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const now = new Date();

    const filter = {
      isPublished: true,
      approvedByAdmin: true,
      premiering: true,
      premierDate: { $gte: now },
    };

    const result = await paginate({
      model: Movie,
      filter,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      sort: { premierDate: 1 },
      select: "-streamUrl",
      populate: {
        path: "uploadedBy",
        select: "fullname username",
      },
    });

    return res.json(result);
  } catch (err) {
    console.error("Get Premiers Error:", err);
    return res.status(500).json({ message: "Failed to fetch premiers", error: err.message });
  }
};

// GET /api/movies/premium/recently-played
export const getRecentlyPlayed = async (req, res) => {
  try {
    if (!req.user.isSubscribed) {
      return res.status(403).json({
        message: "Access denied. Recently played history is a premium subscription feature.",
      });
    }

    const { limit = 10 } = req.query;

    const history = await ViewHistory.find({ user: req.user.id })
      .sort({ lastPlayedAt: -1 })
      .limit(Number(limit))
      .populate({
        path: "movie",
        select: "-streamUrl",
        populate: {
          path: "uploadedBy",
          select: "fullname username",
        },
      });

    const recentlyPlayed = history.map((item) => ({
      movie: item.movie,
      lastPlayedAt: item.lastPlayedAt,
    }));

    return res.json({ recentlyPlayed });
  } catch (err) {
    console.error("Get Recently Played Error:", err);
    return res.status(500).json({ message: "Failed to fetch recently played movies", error: err.message });
  }
};

// ==========================================
// ADMINISTRATIVE ENDPOINTS
// ==========================================

// PATCH /api/movies/:id/approve
export const approveMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { approvedByAdmin: true, isPublished: true },
      { new: true },
    );
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    return res.json({ message: "Movie approved and published successfully", movie });
  } catch (err) {
    console.error("Approve Movie Error:", err);
    return res.status(500).json({ message: "Failed to approve movie", error: err.message });
  }
};

// PATCH /api/movies/:id/reject
export const rejectMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { approvedByAdmin: false, isPublished: false },
      { new: true },
    );
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    return res.json({ message: "Movie rejected and unpublished successfully", movie });
  } catch (err) {
    console.error("Reject Movie Error:", err);
    return res.status(500).json({ message: "Failed to reject movie", error: err.message });
  }
};