const Message = require("../models/Message");
const User = require("../models/User");
const sendAndEmitMessage = require("../utils/sendandEmitMessage");

// Send a new message
exports.sendMessage = async (req, res) => {
  const { receiverUsername, content } = req.body;
  const io = req.io;

  try {
    const senderUsername = req.user.username; // 👈 Get sender's username

    const message = await sendAndEmitMessage({
      senderUsername,
      receiverUsername,
      content,
      io,
    });

    res.status(201).json({ message: "Message sent", data: message });
  } catch (err) {
    res.status(500).json({
      message: "Failed to send message",
      error: err.message,
    });
  }
};


// Get inbox (conversation summary)
exports.getInbox = async (req, res) => {
  const userId = req.user.id;

  try {
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ timestamp: -1 })
      .populate("sender receiver", "username");

    const chatsMap = new Map();

    messages.forEach((msg) => {
      const friendId =
        msg.sender._id.toString() === userId
          ? msg.receiver._id.toString()
          : msg.sender._id.toString();
      if (!chatsMap.has(friendId)) {
        const unreadCount = messages.filter(
          (m) =>
            m.sender._id.toString() === friendId &&
            m.receiver._id.toString() === userId &&
            !m.isRead
        ).length;

        chatsMap.set(friendId, {
          friend:
            msg.sender._id.toString() === userId ? msg.receiver : msg.sender,
          lastMessage: msg.content,
          unreadCount,
          lastTime: msg.timestamp,
        });
      }
    });

    res.json({ inbox: Array.from(chatsMap.values()) });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch inbox", error: err.message });
  }
};

// Get notification summary
exports.getMessageNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const unreadMessages = await Message.find({
      receiver: userId,
      isRead: false,
    })
      .populate("sender", "username")
      .limit(10);

    const notifications = unreadMessages.map((msg) => ({

      from: msg.sender.username,
      messageId: msg._id,
      senderId: msg.sender._id,
      message: msg.content,
      time: msg.timestamp,
    }));

    res.json({
      totalUnread: unreadMessages.length,
      notifications,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to get notifications", error: err.message });
  }
};

// Mark messages as read in a chat
exports.markAsRead = async (req, res) => {
  const userId = req.user.id;
  const friendUsername = req.params.friendUsername;

  try {
    const friend = await User.findOne({ username: friendUsername });
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    const friendId = friend._id;

    const messages = await Message.find({
      sender: friendId,
      receiver: userId,
      isRead: false,
    });

    const messageIds = messages.map((m) => m._id);

    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $set: { isRead: true, readAt: new Date() } }
    );

    messageIds.forEach((id) => {
      req.io.to(friendId.toString()).emit("messageRead", {
        messageId: id,
        readerId: userId,
        readAt: new Date(),
      });
    });

    res.json({ message: "Messages marked as read", updatedCount: messageIds.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark messages as read", error: err.message });
  }
};



// Get chat history
exports.getChatWithUser = async (req, res) => {
  const userId = req.user.id;
  const friendUsername = req.params.friendUsername;

  try {
    const friend = await User.findOne({ username: friendUsername });
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    const friendId = friend._id;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ],
    }).sort({ timestamp: 1 });

    res.json({ chat: messages });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch chat", error: err.message });
  }
};
