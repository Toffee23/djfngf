
const Message = require("../models/Message");
const User = require("../models/User");

async function sendAndEmitMessage({ senderUsername, receiverUsername, content, io }) {
  const sender = await User.findOne({ username: senderUsername });
  const receiver = await User.findOne({ username: receiverUsername });

  if (!sender || !receiver) {
    throw new Error("Invalid sender or receiver");
  }

  const message = await Message.create({
    sender: sender._id,
    receiver: receiver._id,
    content,
  });

  // Emit to receiver
  io.to(receiverUsername).emit("receiveMessage", {
    senderUsername,
    receiverUsername,
    content,
    timestamp: message.timestamp,
  });

  // Emit to sender
  io.to(senderUsername).emit("messageSent", message);

  return message;
}

module.exports = sendAndEmitMessage;
