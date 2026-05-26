// const express = require("express");
// const router = express.Router();
// const { protect, requireGameAccess } = require("../middleware/authMiddleware");
// const gameController = require("../controllers/gameController");

// /**
//  * @swagger
//  * /api/games/game/start:
//  *   post:
//  *     summary: Start a new game session
//  *     description: Starts a new game for the user if they have access and no active session is ongoing.
//  *     tags:
//  *       - Game
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       201:
//  *         description: Game started successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Game started
//  *                 session:
//  *                   $ref: '#/components/schemas/GameSession'
//  *                 hasGameAccess:
//  *                   type: boolean
//  *                   example: true
//  *                 subscriptionType:
//  *                   type: string
//  *                   example: basic
//  *       400:
//  *         description: Game already in progress
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Game already in progress. Finish or quit before starting again.
//  *       403:
//  *         description: Access denied due to unpaid game access
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Access denied. Please pay ₦100 to start a new game session.
//  *       500:
//  *         description: Failed to start game due to server error
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Failed to start game
//  *                 error:
//  *                   type: string
//  *                   example: Internal server error message
//  */

// router.post(
//   "/game/start",
//   protect,
//   requireGameAccess,
//   gameController.startGame,
// );

// /**
//  * @swagger
//  * /api/games/game/state:
//  *   get:
//  *     summary: Get current game state
//  *     description: Retrieves the current game session's state, including balance, remaining slots, and remaining time.
//  *     tags:
//  *       - Game
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Successfully retrieved game state
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Current game state
//  *                 balance:
//  *                   type: number
//  *                   example: 2000
//  *                 slotsLeft:
//  *                   type: integer
//  *                   example: 2
//  *                 timeLeft:
//  *                   type: number
//  *                   example: 120.5
//  *                 gameOver:
//  *                   type: boolean
//  *                   example: false
//  *       400:
//  *         description: No active session
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: No active session
//  */

// router.get(
//   "/game/state",
//   protect,
//   requireGameAccess,
//   gameController.getGameState,
// );

// /**
//  * @swagger
//  * /api/games/game/choosetile:
//  *   post:
//  *     summary: Select a tile in the game session
//  *     description: Allows a player to choose a tile. Determines win/loss and updates game state.
//  *     tags:
//  *       - Game
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               tileIndex:
//  *                 type: integer
//  *                 example: 7
//  *                 description: Index of the selected tile (0–31)
//  *     responses:
//  *       200:
//  *         description: Result of tile selection
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 result:
//  *                   type: string
//  *                   example: hit
//  *                 message:
//  *                   type: string
//  *                   example: 🎯 You found the golden icon!
//  *                 balance:
//  *                   type: integer
//  *                   example: 5000
//  *                 slotsLeft:
//  *                   type: integer
//  *                   example: 2
//  *                 gameOver:
//  *                   type: boolean
//  *                   example: false
//  *       400:
//  *         description: Invalid input or no session found
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: No active game session
//  *       500:
//  *         description: Server error
//  */

// router.post(
//   "/game/choosetile",
//   protect,
//   requireGameAccess,
//   gameController.chooseTile,
// );

// router.post(
//   "/game/restart",
//   protect,
//   requireGameAccess,
//   gameController.restartGame,
// );

// /**
//  * @swagger
//  * /api/games/game/quit:
//  *   post:
//  *     summary: Quit the current game session
//  *     description: Ends the user's active game session, deletes all progress, and disables game access for basic users.
//  *     tags:
//  *       - Game
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Game quit successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Game quit successfully. All progress and earnings have been lost.
//  *                 lostBalance:
//  *                   type: number
//  *                   example: 0
//  *                 slotsLost:
//  *                   type: number
//  *                   example: 3
//  *                 quitAt:
//  *                   type: string
//  *                   format: date-time
//  *                   example: 2025-07-16T14:55:00.000Z
//  *                 hasGameAccess:
//  *                   type: boolean
//  *                   example: false
//  *                 subscriptionType:
//  *                   type: string
//  *                   example: basic
//  *       404:
//  *         description: No active game session to quit
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: No active game session to quit.
//  *       500:
//  *         description: Server error when quitting the game
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Failed to quit game
//  *                 error:
//  *                   type: string
//  *                   example: Error stack trace message
//  */

// router.post("/game/quit", protect, requireGameAccess, gameController.quitGame);

// module.exports = router;
