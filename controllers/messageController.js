import Message from "../models/Message.js";
import { User } from "../models/User.js";
import sendAndEmitMessage from "../utils/sendandEmitMessage.js";

// POST /api/messages/send
export const sendMessage = async (req, res) => {
  const { receiverUsername, content } = req.body;
  const io = req.io || null; // Defensive check for disabled Socket.io layers

  if (!receiverUsername || !content || !content.trim()) {
    return res.status(400).json({ message: "Receiver username and message content are required." });
  }

  try {
    const senderUsername = req.user.username;

    const message = await sendAndEmitMessage({
      senderUsername,
      receiverUsername,
      content: content.trim(),
      io,
    });

    return res.status(201).json({ message: "Message sent", data: message });
  } catch (err) {
    console.error("Send Message Core Error:", err);
    return res.status(500).json({
      message: "Failed to send message",
      error: err.message,
    });
  }
};

// GET /api/messages/inbox
export const getInbox = async (req, res) => {
  const userId = req.user.id;

  try {
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ timestamp: -1 })
      .populate("sender receiver", "username");

    const chatsMap = new Map();

    messages.forEach((msg) => {
      // Defensive Check: Prevent crashes if an account was hard-deleted from database
      if (!msg.sender || !msg.receiver) return;

      const senderIdStr = msg.sender._id.toString();
      const receiverIdStr = msg.receiver._id.toString();

      const friendId = senderIdStr === userId ? receiverIdStr : senderIdStr;
      
      if (!chatsMap.has(friendId)) {
        // Optimized check: process count dynamically 
        const unreadCount = messages.filter(
          (m) =>
            m.sender && 
            m.receiver &&
            m.sender._id.toString() === friendId &&
            m.receiver._id.toString() === userId &&
            !m.isRead
        ).length;

        chatsMap.set(friendId, {
          friend: senderIdStr === userId ? msg.receiver : msg.sender,
          lastMessage: msg.content,
          unreadCount,
          lastTime: msg.timestamp,
        });
      }
    });

    return res.status(200).json({ inbox: Array.from(chatsMap.values()) });
  } catch (err) {
    console.error("Get Inbox Core Error:", err);
    return res.status(500).json({ message: "Failed to fetch inbox", error: err.message });
  }
};

// GET /api/messages/notifications
export const getMessageNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const unreadMessages = await Message.find({
      receiver: userId,
      isRead: false,
    })
      .populate("sender", "username")
      .limit(10);

    const notifications = unreadMessages
      .filter((msg) => msg.sender) // Defend against orphaned messages
      .map((msg) => ({
        from: msg.sender.username,
        messageId: msg._id,
        senderId: msg.sender._id,
        message: msg.content,
        time: msg.timestamp,
      }));

    return res.status(200).json({
      totalUnread: notifications.length,
      notifications,
    });
  } catch (err) {
    console.error("Get Notifications Error:", err);
    return res.status(500).json({ message: "Failed to get notifications", error: err.message });
  }
};

// PUT /api/messages/mark-read/:friendUsername
export const markAsRead = async (req, res) => {
  const userId = req.user.id;
  const friendUsername = req.params.friendUsername;

  try {
    const friend = await User.findOne({ username: friendUsername });
    if (!friend) {
      return res.status(404).json({ message: "Friend profile not found" });
    }

    const friendId = friend._id;

    const messages = await Message.find({
      sender: friendId,
      receiver: userId,
      isRead: false,
    });

    const messageIds = messages.map((m) => m._id);

    if (messageIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $set: { isRead: true, readAt: new Date() } }
      );

      // Safe guard against disabled socket instances in index.js
      if (req.io) {
        messageIds.forEach((id) => {
          req.io.to(friendId.toString()).emit("messageRead", {
            messageId: id,
            readerId: userId,
            readAt: new Date(),
          });
        });
      }
    }

    return res.status(200).json({ message: "Messages marked as read", updatedCount: messageIds.length });
  } catch (err) {
    console.error("Mark Messages Read Error:", err);
    return res.status(500).json({ message: "Failed to mark messages as read", error: err.message });
  }
};

// GET /api/messages/history/:friendUsername
export const getChatWithUser = async (req, res) => {
  const userId = req.user.id;
  const friendUsername = req.params.friendUsername;

  try {
    const friend = await User.findOne({ username: friendUsername });
    if (!friend) {
      return res.status(404).json({ message: "Friend profile not found" });
    }

    const friendId = friend._id;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ],
    }).sort({ timestamp: 1 });

    return res.status(200).json({ chat: messages });
  } catch (err) {
    console.error("Get Chat History Error:", err);
    return res.status(500).json({ message: "Failed to fetch chat log", error: err.message });
  }
};