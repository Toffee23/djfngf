import { Message } from "../models/message.js"; // Fixed: Standardized down to match lowercase disk file structures
import { User } from "../models/user.js";

/**
 * Real-Time Message Committing and Event Broadcasting Utility Nodes
 * Commits chat properties to disk concurrently while pushing instant Socket events to active rooms.
 */
export async function sendAndEmitMessage({ senderUsername, receiverUsername, content, io }) {
  if (!io) {
    throw new Error("[Socket Link Failure] Action aborted. Active Socket Server 'io' reference context is missing.");
  }

  // FIXED: Runs lookup operations concurrently inside the async pool to eliminate sequential blocking bottlenecks
  const [sender, receiver] = await Promise.all([
    User.findOne({ username: senderUsername?.trim() }),
    User.findOne({ username: receiverUsername?.trim() })
  ]);

  if (!sender || !receiver) {
    throw new Error("Message routing aborted. Invalid sender or receiver identity structures.");
  }

  // Commit text payload properties cleanly to MongoDB document collections
  const message = await Message.create({
    sender: sender._id,
    receiver: receiver._id,
    content: content?.trim(),
  });

  // Emit payload update to the receiver's dedicated username Socket channel room boundary
  io.to(receiverUsername).emit("receiveMessage", {
    _id: message._id,
    senderUsername,
    receiverUsername,
    content: message.content,
    isRead: false,
    createdAt: message.createdAt || new Date(),
  });

  // Emit tracking operational log verification straight back to the sender's validation thread
  io.to(senderUsername).emit("messageSent", message);

  return message;
}

export default sendAndEmitMessage;