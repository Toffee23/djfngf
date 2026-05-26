const mongoose = require("mongoose");

const GameSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  goldenTileIndex: { type: Number, required: true },// value between 0 and 31
  slotsLeft: { type: Number, default: 3 },
  balance: { type: Number, default: 0 },
  hasChosenThisRound: { type: Boolean, default: false },
  gameStartTime: { type: Date, default: Date.now } // NEW
});


module.exports = mongoose.model("GameSession", GameSessionSchema);
