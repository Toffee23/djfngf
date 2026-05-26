import { Producer } from "../models/producer.js";
import { User } from "../models/User.js"; // Ensure model is pre-loaded for populate to work cleanly
import {
  enqueueProducerApproval,
  enqueueProducerRejection,
  enqueueInfoNeeded,
} from "../utils/worker/mailQueue.js";

// PATCH /api/admin/producers/:id/approve
export const approveProducer = async (req, res) => {
  try {
    const producer = await Producer.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true },
    ).populate("user", "email fullname");

    if (!producer) {
      return res.status(404).json({ message: "Producer not found" });
    }

    // Defensive Check: Prevent crashes if populate failed to resolve user string
    if (!producer.user) {
      return res.status(400).json({ 
        message: "Producer found, but associated user relation is missing or misconfigured.",
        producer 
      });
    }

    // Enqueue approval email to producer (non-blocking)
    await enqueueProducerApproval({
      to: producer.user.email,
      producerName: producer.user.fullname || "Producer",
    });

    return res.json({ message: "Producer approved and notified.", producer });
  } catch (err) {
    console.error("Approve Producer Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/admin/producers/:id/reject
export const rejectProducer = async (req, res) => {
  try {
    const producer = await Producer.findByIdAndUpdate(
      req.params.id,
      { isVerified: false },
      { new: true },
    ).populate("user", "email fullname");

    if (!producer) {
      return res.status(404).json({ message: "Producer not found" });
    }

    // Defensive Check: Prevent crashes if populate failed to resolve user string
    if (!producer.user) {
      return res.status(400).json({ 
        message: "Producer found, but associated user relation is missing or misconfigured.",
        producer 
      });
    }

    // Enqueue rejection email to producer (non-blocking)
    await enqueueProducerRejection({
      to: producer.user.email,
      producerName: producer.user.fullname || "Producer",
    });

    return res.json({ message: "Producer rejected and notified.", producer });
  } catch (err) {
    console.error("Reject Producer Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/admin/producers/:id/info-needed
export const requestMoreInfo = async (req, res) => {
  try {
    const producer = await Producer.findById(req.params.id).populate(
      "user",
      "email fullname",
    );

    if (!producer) {
      return res.status(404).json({ message: "Producer not found" });
    }

    // Defensive Check: Prevent crashes if populate failed to resolve user string
    if (!producer.user) {
      return res.status(400).json({ 
        message: "Producer found, but associated user relation is missing or misconfigured." 
      });
    }

    await enqueueInfoNeeded({
      to: producer.user.email,
      producerName: producer.user.fullname || "Producer",
    });

    return res.json({ message: "Info-needed email queued for producer." });
  } catch (err) {
    console.error("Request Info Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};