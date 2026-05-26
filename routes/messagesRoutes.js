import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { 
  sendMessage, 
  getInbox, 
  getMessageNotifications, 
  getChatWithUser, 
  markAsRead 
} from "../controllers/messageController.js";

const router = express.Router();

// Apply unified global protection rules to secure chat data channels
router.use(protect);

/**
 * @swagger
 * tags:
 * name: Real-Time Messaging
 * description: Chat message log tracing, inbox summaries, and direct communication corridors.
 */

/**
 * @swagger
 * /api/messages/send:
 * post:
 * summary: Send a direct message to an active profile using their username string
 * tags: [Real-Time Messaging]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - receiverUsername
 * - content
 * properties:
 * receiverUsername:
 * type: string
 * example: johndoe
 * content:
 * type: string
 * example: "Hey, are you online?"
 * responses:
 * 201:
 * description: Message dispatched and saved to database collections successfully.
 * 404:
 * description: Destination account username mapping not found.
 * 500:
 * description: Internal structural error failing to process message dispatch.
 */
router.post("/send", sendMessage);

/**
 * @swagger
 * /api/messages/inbox:
 * get:
 * summary: Get authenticated user conversation preview inbox listing
 * tags: [Real-Time Messaging]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Active conversational thread records fetched successfully.
 */
router.get("/inbox", getInbox);

/**
 * @swagger
 * /api/messages/notifications:
 * get:
 * summary: Retrieve unread message aggregate notification stats and badge arrays
 * tags: [Real-Time Messaging]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Total unread metric counts compiled successfully.
 */
router.get("/notifications", getMessageNotifications);

/**
 * @swagger
 * /api/messages/chat/{friendUsername}:
 * get:
 * summary: Get sequential chronological chat messages ledger with a target friend profile
 * tags: [Real-Time Messaging]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: friendUsername
 * required: true
 * schema:
 * type: string
 * example: johndoe
 * responses:
 * 200:
 * description: Contextual chat logs populated successfully.
 * 404:
 * description: Friend user identity match not found.
 */
router.get("/chat/:friendUsername", getChatWithUser);

/**
 * @swagger
 * /api/messages/read/{friendUsername}:
 * patch:
 * summary: Bulk mark all pending unread message elements from a friend as read
 * tags: [Real-Time Messaging]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: friendUsername
 * required: true
 * schema:
 * type: string
 * example: janedoe
 * responses:
 * 200:
 * description: Read status updates flags mutated successfully.
 * 404:
 * description: Friend target user profile not found.
 */
router.patch("/read/:friendUsername", markAsRead); // Fixed: changed to .patch to perfectly align with Swagger documentation spec requirements

export default router;