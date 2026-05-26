const GameSession = require("../models/GameSession");
const User = require("../models/User");

exports.startGame = async (req, res) => {
  try {
    // Check if a session already exists
    const existingSession = await GameSession.findOne({ user: req.user.id });
    if (existingSession) {
      return res.status(400).json({
        message:
          "Game already in progress.  Please finish or restart the game.",
      });
    }

    // Check if user has access
    const user = await User.findById(req.user.id);
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

    res.status(201).json({
      message: "Game started",
      session,
      hasGameAccess: user.hasGameAccess,
      subscriptionType: user.subscriptionType,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to start game", error: err.message });
  }
};

exports.chooseTile = async (req, res) => {
  const { tileIndex } = req.body;

  if (tileIndex < 0 || tileIndex > 31) {
    return res.status(400).json({ message: "Invalid tile index" });
  }

  try {
    const session = await GameSession.findOne({ user: req.user.id });

    if (!session) {
      return res.status(400).json({ message: "No active game session" });
    }

    const timeElapsed = (Date.now() - session.gameStartTime.getTime()) / 1000;
    
    const isTimeUp = timeElapsed >= 60; 
    if (isTimeUp || session.slotsLeft <= 0) {
      const user = await User.findById(req.user.id);

      if (user && user.subscriptionType === "basic") {
        user.hasGameAccess = false;
        await user.save();
      }

      // Delete session after game ends
      await GameSession.deleteOne({ user: req.user.id });

      return res.status(200).json({
        message: "Game over. Time expired or all slots used.",
        gameOver: true,
        balance: session.balance,
        slotsLeft: session.slotsLeft,
        hasGameAccess: user?.hasGameAccess || false,
        subscriptionType: user?.subscriptionType || null,
      });
    }

    // Process the choice
    let result = "miss";
    if (tileIndex === session.goldenTileIndex) {
      session.balance = 5000;
      result = "hit";
    }

    session.slotsLeft -= 1;
    session.goldenTileIndex = Math.floor(Math.random() * 32);

    await session.save();

    res.status(200).json({
      result,
      message:
        result === "hit" ? "🎯 You found the golden icon!" : "❌ Missed!",
      balance: session.balance,
      slotsLeft: session.slotsLeft,
      gameOver: session.slotsLeft <= 0 || isTimeUp,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to choose tile", error: err.message });
  }
};

exports.getGameState = async (req, res) => {
  const session = await GameSession.findOne({ user: req.user.id });

  if (!session) {
    return res.status(400).json({ message: "No active session" });
  }

  const timeElapsed = (Date.now() - session.gameStartTime.getTime()) / 1000;
  const timeLeft = Math.max(0, 60 - timeElapsed); // 5 minutes = 300 seconds

  res.status(200).json({
    message: "Current game state",
    balance: session.balance,
    slotsLeft: session.slotsLeft,
    timeLeft,
    gameOver: session.slotsLeft <= 0 || timeLeft <= 0,
  });
};
// controllers/gameController.js
exports.restartGame = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Check game access
    if (user.subscriptionType === "basic" && !user.hasGameAccess) {
      return res.status(403).json({
        message: "Access denied. Please pay ₦100 to restart the game.",
        requiresGamePayment: true,
        hasGameAccess: false,
      });
    }

    // Delete any old session
    await GameSession.deleteOne({ user: user._id });

    // Start a fresh game session
    const goldenTileIndex = Math.floor(Math.random() * 32);
    const session = await GameSession.create({
      user: user._id,
      goldenTileIndex,
      gameStartTime: new Date(),
    });

    res.status(201).json({
      message: "Game restarted",
      session,
      hasGameAccess: user.hasGameAccess,
      subscriptionType: user.subscriptionType,
    });
  } catch (err) {
    console.error("Restart error:", err);
    res.status(500).json({ message: "Failed to restart game", error: err.message });
  }
};



exports.quitGame = async (req, res) => {
  try {
    const session = await GameSession.findOne({ user: req.user.id });

    if (!session) {
      return res
        .status(404)
        .json({ message: "No active game session to quit." });
    }

    const lostBalance = session.balance || 0;

    // Delete the session
    await GameSession.deleteOne({ user: req.user.id });

    // Reset game access for basic users only
    const user = await User.findById(req.user.id);
    if (user && user.subscriptionType === "basic") {
      user.hasGameAccess = false;
      await user.save();
    }

    res.status(200).json({
      message:
        "Game quit successfully. All progress and earnings have been lost.",
      lostBalance,
      slotsLost: session.slotsLeft,
      quitAt: new Date(),
      hasGameAccess: user.hasGameAccess,
      subscriptionType: user.subscriptionType,
    });
  } catch (err) {
    console.error("Quit error:", err);
    res
      .status(500)
      .json({ message: "Failed to quit game", error: err.message });
  }
};
