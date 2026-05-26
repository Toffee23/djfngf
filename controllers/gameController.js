import GameSession from "../models/GameSession.js";
import { User } from "../models/User.js";

// POST /api/games/start
export const startGame = async (req, res) => {
  try {
    // Check if a session already exists
    const existingSession = await GameSession.findOne({ user: req.user.id });
    if (existingSession) {
      return res.status(400).json({
        message: "Game already in progress. Please finish or restart the game.",
      });
    }

    // Check if user has access
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User account profile not found." });
    }

    if (user.subscriptionType === "basic" && !user.hasGameAccess) {
      return res.status(403).json({
        message: "Access denied. Please pay ₦100 to start a new game session.",
      });
    }

    // Create a new game session
    const goldenTileIndex = Math.floor(Math.random() * 32);
    const session = await GameSession.create({
      user: req.user.id,
      goldenTileIndex,
      gameStartTime: new Date(),
    });

    return res.status(201).json({
      message: "Game started successfully",
      session,
      hasGameAccess: user.hasGameAccess,
      subscriptionType: user.subscriptionType,
    });
  } catch (err) {
    console.error("Start Game Core Error:", err);
    return res.status(500).json({ message: "Failed to start game", error: err.message });
  }
};

// POST /api/games/choose-tile
export const chooseTile = async (req, res) => {
  const { tileIndex } = req.body;

  if (tileIndex === undefined || tileIndex < 0 || tileIndex > 31) {
    return res.status(400).json({ message: "Invalid tile index. Must be between 0 and 31." });
  }

  try {
    const session = await GameSession.findOne({ user: req.user.id });

    if (!session) {
      return res.status(400).json({ message: "No active game session found." });
    }

    const timeElapsed = (Date.now() - new Date(session.gameStartTime).getTime()) / 1000;
    const isTimeUp = timeElapsed >= 60; 

    if (isTimeUp || session.slotsLeft <= 0) {
      const user = await User.findById(req.user.id);

      if (user && user.subscriptionType === "basic") {
        user.hasGameAccess = false;
        await user.save();
      }

      // Safe clean up deletion
      await GameSession.deleteOne({ _id: session._id });

      return res.status(200).json({
        message: "Game over. Time expired or all slots used.",
        gameOver: true,
        balance: session.balance,
        slotsLeft: session.slotsLeft,
        hasGameAccess: user ? user.hasGameAccess : false,
        subscriptionType: user ? user.subscriptionType : "basic",
      });
    }

    // Process the choice selection
    let result = "miss";
    if (tileIndex === session.goldenTileIndex) {
      session.balance = (session.balance || 0) + 5000; // Increment safely instead of hard overwriting 
      result = "hit";
    }

    session.slotsLeft -= 1;
    session.goldenTileIndex = Math.floor(Math.random() * 32);

    await session.save();

    return res.status(200).json({
      result,
      message: result === "hit" ? "🎯 You found the golden icon!" : "❌ Missed!",
      balance: session.balance,
      slotsLeft: session.slotsLeft,
      gameOver: session.slotsLeft <= 0 || isTimeUp,
    });
  } catch (err) {
    console.error("Choose Tile Execution Error:", err);
    return res.status(500).json({ message: "Failed to process tile selection", error: err.message });
  }
};

// GET /api/games/state
export const getGameState = async (req, res) => {
  try {
    const session = await GameSession.findOne({ user: req.user.id });

    if (!session) {
      return res.status(400).json({ message: "No active session found." });
    }

    const timeElapsed = (Date.now() - new Date(session.gameStartTime).getTime()) / 1000;
    const timeLeft = Math.max(0, 60 - timeElapsed);

    return res.status(200).json({
      message: "Current game state retrieved",
      balance: session.balance,
      slotsLeft: session.slotsLeft,
      timeLeft: parseFloat(timeLeft.toFixed(1)),
      gameOver: session.slotsLeft <= 0 || timeLeft <= 0,
    });
  } catch (err) {
    console.error("Get Game State Internal Error:", err);
    return res.status(500).json({ message: "Failed to retrieve game state." });
  }
};

// POST /api/games/restart
export const restartGame = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate permission state bounds
    if (user.subscriptionType === "basic" && !user.hasGameAccess) {
      return res.status(403).json({
        message: "Access denied. Please pay ₦100 to restart the game.",
        requiresGamePayment: true,
        hasGameAccess: false,
      });
    }

    // Clean up old active tracking layers
    await GameSession.deleteOne({ user: user._id });

    // Spawn a fresh interactive layout
    const goldenTileIndex = Math.floor(Math.random() * 32);
    const session = await GameSession.create({
      user: user._id,
      goldenTileIndex,
      gameStartTime: new Date(),
    });

    return res.status(201).json({
      message: "Game restarted successfully",
      session,
      hasGameAccess: user.hasGameAccess,
      subscriptionType: user.subscriptionType,
    });
  } catch (err) {
    console.error("Restart Game Internal Processing Error:", err);
    return res.status(500).json({ message: "Failed to restart game", error: err.message });
  }
};

// POST /api/games/quit
export const quitGame = async (req, res) => {
  try {
    const session = await GameSession.findOne({ user: req.user.id });

    if (!session) {
      return res.status(404).json({ message: "No active game session to quit." });
    }

    const lostBalance = session.balance || 0;

    // Delete session instantly
    await GameSession.deleteOne({ _id: session._id });

    // Clear access criteria for basic membership tiers
    const user = await User.findById(req.user.id);
    if (user && user.subscriptionType === "basic") {
      user.hasGameAccess = false;
      await user.save();
    }

    return res.status(200).json({
      message: "Game quit successfully. All progress and earnings have been lost.",
      lostBalance,
      slotsLost: session.slotsLeft,
      quitAt: new Date(),
      hasGameAccess: user ? user.hasGameAccess : false,
      subscriptionType: user ? user.subscriptionType : "basic",
    });
  } catch (err) {
    console.error("Quit Game Internal Error:", err);
    return res.status(500).json({ message: "Failed to quit game cleanly", error: err.message });
  }
};