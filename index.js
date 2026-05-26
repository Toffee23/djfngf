import { config } from "dotenv";
config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://new-prim-pit-roan.vercel.app/";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
import http from "http";
import { Server } from "socket.io";
import path from "path";

// import "./utils/worker/index.worker.js";

// console.log(process.env.PAYSTACK_SECRET_KEY); // Log the Paystack secret key to make sure it's loaded correctly

import userauthRoutes from "./routes/userauthRoutes.js";
import paystackRoutes from "./routes/paystackRoutes.js"; // Import Paystack routes
import profileRoutes from "./routes/profileRoutes.js"; // Import profile routes
// import gameRoutes from "./routes/gameRoutes.js"; // Import game routes
import movieRoutes from "./routes/movieRoute.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import earningRoutes from "./routes/earningRoutes.js";
import resetprofiledefaultRoutes from "./routes/resetprofiledefaultRoutes.js";
import updateprofileRoutes from "./routes/updateprofileRoutes.js";
import fetchuserprofileRoutes from "./routes/fetchuserRoutes.js";
// import messagesRoutes from "./routes/messagesRoutes.js";
// import socketHandler from "./socket.js";
import stripeRoutes from "./routes/stripeRoutes.js";
import { stripeWebhook } from "./controllers/stripeController.js";
// import { mailService } from "./utils/mailer/index.js";
// import "./utils/worker/mailWorker.js";

const app = express();

const allowedOrigins = [
  FRONTEND_URL, // your actual frontend domain
  BACKEND_URL, // your backend domain
  "http://localhost:5173",
  // your actual frontend domain
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "OPTIONS"],
  }),
);

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);
// Middleware to parse JSON bodies
app.use(express.json());
const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
//   },
// });

// socketHandler(io);

// Attach the io instance to the request object for use in routes
// app.set("io", io);
// app.use((req, res, next) => {
//   req.io = io;
//   next();
// });

// MongoDB Connection
// console.log("Mongo URI:", process.env.MONGO_URI);
/**
 * connect to database
 */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

/**
 * @swagger
 * /
 *   get:
 *     summary: API welcome route
 *     description: Returns a welcome message to confirm the API is running.
 *     responses:
 *
 *       200:
 *         description: A welcome message
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Welcome to the Prime Pit API
 */
app.get("/", (req, res) => {
  res.send("Welcome to the Prime Pit API");
});
app.use("/api/profile", profileRoutes); // Profile-related routes
app.use("/api/users", userauthRoutes); // User-related routes
app.use("/api/paystack", paystackRoutes); // Paystack payment routes
// app.use("/api/games", gameRoutes); // Game-related routes
app.use("/api/updateprofile", updateprofileRoutes);
app.use("/api/resetprofile", resetprofiledefaultRoutes);
app.use("/api/fetchuser", fetchuserprofileRoutes);
// app.use("/api/messages", messagesRoutes); // Messages-related routes
app.use("/api/movies", movieRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/earnings", earningRoutes);
app.use("/api/stripe", stripeRoutes);

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// try {
//   const info = await mailService.sendMail(
//     "horiyorrmi72@gmail.com",
//     "Test Subject",
//     "Plain text fallback",
//     "<h1>Test HTML</h1>",
//   );
//   console.log("✅ Mail sent:", info.messageId);
// } catch (err) {
//   console.error("❌ Mail failed:", err.message, err.code);
// }

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
