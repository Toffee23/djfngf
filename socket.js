// // import Message from "./models/Message.js";
// import sendAndEmitMessage from "./utils/sendandEmitMessage.js";
// import User from "./models/User.js";

// const onlineUsers = {}; // userId -> socket.id
// function socketHandler(io) {
//   io.on("connection", (socket) => {
//     console.log("✅ User connected:", socket.id);

//     // ✅ User joins their room using their userId
//     socket.on("join", (username) => {
//       socket.join(username);
//       onlineUsers[username] = socket.id;

//       io.emit("userOnline", { username });
//     });

//     // ✅ Check friend's online status by username
//     socket.on("checkFriendOnline", ({ friendUsername }) => {
//       const isOnline = !!onlineUsers[friendUsername];
//       socket.emit("friendStatus", {
//         friendUsername,
//         status: isOnline ? "Online" : "Offline",
//       });
//     });

//     // ✅ Typing indicators
//     socket.on("typing", ({ senderUsername, receiverUsername }) => {
//       console.log(`✍️ ${senderUsername} is typing to ${receiverUsername}`);
//       io.to(receiverUsername).emit("typing", { senderUsername });
//     });

//     socket.on("stopTyping", ({ senderUsername, receiverUsername }) => {
//       console.log(`✍️ ${senderUsername} stopped typing to ${receiverUsername}`);
//       io.to(receiverUsername).emit("stopTyping", { senderUsername });
//     });

//     socket.on(
//       "sendMessage",
//       async ({ senderUsername, receiverUsername, content }) => {
//         try {
//           console.log(
//             `📤 ${senderUsername} is sending to ${receiverUsername}: "${content}"`,
//           );
//           const message = await sendAndEmitMessage({
//             senderUsername,
//             receiverUsername,
//             content,
//             io,
//           });

//           // Emit to receiver to update notifications and inbox
//           io.to(receiverUsername).emit("updateNotifications", {
//             messageId: message._id,
//             from: senderUsername,
//             message: content,
//             timestamp: message.timestamp,
//           });

//           io.to(receiverUsername).emit("updateInboxItem", {
//             friendId: senderUsername,
//             lastMessage: content,
//             unreadCount: 1,
//             lastTime: message.timestamp,
//           });

//           // Optional: Update sender's inbox too
//           io.to(senderUsername).emit("updateInboxItem", {
//             friendId: receiverUsername,
//             lastMessage: content,
//             unreadCount: 0,
//             lastTime: message.timestamp,
//           });
//         } catch (error) {
//           console.error("❌ Message send error:", error.message);
//         }
//       },
//     );

//     socket.on("markAsRead", async ({ senderUsername, receiverUsername }) => {
//       try {
//         const sender = await User.findOne({ username: senderUsername });
//         const receiver = await User.findOne({ username: receiverUsername });

//         if (!sender || !receiver) {
//           return console.error("❌ Invalid sender or receiver in markAsRead");
//         }

//         const unreadMessages = await Message.find({
//           sender: sender._id,
//           receiver: receiver._id,
//           isRead: false,
//         });

//         const messageIds = unreadMessages.map((msg) => msg._id);

//         await Message.updateMany(
//           { _id: { $in: messageIds } },
//           { $set: { isRead: true, readAt: new Date() } },
//         );

//         messageIds.forEach((id) => {
//           io.to(senderUsername).emit("messageRead", {
//             messageId: id,
//             readerUsername: receiverUsername,
//             readAt: new Date().toISOString(),
//           });
//         });

//         io.to(receiverUsername).emit("updateNotifications", {
//           clearedWith: senderUsername,
//         });

//         io.to(receiverUsername).emit("updateInboxItem", {
//           friendId: senderUsername,
//           unreadCount: 0,
//         });
//       } catch (error) {
//         console.error("❌ Error marking messages as read:", error.message);
//       }
//     });

//     socket.on("disconnect", () => {
//       const username = Object.keys(onlineUsers).find(
//         (key) => onlineUsers[key] === socket.id,
//       );
//       if (username) {
//         delete onlineUsers[username];
//         io.emit("userOffline", { username });
//       }
//       console.log("❌ User disconnected:", socket.id);
//     });
//   });
// }

// export default socketHandler;
