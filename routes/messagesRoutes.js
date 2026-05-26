// import express from "express";
// const router = express.Router();
// // import messageController from "../controllers/messageController.js";
// import { protect } from "../middleware/authMiddleware.js";

// /**
//  * @swagger
//  * /api/messages/send:
//  *   post:
//  *     summary: Send a message to a user by their username
//  *     tags:
//  *       - Messages
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - receiverUsername
//  *               - content
//  *             properties:
//  *               receiverUsername:
//  *                 type: string
//  *                 description: Username of the receiver
//  *                 example: johndoe
//  *               content:
//  *                 type: string
//  *                 description: The message content
//  *                 example: "Hey, are you online?"
//  *     responses:
//  *       201:
//  *         description: Message sent successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Message sent
//  *                 data:
//  *                   type: object
//  *                   properties:
//  *                     _id:
//  *                       type: string
//  *                       example: 64f232a84d23c83bc0c9d123
//  *                     sender:
//  *                       type: string
//  *                       example: 64f231a84d23c83bc0c9dabc
//  *                     receiver:
//  *                       type: string
//  *                       example: 64f234a84d23c83bc0c9def
//  *                     content:
//  *                       type: string
//  *                       example: "Hey, are you online?"
//  *                     timestamp:
//  *                       type: string
//  *                       format: date-time
//  *                     isRead:
//  *                       type: boolean
//  *                       example: false
//  *       404:
//  *         description: Receiver not found
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Receiver not found
//  *       500:
//  *         description: Failed to send message
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Failed to send message
//  *                 error:
//  *                   type: string
//  */

// // router.post("/send", protect, messageController.);

// /**
//  * @swagger
//  * /api/messages/inbox:
//  *   get:
//  *     summary: Get user inbox
//  *     description: Returns a list of recent conversations for the authenticated user, with unread counts and last message previews.
//  *     tags:
//  *       - Messages
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: List of conversations
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 inbox:
//  *                   type: array
//  *                   items:
//  *                     type: object
//  *                     properties:
//  *                       friend:
//  *                         type: object
//  *                         properties:
//  *                           _id:
//  *                             type: string
//  *                             example: 64d3d97c1234567890abcd12
//  *                           username:
//  *                             type: string
//  *                             example: johndoe
//  *                       lastMessage:
//  *                         type: string
//  *                         example: Hey, are you available tonight?
//  *                       unreadCount:
//  *                         type: integer
//  *                         example: 2
//  *                       lastTime:
//  *                         type: string
//  *                         format: date-time
//  *                         example: 2025-07-30T10:00:00.000Z
//  *       500:
//  *         description: Failed to fetch inbox
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Failed to fetch inbox
//  *                 error:
//  *                   type: string
//  *                   example: Some internal error message
//  */

// router.get("/inbox", protect, messageController.getInbox);

// /**
//  * @swagger
//  * /api/messages/notifications:
//  *   get:
//  *     summary: Get recent unread message notifications for the authenticated user
//  *     tags:
//  *       - Messages
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Unread message notifications retrieved successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 totalUnread:
//  *                   type: integer
//  *                   example: 3
//  *                 notifications:
//  *                   type: array
//  *                   items:
//  *                     type: object
//  *                     properties:
//  *                       from:
//  *                         type: string
//  *                         description: Username of the sender
//  *                         example: johndoe
//  *                       messageId:
//  *                         type: string
//  *                         description: ID of the unread message
//  *                       senderId:
//  *                         type: string
//  *                         description: ID of the sender
//  *                       message:
//  *                         type: string
//  *                         description: Content of the unread message
//  *                       time:
//  *                         type: string
//  *                         format: date-time
//  *                         description: Timestamp of when the message was sent
//  *       500:
//  *         description: Failed to get notifications
//  */

// router.get(
//   "/notifications",
//   protect,
//   messageController.getMessageNotifications,
// );

// /**
//  * @swagger
//  * /api/messages/chat/{friendUsername}:
//  *   get:
//  *     summary: Get chat messages with a specific user
//  *     tags:
//  *       - Messages
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: friendUsername
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Username of the friend to retrieve chat with
//  *         example: johndoe
//  *     responses:
//  *       200:
//  *         description: Chat messages retrieved successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 chat:
//  *                   type: array
//  *                   items:
//  *                     type: object
//  *                     properties:
//  *                       _id:
//  *                         type: string
//  *                         example: 64f232a84d23c83bc0c9d123
//  *                       sender:
//  *                         type: string
//  *                         example: 64f231a84d23c83bc0c9dabc
//  *                       receiver:
//  *                         type: string
//  *                         example: 64f234a84d23c83bc0c9def
//  *                       content:
//  *                         type: string
//  *                         example: "Hey there!"
//  *                       timestamp:
//  *                         type: string
//  *                         format: date-time
//  *                       isRead:
//  *                         type: boolean
//  *                         example: true
//  *       404:
//  *         description: Friend not found
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Friend not found
//  *       500:
//  *         description: Failed to fetch chat
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Failed to fetch chat
//  *                 error:
//  *                   type: string
//  */

// router.get("/chat/:friendUsername", protect, messageController.getChatWithUser);

// /**
//  * @swagger
//  * /api/messages/read/{friendUsername}:
//  *   patch:
//  *     summary: Mark all unread messages from a friend as read
//  *     tags:
//  *       - Messages
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: friendUsername
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Username of the friend whose messages will be marked as read
//  *         example: janedoe
//  *     responses:
//  *       200:
//  *         description: Messages marked as read successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Messages marked as read
//  *                 updatedCount:
//  *                   type: integer
//  *                   example: 5
//  *       404:
//  *         description: Friend not found
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Friend not found
//  *       500:
//  *         description: Failed to mark messages as read
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Failed to mark messages as read
//  *                 error:
//  *                   type: string
//  */

// router.put("/read/:friendUsername", protect, markAsRead);

// export default router;
