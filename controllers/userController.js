import { PendingProducerPayment } from "../models/pendingProducerPayment.js";
import { User } from "../models/User.js";
import { Producer } from "../models/producer.js";
import { generateRandomCreds, hashData } from "../utils/generator.js";
import { enqueueProducerAdminNotification } from "../utils/worker/mailQueue.js";

// POST /api/users/become-producer
export const becomeProducer = async (req, res) => {
  try {
    const { stripeSessionId, ...rest } = req.body;

    if (!stripeSessionId || !stripeSessionId.trim()) {
      return res.status(400).json({ message: "stripeSessionId identifier is required" });
    }

    // Query purely by the checkout token to avoid logical condition overlaps
    const payment = await PendingProducerPayment.findOne({ stripeSessionId: stripeSessionId.trim() });

    if (!payment) {
      return res.status(403).json({
        message: "Valid producer subscription records not found. Complete your subscription parameters first.",
      });
    }

    // Explicitly trace state flags in chronological order
    if (payment.status === "form_submitted") {
      return res.status(400).json({
        message: "This specific payment instance has already been used to provision a creator producer account.",
      });
    }

    if (payment.expiresAt < new Date()) {
      return res.status(410).json({
        message: "This transactional onboarding session has expired bounds. Re-initiate subscription.",
      });
    }

    const {
      email,
      fullName,
      productionName,
      countryOfResidence,
      prodCountry,
      existingApplication,
      campaignSource,
      bio,
      prodDesc,
      budget,
      intendedProfit,
      promoteIntent,
      whyUs,
      others,
      age = 18,
    } = rest;

    // Enforce robust parameter protection to insulate against null method invocations
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "A valid email parameters identifier is required." });
    }
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: "Full name parameter is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const sanitizedFullName = fullName.trim();

    const generatedCreds = generateRandomCreds(sanitizedFullName);
    
    // Ensure the generator didn't fail to form structural username parts
    const tentativeUsername = generatedCreds.temp_username || generatedCreds.username || `producer_${Date.now()}`;
    const hashedPassword = await hashData(generatedCreds.tempPassword);

    const user = new User({
      fullname: sanitizedFullName,
      username: tentativeUsername,
      email: normalizedEmail,
      password: hashedPassword,
      isProducer: true,
      age: parseInt(age, 10) || 18,
      subscriptionPlan: "producer",
      isSubscribed: true,
      subscriptionStatus: "active",
      subscriptionType: "premium",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      defaultProfile: {
        fullname: sanitizedFullName,
        email: normalizedEmail,
        username: tentativeUsername,
        age: parseInt(age, 10) || 18,
      },
      defaultPasswordHash: hashedPassword,
    });

    await user.save();

    const producer = new Producer({
      user: user._id,
      productionName: productionName ? productionName.trim() : "Independent Content Creator",
      countryOfResidence,
      prodCountry,
      existingApplication,
      campaignSource,
      bio,
      prodDesc,
      budget,
      intendedProfit,
      promoteIntent,
      whyUs,
      others,
    });

    await producer.save();

    // Mutate state attributes flags safely
    payment.status = "form_submitted";
    payment.userId = user._id;
    payment.producerId = producer._id;
    await payment.save();

    // Enqueue admin notifications background tasks (will execute once workers are active)
    try {
      await enqueueProducerAdminNotification({
        producerName: sanitizedFullName,
        producerId: producer._id.toString(),
        userId: user._id.toString(),
        email: normalizedEmail,
        productionName: producer.productionName,
        countryOfResidence,
        prodCountry,
        existingApplication,
        campaignSource,
        bio,
        prodDesc,
        budget,
        intendedProfit,
        promoteIntent,
        whyUs,
        others,
      });
    } catch (workerErr) {
      console.warn("Background notification worker injection bypassed:", workerErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Producer profile workspace account created successfully.",
      credentials: {
        username: tentativeUsername,
        password: generatedCreds.tempPassword,
      },
      userId: user._id,
      producerId: producer._id,
    });
  } catch (error) {
    console.error("Become Producer System Core Error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        message: "Unique indexing validation conflict. A user profile with this email or username already exists in system records.",
      });
    }

    return res.status(500).json({ message: "Internal server structural processing breakdown error." });
  }
};