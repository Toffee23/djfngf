import dotenv from "dotenv";
dotenv.config();
import { redisConnection } from "../../config/redis.config.js";
import { Worker } from "bullmq";
import { mailService } from "../mailer/index.js";
import { adminProducerNotificationTemplate } from "../mailer/templates/adminProducer.template.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL;

/**
 * Central mail worker.
 */
const worker = new Worker(
  "mail",
  async (job) => {
    const { name, data } = job;
    console.log(`[MailWorker] Processing job "${name}" (id: ${job.id})`);

    switch (name) {
      //  Producer: notify admin of new application
      case "producer:admin-notification": {
        if (!ADMIN_EMAIL) throw new Error("ADMIN_EMAIL env var is not set");

        const html = adminProducerNotificationTemplate({
          ...data,
          adminBaseUrl: ADMIN_BASE_URL,
        });

        await mailService.sendMail(
          ADMIN_EMAIL,
          `New Producer Application — ${data.producerName}`,
          `New producer application from ${data.producerName} (${data.email}). Review in admin panel.`,
          html,
        );
        break;
      }

      //  Producer: approved
      case "producer:approval": {
        await mailService.sendProducerApprovalMail(data.to, data.producerName);
        break;
      }

      //  Producer: rejected
      case "producer:rejection": {
        await mailService.sendProducerRejectedMail(data.to, data.producerName);
        break;
      }

      //  Producer: info needed
      case "producer:info-needed": {
        await mailService.sendInfoNeededMail(data.to, data.producerName);
        break;
      }

      //  User: friend recommendation
      case "user:friend-recommendation": {
        await mailService.sendFriendRecommendationMail(
          data.to,
          data.friendName,
          {
            movieTitle: data.movieTitle,
            movieUrl: data.movieUrl,
            senderName: data.senderName,
          },
        );
        break;
      }

      //  User: watch-along invitation
      case "user:watchalong": {
        await mailService.sendWatchalongMail(data.to, data.friendName);
        break;
      }

      //  User: system recommendation
      case "user:system-recommendation": {
        await mailService.sendSystemRecommendationMail(data.to, data.user_name);
        break;
      }

      default:
        console.warn(`[MailWorker] Unknown job type: "${name}". Skipping.`);
    }

    console.log(`[MailWorker] Job "${name}" (id: ${job.id}) completed.`);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

worker.on("failed", (job, err) => {
  console.error(
    `[MailWorker] Job "${job?.name}" (id: ${job?.id}) failed on attempt ${job?.attemptsMade}:`,
    err.message,
  );
});

worker.on("error", (err) => {
  console.error("[MailWorker] Worker error:", err.message);
});

console.log("[MailWorker] Mail worker started and listening for jobs...");

export default worker;
