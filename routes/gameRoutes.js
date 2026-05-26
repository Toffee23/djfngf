import express from "express";
import { protect, requireGameAccess } from "../middleware/authMiddleware.js";
import { 
  startGame, 
  getGameState, 
  chooseTile, 
  restartGame, 
  quitGame 
} from "../controllers/gameController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 * name: Game Arena
 * description: Premium arcade micro-transaction systems and tile interaction sessions.
 */

/**
 * @swagger
 * /api/games/game/start:
 * post:
 * summary: Start a new arcade game session instance
 * tags: [Game Arena]
 * security:
 * - bearerAuth: []
 * responses:
 * 201:
 * description: Game started successfully.
 * 400:
 * description: Game session already in progress.
 * 403:
 * description: Access denied. Entry token purchase required.
 */
router.post("/game/start", protect, requireGameAccess, startGame);

/**
 * @swagger
 * /api/games/game/state:
 * get:
 * summary: Get live state values for an active game session
 * tags: [Game Arena]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Successfully retrieved active metrics configuration states.
 * 404:
 * description: No active game session found.
 */
router.get("/game/state", protect, requireGameAccess, getGameState);

/**
 * @swagger
 * /api/games/game/choosetile:
 * post:
 * summary: Submit a tile interaction choice index selection
 * tags: [Game Arena]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - tileIndex
 * properties:
 * tileIndex:
 * type: integer
 * example: 7
 * description: Target selection point index bounds between 0 and 31.
 * responses:
 * 200:
 * description: Tile processed successfully.
 * 400:
 * description: Selection rules violated or choices exhausted.
 */
router.post("/game/choosetile", protect, requireGameAccess, chooseTile);

/**
 * @swagger
 * /api/games/game/restart:
 * post:
 * summary: Re-initialize and clear choices inside the active session window
 * tags: [Game Arena]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Game board layout reset successfully.
 * 404:
 * description: Active session template not found.
 */
router.post("/game/restart", protect, requireGameAccess, restartGame);

/**
 * @swagger
 * /api/games/game/quit:
 * post:
 * summary: Forfeit the active session and wipe accumulated token states
 * tags: [Game Arena]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Game abandoned successfully. Session records pruned.
 * 404:
 * description: No active session available to forfeit.
 */
router.post("/game/quit", protect, requireGameAccess, quitGame);

export default router;