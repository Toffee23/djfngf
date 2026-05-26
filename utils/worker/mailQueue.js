import { Queue } from "bullmq";
import { redisConnection } from "../../config/redis.config.js";

/**
 * Mail Delivery Queue Instance
 * Handles background scheduling and backoff logic for transactional mail loops.
 */
export const mailQueue = new Queue("mail", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // Retries scale safely: 5s, 10s, 20s
    },
    removeOnComplete: { count: 100 }, // Safeguards Redis memory limits
    removeOnFail: { count: 50 },
  },
});

// ── Queue Error Monitoring Listeners ───────────────────────────────
mailQueue.on("error", (error) => {
  console.error(`❌ [Mail Queue Redis Client Exception] Loop error: ${error.message}`);
});

// ── Payload Validation Guard ──────────────────────────────────────
/**
 * Safely guards against corrupted or incomplete payload arguments before committing them to Redis
 */
const verifyPayload = (jobName, data) => {
  if (!data || typeof data !== "object") {
    throw new Error(`[Queue Rejection] Task "${jobName}" requires a valid payload object structure.`);
  }
  if (!data.to && !data.email) {
    console.warn(`⚠️ [Queue Parameter Warning] Scheduled job "${jobName}" is missing an explicit recipient address field.`);
  }
  return data;
};

// ── Job Type Enqueue Helpers ───────────────────────────────────────

export const enqueueProducerAdminNotification = (data) =>
  mailQueue.add("producer:admin-notification", verifyPayload("producer:admin-notification", data), { priority: 1 });

export const enqueueProducerApproval = (data) =>
  mailQueue.add("producer:approval", verifyPayload("producer:approval", data));

export const enqueueProducerRejection = (data) =>
  mailQueue.add("producer:rejection", verifyPayload("producer:rejection", data));

export const enqueueInfoNeeded = (data) =>
  mailQueue.add("producer:info-needed", verifyPayload("producer:info-needed", data));

export const enqueueFriendRecommendation = (data) =>
  mailQueue.add("user:friend-recommendation", verifyPayload("user:friend-recommendation", data));

export const enqueueWatchalong = (data) =>
  mailQueue.add("user:watchalong", verifyPayload("user:watchalong", data));

export const enqueueSystemRecommendation = (data) =>
  mailQueue.add("user:system-recommendation", verifyPayload("user:system-recommendation", data));