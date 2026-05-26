import axios from "axios";
import { User } from "../models/User.js";
import crypto from "crypto";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://new-prim-pit-roan.vercel.app";

// POST /api/paystack/premium-subscription
export const cardPayment = async (req, res) => {
  try {
    // Hydrate user from database to prevent obsolete token memory blocks
    const dbUser = await User.findById(req.user.id);
    if (!dbUser) return res.status(404).json({ message: "User account not found." });

    if (dbUser.isSubscribed && dbUser.subscriptionType === "premium") {
      return res.status(400).json({ message: "Already a premium user" });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: dbUser.email,
        amount: 2000 * 100, // Amount in kobo
        channels: ["card"],
        callback_url: `${BACKEND_URL}/api/paystack/verify`,
        metadata: {
          userId: dbUser._id.toString(),
          purpose: "premium-subscription",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    return res.json({
      paymentUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (err) {
    console.error("Card Payment Init Core Error:", err.response?.data || err);
    return res.status(500).json({ message: "Card payment initialization failed." });
  }
};

// POST /api/paystack/basic-subscription
export const bankPayment = async (req, res) => {
  try {
    const dbUser = await User.findById(req.user.id);
    if (!dbUser) return res.status(404).json({ message: "User account not found." });

    if (dbUser.isSubscribed && dbUser.subscriptionType === "premium") {
      return res.status(403).json({
        message: "User already has a higher tier subscription active.",
      });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: dbUser.email,
        amount: 500 * 100,
        channels: ["bank"],
        callback_url: `${BACKEND_URL}/api/paystack/verify`,
        metadata: {
          userId: dbUser._id.toString(),
          purpose: "basic-subscription",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    return res.json({
      paymentUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (err) {
    console.error("Bank Payment Init Core Error:", err.response?.data || err);
    return res.status(500).json({ message: "Bank payment initialization failed." });
  }
};

// POST /api/paystack/game-access
export const bankPaymentForGameAccess = async (req, res) => {
  try {
    const dbUser = await User.findById(req.user.id);
    if (!dbUser) return res.status(404).json({ message: "User account not found." });

    if (dbUser.subscriptionType === "premium") {
      return res.status(403).json({ message: "Premium users don't need to pay for game entries." });
    }

    if (dbUser.hasGameAccess) {
      return res.status(400).json({ message: "User already has an active game session token." });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: dbUser.email,
        amount: 100 * 100,
        channels: ["bank"],
        callback_url: `${BACKEND_URL}/api/paystack/verify`,
        metadata: {
          userId: dbUser._id.toString(),
          purpose: "game-access",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    return res.json({
      paymentUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (err) {
    console.error("Game Payment Init Core Error:", err.response?.data || err);
    return res.status(500).json({ message: "₦100 Game Access payment failed" });
  }
};

// GET /api/paystack/verify
export const verifyPayment = async (req, res) => {
  const reference = req.query.reference;

  if (!reference) {
    return res.redirect(`${FRONTEND_URL}/payment-failed?error=No reference provided`);
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const paymentData = response.data.data;

    if (paymentData.status !== "success") {
      return res.redirect(`${FRONTEND_URL}/payment-failed?error=Payment not successful`);
    }

    const email = paymentData.customer.email;
    const purpose = paymentData.metadata?.purpose;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect(`${FRONTEND_URL}/payment-failed?error=User account profile mapping not found`);
    }

    // Process provisions strictly tied via metadata criteria mappings
    if (purpose === "premium-subscription" || (!purpose && paymentData.amount / 100 === 2000)) {
      user.isSubscribed = true;
      user.subscriptionType = "premium";
      user.hasGameAccess = true;
      user.subscriptionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await user.save();
      return res.redirect(`${FRONTEND_URL}/payment-success?email=${email}`);
    }

    if (purpose === "basic-subscription" || (!purpose && paymentData.amount / 100 === 500)) {
      user.isSubscribed = true;
      user.subscriptionType = "basic";
      user.hasGameAccess = false;
      user.subscriptionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await user.save();
      return res.redirect(`${FRONTEND_URL}/payment-success?email=${email}`);
    }

    if (purpose === "game-access" || (!purpose && paymentData.amount / 100 === 100)) {
      if (user.subscriptionType === "basic") {
        user.hasGameAccess = true;
        await user.save();
        return res.redirect(`${FRONTEND_URL}/successful-payment?email=${email}`); // Fixed spelling typo bug
      } else {
        return res.redirect(`${FRONTEND_URL}/payment-failed?error=Invalid subscription tier level context for game access`);
      }
    }

    return res.redirect(`${FRONTEND_URL}/payment-failed?error=Unmapped allocation context payload limits`);
  } catch (error) {
    console.error("Payment verification core crash:", error.response?.data || error.message);
    return res.redirect(`${FRONTEND_URL}/payment-failed?error=Payment verification internal error`);
  }
};

// POST /api/paystack/webhook
export const verifyWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("Invalid signature payload hash mismatch.");
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const paymentData = event.data;
      const email = paymentData.customer.email;
      const amount = paymentData.amount / 100;
      const purpose = paymentData.metadata?.purpose;

      const user = await User.findOne({ email });
      if (!user) return res.status(200).send("User profile context missing from db collections.");

      if (purpose === "premium-subscription" || amount === 2000) {
        user.isSubscribed = true;
        user.subscriptionType = "premium";
        user.hasGameAccess = true;
        user.subscriptionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      } else if (purpose === "basic-subscription" || amount === 500) {
        user.isSubscribed = true;
        user.subscriptionType = "basic";
        user.hasGameAccess = false;
        user.subscriptionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      } else if ((purpose === "game-access" || amount === 100) && user.subscriptionType === "basic") {
        user.hasGameAccess = true;
      }

      await user.save();
    }

    return res.status(200).send("Webhook structural execution processed successfully.");
  } catch (err) {
    console.error("Paystack Webhook Background Processing Error:", err);
    return res.status(500).send("Internal processing event fault block.");
  }
};