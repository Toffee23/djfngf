import { Queue } from "bullmq";
import { redisConnection } from "../../config/redis.config.js";

export const mailQueue = new Queue("mail", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // 5s, 10s, 20s
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

// job type helpers

export const enqueueProducerAdminNotification = (data) =>
  mailQueue.add("producer:admin-notification", data, { priority: 1 });

export const enqueueProducerApproval = (data) =>
  mailQueue.add("producer:approval", data);

export const enqueueProducerRejection = (data) =>
  mailQueue.add("producer:rejection", data);

export const enqueueInfoNeeded = (data) =>
  mailQueue.add("producer:info-needed", data);

export const enqueueFriendRecommendation = (data) =>
  mailQueue.add("user:friend-recommendation", data);

export const enqueueWatchalong = (data) =>
  mailQueue.add("user:watchalong", data);

export const enqueueSystemRecommendation = (data) =>
  mailQueue.add("user:system-recommendation", data);
