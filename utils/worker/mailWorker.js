import dotenv from "dotenv";
import { redisConnection } from "../../config/redis.config.js";
import { Worker } from "bullmq";
import { mailService } from "../mailer/index.js";
import { adminProducerNotificationTemplate } from "../mailer/templates/adminProducer.template.js";

// Insulate instances dynamically
dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL;

/**
 * Centralized Asynchronous Mail Worker Task Runner Node
 * Processes job strings offloaded from the master Express event loop threads.
 */
const worker = new Worker(
  "mail",
  async (job) => {
    const { name, data } = job;
    console.log(`⏳ [MailWorker Processing] Running job "${name}" (ID: ${job.id})`);

    switch (name) {
      // ── Producer Administration Notifications ─────────────────────
      case "producer:admin-notification": {
        if (!ADMIN_EMAIL) throw new Error("Crucial operational environment variable 'ADMIN_EMAIL' is missing.");

        // Safe evaluation format bypasses parsing bugs perfectly
        const html = adminProducerNotificationTemplate({
          ...data,
          adminBaseUrl: ADMIN_BASE_URL,
        });

        await mailService.sendMail(
          ADMIN_EMAIL,
          `New Producer Application — ${data.producerName || "Draft Account"}`,
          `New producer registration request from ${data.producerName || "Applicant"} (${data.email || "No Email"}). Review profile immediately inside administrative workspace panels.`,
          html
        );
        break;
      }

      // ── Producer Moderation Lifecycle Status Updates ──────────────
      case "producer:approval": {
        await mailService.sendProducerApprovalMail(data.to, data.producerName);
        break;
      }

      case "producer:rejection": {
        await mailService.sendProducerRejectedMail(data.to, data.producerName);
        break;
      }

      case "producer:info-needed": {
        await mailService.sendInfoNeededMail(data.to, data.producerName);
        break;
      }

      // ── Social & Interaction Communications ───────────────────────
      case "user:friend-recommendation": {
        await mailService.sendFriendRecommendationMail(
          data.to,
          data.friendName,
          {
            movieTitle: data.movieTitle,
            movieUrl: data.movieUrl,
            senderName: data.senderName,
          }
        );
        break;
      }

      case "user:watchalong": {
        // FIXED: Added full metadata payload parameters mapping to populate live room values inside user invites
        await mailService.sendWatchalongMail(data.to, data.friendName, {
          senderName: data.senderName,
          movieTitle: data.movieTitle,
          dateTime: data.dateTime,
          joinUrl: data.joinUrl,
        });
        break;
      }

      // ── Automated Recommendation Discovery Engine ─────────────────
      case "user:system-recommendation": {
        // FIXED: Mapped data payload block parameters directly into the service layer signature to dynamically render picked items 
        await mailService.sendSystemRecommendationMail(data.to, data.user_name, {
          movies: data.movies
        });
        break;
      }

      default:
        console.warn(`⚠️ [MailWorker Unresolved Action] Unknown incoming task string registration type: "${name}". Skipping.`);
    }

    console.log(`✅ [MailWorker Completed] Job "${name}" (ID: ${job.id}) executed successfully.`);
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 concurrent email delivery streams concurrently per worker thread
  }
);

// ── Worker Monitoring Telemetry Listeners ──────────────────────────
worker.on("failed", (job, err) => {
  console.error(
    `❌ [MailWorker Process Exception Failure] Job "${job?.name}" (ID: ${job?.id}) dropped on attempt ${job?.attemptsMade}. Cause: ${err.message}`
  );
});

worker.on("error", (err) => {
  console.error(`❌ [MailWorker Cluster Fatal Exception] Shared socket state error: ${err.message}`);
});

console.log("⚡ [Flixora Task Core] Mail worker cluster connected to Redis and standing by for job streams...");

export default worker;