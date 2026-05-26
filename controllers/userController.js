import { PendingProducerPayment } from "../models/pendingProducerPayment.js";
import { User } from "../models/User.js";
import { Producer } from "../models/producer.js";
import { generateRandomCreds, hashData } from "../utils/generator.js";
import { enqueueProducerAdminNotification } from "../utils/worker/mailQueue.js";

export const becomeProducer = async (req, res) => {
  try {
    const { stripeSessionId, ...rest } = req.body;

    if (!stripeSessionId) {
      return res.status(400).json({ message: "stripeSessionId is required" });
    }

    const payment = await PendingProducerPayment.findOne({
      stripeSessionId,
      status: "paid",
    });

    if (!payment) {
      return res.status(403).json({
        message:
          "Valid verified producer subscription not found. Please complete subscription step first.",
      });
    }

    if (payment.expiresAt < new Date()) {
      return res.status(410).json({
        message:
          "This subscription session has expired. Please subscribe again.",
      });
    }

    if (payment.status === "form_submitted") {
      return res.status(400).json({
        message:
          "This subscription has already been used to create a producer account.",
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

    const normalizedEmail = email.trim().toLowerCase();

    const generatedCreds = generateRandomCreds(fullName);
    const hashedPassword = await hashData(generatedCreds.tempPassword);

    const user = new User({
      fullname: fullName,
      username: generatedCreds.temp_username,
      email: normalizedEmail,
      password: hashedPassword,
      isProducer: true,
      age,
      subscriptionPlan: "producer",
      isSubscribed: true,
      subscriptionStatus: "active",
      subscriptionType: "premium",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      defaultProfile: {
        fullname: fullName,
        email: normalizedEmail,
        username: generatedCreds.temp_username,
        age,
      },
      defaultPasswordHash: hashedPassword,
    });

    await user.save();

    const producer = new Producer({
      user: user._id,
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
    });

    await producer.save();

    payment.status = "form_submitted";
    payment.userId = user._id;
    payment.producerId = producer._id;
    await payment.save();

    //Enqueue admin notification
    await enqueueProducerAdminNotification({
      producerName: fullName,
      producerId: producer._id.toString(),
      userId: user._id.toString(),
      email: normalizedEmail,
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
    });

    res.status(201).json({
      success: true,
      message: "Producer account created successfully.",
      credentials: {
        username: generatedCreds.temp_username,
        password: generatedCreds.tempPassword,
      },
      userId: user._id,
      producerId: producer._id,
    });
  } catch (error) {
    console.error("Become Producer Error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        message: "User with this email or username already exists.",
      });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};
