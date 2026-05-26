import { Movie } from "../models/movies.js";
import { MovieAccess } from "../models/movieAccess.js";
import { User } from "../models/User.js";
import paginate from "../utils/paginate.js";
import { Producer } from "../models/producer.js";
import { ViewHistory } from "../models/viewHistory.js";

//  PUBLIC

// GET /api/movies  — browse all published & approved movies
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
      page,
      limit,
      sort: sortMap[sort] || { createdAt: -1 },
      select: "-streamUrl",
      populate: {
        path: "uploadedBy",
        select: "fullname username",
      },
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch movies",
      error: err.message,
    });
  }
};
// GET /api/movies/:id  — single movie detail (no streamUrl unless purchased)
export const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .select("-streamUrl")
      .populate("uploadedBy", "fullname username");

    if (!movie || !movie.isPublished || !movie.approvedByAdmin) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json({ movie });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch movie", error: err.message });
  }
};

// GET /api/movies/:id/stream  — protected; only if user has paid
// export const streamMovie = async (req, res) => {
//   try {
//     const movie = await Movie.findById(req.params.id);
//     if (!movie || !movie.isPublished || !movie.approvedByAdmin) {
//       return res.status(404).json({ message: "Movie not found" });
//     }

//     const access = await MovieAccess.findOne({
//       user: req.user.id,
//       movie: movie._id,
//     });

//     if (!access) {
//       return res.status(403).json({
//         message: "Purchase required. Pay to unlock this movie.",
//         price: movie.price,
//       });
//     }

//     // Increment view count
//     movie.views += 1;
//     await movie.save();

//     res.json({
//       message: "Stream access granted",
//       streamUrl: movie.streamUrl,
//       subtitles: movie.subtitles,
//       audioTracks: movie.audioTracks,
//       resolution: movie.resolution,
//     });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Failed to get stream", error: err.message });
//   }
// };

// export const streamMovie = async (req, res) => {
//   try {
//     const movie = await Movie.findById(req.params.id);
//     if (!movie || !movie.isPublished || !movie.approvedByAdmin) {
//       return res.status(404).json({ message: "Movie not found" });
//     }

//     let access = null;

//     if (req.user?.id) {
//       access = await MovieAccess.findOne({
//         user: req.user.id,
//         movie: movie._id,
//       });
//     } else {
//       const { session_id } = req.query;
//       if (session_id) {
//         access = await MovieAccess.findOne({
//           stripeSessionId: session_id,
//           movie: movie._id,
//         });
//       }
//     }

//     if (!access) {
//       return res.status(403).json({
//         message:
//           "Purchase required. Pay to unlock streaming access for this movie.",
//         price: movie.price,
//       });
//     }

//     movie.views += 1;
//     await movie.save();

//     res.json({
//       message: "Stream access granted",
//       streamUrl: movie.streamUrl,
//       subtitles: movie.subtitles,
//       audioTracks: movie.audioTracks,
//       resolution: movie.resolution,
//     });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Failed to get stream", error: err.message });
//   }
// };

// POST /api/movies/:id/rate
export const rateMovie = async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 10) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 10" });
    }

    const access = await MovieAccess.findOne({
      user: req.user.id,
      movie: req.params.id,
    });
    if (!access) {
      return res
        .status(403)
        .json({ message: "You must purchase the movie before rating it" });
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    await movie.updateRating(Number(rating));
    res.json({ message: "Rating submitted", newRating: movie.rating });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to rate movie", error: err.message });
  }
};

//PRODUCER
export const uploadMovie = async (req, res) => {
  const verifiedProducer = await Producer.findOne({
    user: req.user.id,
    isVerified: true,
  });
  if (!verifiedProducer) {
    return res.status(403).json({
      message:
        "Producer account required. Please complete producer onboarding & if you've done that, please wait for verification.",
    });
  }
  try {
    const movieData = {
      ...req.body,
      uploadedBy: req.user.id,
      isPublished: false,
      // approvedByAdmin: false,
      views: 0,
      rating: 0,
    };
    if (req.body.showingImmediately === true) {
      movieData.showingImmediately = true;
      movieData.approvedByAdmin = true;
    }

    const movie = await Movie.create(movieData);

    res.status(201).json({
      message: "Movie metadata saved. Awaiting admin approval.",
      movie,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to finalize movie upload", error: err.message });
  }
};
// GET /api/movies/premiers (coming soon)
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
      page,
      limit,
      sort: { premierDate: 1 },
      select: "-streamUrl",
      populate: {
        path: "uploadedBy",
        select: "fullname username",
      },
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch premiers",
      error: err.message,
    });
  }
};

// PUT /api/movies/:id  — producer edits their own movie
export const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    const isOwner = movie.uploadedBy.toString() === req.user.id.toString();
    const isAdmin = req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this movie" });
    }

    // If producer edits after approval, reset approval
    if (isOwner && !isAdmin) {
      req.body.approvedByAdmin = false;
    }

    const updated = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ message: "Movie updated", movie: updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update movie", error: err.message });
  }
};

// DELETE /api/movies/:id  — producer deletes their own movie
export const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    const isOwner = movie.uploadedBy.toString() === req.user.id.toString();
    const isAdmin = req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this movie" });
    }

    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: "Movie deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete movie", error: err.message });
  }
};

// GET /api/movies/my-movies  — producer sees their own uploads
export const getMyMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ uploadedBy: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ movies });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch your movies", error: err.message });
  }
};

//  ADMIN

// PATCH /api/movies/:id/approve  — admin approves a movie
export const approveMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { approvedByAdmin: true, isPublished: true },
      { new: true },
    );
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json({ message: "Movie approved and published", movie });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to approve movie", error: err.message });
  }
};

// PATCH /api/movies/:id/reject  — admin rejects/unpublishes
export const rejectMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { approvedByAdmin: false, isPublished: false },
      { new: true },
    );
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json({ message: "Movie rejected/unpublished", movie });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to reject movie", error: err.message });
  }
};

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
        message:
          "Purchase required. Pay to unlock streaming access for this movie.",
        price: movie.price,
      });
    }

    movie.views += 1;
    await movie.save();

    if (req.user?.id && req.user?.isSubscribed) {
      await ViewHistory.findOneAndUpdate(
        { user: req.user.id, movie: movie._id },
        { lastPlayedAt: new Date() },
        { upsert: true, new: true },
      );
    }

    res.json({
      message: "Stream access granted",
      streamUrl: movie.streamUrl,
      subtitles: movie.subtitles,
      audioTracks: movie.audioTracks,
      resolution: movie.resolution,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to get stream", error: err.message });
  }
};

export const getRecentlyPlayed = async (req, res) => {
  try {
    // Premium tier gating
    if (!req.user.isSubscribed) {
      return res.status(403).json({
        message: "Access denied. Recently played history is a premium feature.",
      });
    }

    const { limit = 10 } = req.query;

    const history = await ViewHistory.find({ user: req.user.id })
      .sort({ lastPlayedAt: -1 })
      .limit(Number(limit))
      .populate({
        path: "movie",
        select: "-streamUrl", // Exclude the stream url from standard listings
        populate: {
          path: "uploadedBy",
          select: "fullname username",
        },
      });

    // Extract out just the movie objects alongside their last viewed date
    const recentlyPlayed = history.map((item) => ({
      movie: item.movie,
      lastPlayedAt: item.lastPlayedAt,
    }));

    res.json({ recentlyPlayed });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch recently played movies",
      error: err.message,
    });
  }
};
