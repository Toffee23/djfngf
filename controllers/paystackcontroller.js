import "dotenv/config";
import axios from "axios";
import { User } from "../models/User.js";
import crypto from "crypto";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

//create a payment
// This function initializes a payment with Paystack and returns the payment URL and reference.
// POST /api/payments/premium-subscription
export const cardPayment = async (req, res) => {
  try {
    const user = req.user;

    if (user.isSubscribed && user.subscriptionType === "premium") {
      return res.status(400).json({ message: "Already a premium user" });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: 2000 * 100,
        channels: ["card"],
        callback_url: `${BACKEND_URL}/api/paystack/verify`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
    res.json({
      paymentUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ message: "Card payment initialization failed." });
  }
};

export const bankPayment = async (req, res) => {
  try {
    const user = req.user; // From token

    if (user.isSubscribed === true || user.subscriptionType === "premium") {
      return res.status(403).json({
        message: "User already subscribed. ₦500 payment not required.",
      });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: 500 * 100,
        channels: ["bank"],
        callback_url: `${BACKEND_URL}/api/paystack/verify`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    res.json({
      paymentUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ message: "Bank payment initialization failed." });
  }
};

export const bankPaymentForGameAccess = async (req, res) => {
  try {
    const user = req.user; // From token

    if (user.subscriptionType === "premium") {
      return res
        .status(403)
        .json({ message: "Premium users don't need to pay." });
    }

    if (user.hasGameAccess) {
      return res.status(400).json({ message: "User already has game access" });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: 100 * 100,
        channels: ["bank"],
        callback_url: `${BACKEND_URL}/api/paystack/verify`,
        metadata: {
          userId: user._id.toString(),
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

    res.json({
      paymentUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ message: "₦100 Game Access payment failed" });
  }
};

// GET /api/paystack/verify?reference=...
export const verifyPayment = async (req, res) => {
  const reference = req.query.reference;

  if (!reference) {
    return res.redirect(
      `${FRONTEND_URL}/payment-failed?error=No reference provided`,
    );
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
      return res.redirect(
        `${FRONTEND_URL}/payment-failed?error=Payment not successful`,
      );
    }

    const email = paymentData.customer.email;
    const amount = paymentData.amount / 100; // Convert from kobo to naira
    const user = await User.findOne({ email });

    if (!user) {
      return res.redirect(
        `${FRONTEND_URL}/payment-failed?error=User not found`,
      );
    }

    if (amount === 2000) {
      user.isSubscribed = true;
      user.subscriptionType = "premium";
      user.hasGameAccess = true;
      user.subscriptionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await user.save();

      return res.redirect(`${FRONTEND_URL}/payment-success?email=${email}`);
    }

    if (amount === 500) {
      user.isSubscribed = true;
      user.subscriptionType = "basic";
      user.hasGameAccess = false;
      user.subscriptionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await user.save();

      return res.redirect(`${FRONTEND_URL}/payment-success?email=${email}`);
    }

    if (amount === 100) {
      if (user.subscriptionType === "basic") {
        user.hasGameAccess = true;
        await user.save();
        return res.redirect(
          `${FRONTEND_URL}/suceessful-payment?email=${email}`,
        );
      } else {
        return res.redirect(
          `${FRONTEND_URL}/payment-failed?error=Invalid user for game access`,
        );
      }
    }

    return res.redirect(
      `${FRONTEND_URL}/payment-failed?error=Unknown payment amount`,
    );
  } catch (error) {
    console.error(
      "Payment verification failed:",
      error.response?.data || error.message,
    );
    return res.redirect(
      `${FRONTEND_URL}/payment-failed?error=Payment verification failed`,
    );
  }
};
// POST /api/paystack/webhook
export const verifyWebhook = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const paymentData = event.data;
    const email = paymentData.customer.email;
    const amount = paymentData.amount / 100;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(200).send("User not found, but webhook received");

    if (amount === 2000) {
      user.isSubscribed = true;
      user.subscriptionType = "premium";
      user.hasGameAccess = true;
      user.subscriptionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (amount === 500) {
      user.isSubscribed = true;
      user.subscriptionType = "basic";
      user.hasGameAccess = false;
      user.subscriptionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (amount === 100 && user.subscriptionType === "basic") {
      user.hasGameAccess = true;
    }

    await user.save();
  }

  res.status(200).send("Webhook handled");
};
