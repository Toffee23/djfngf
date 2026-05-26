import Stripe from "stripe";
import { User } from "../models/User.js";
import { Movie } from "../models/movies.js";
import { MovieAccess } from "../models/movieAccess.js";
import { Earning } from "../models/earning.js";
import { PendingProducerPayment } from "../models/pendingProducerPayment.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || "https://new-prim-pit-roan.vercel.app";

const createCustomerIfNeeded = async (user) => {
  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user._id.toString() },
    });
    user.stripeCustomerId = customer.id;
    await user.save();
  }
  return user.stripeCustomerId;
};

// POST /api/stripe/subscribe/premium
export const subscribePremium = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User account profile not found." });

    await createCustomerIfNeeded(user);

    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        { price: process.env.STRIPE_PRICE_PREMIUM_MONTHLY, quantity: 1 },
      ],
      success_url: `${FRONTEND_URL}/payment-success?plan=premium&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pricing`,
      subscription_data: {
        metadata: { userId: user._id.toString(), plan: "premium" },
      },
      metadata: { userId: user._id.toString(), plan: "premium" },
    });

    return res.json({ paymentUrl: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Premium subscription error:", err);
    return res.status(500).json({ message: "Failed to create premium subscription" });
  }
};

// POST /api/stripe/producer/subscribe
export const createProducerSubscription = async (req, res) => {
  try {
    const { email, fullName } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ message: "Email and fullName fields are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await PendingProducerPayment.findOne({
      email: normalizedEmail,
      status: { $in: ["paid", "form_submitted"] },
      expiresAt: { $gt: new Date() },
    });

    if (existing) {
      return res.status(400).json({
        message: "A verified producer subscription session already exists for this email",
        sessionId: existing.stripeSessionId,
      });
    }

    let customer;
    const existingCustomers = await stripe.customers.list({
      email: normalizedEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: normalizedEmail,
        name: fullName.trim(),
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        { price: process.env.STRIPE_PRICE_PRODUCER_MONTHLY, quantity: 1 },
      ],
      success_url: `${FRONTEND_URL}/become-producer?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pricing`,
      subscription_data: {
        metadata: { email: normalizedEmail, fullName: fullName.trim(), plan: "producer" },
      },
      metadata: {
        email: normalizedEmail,
        fullName: fullName.trim(),
        plan: "producer",
      },
    });

    await PendingProducerPayment.create({
      stripeSessionId: session.id,
      email: normalizedEmail,
      fullName: fullName.trim(),
      amountPaid: 0,
      status: "pending", // Fixed: set to pending until webhook checkout session completes
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return res.status(200).json({
      success: true,
      paymentUrl: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("Producer checkout error:", err);
    return res.status(500).json({
      message: "Failed to initiate producer subscription checkout",
      error: err.message,
    });
  }
};

// POST /api/stripe/pay
export const initiatePayment = async (req, res) => {
  try {
    const { type, movieId } = req.body;
    if (type !== "movie") {
      return res.status(400).json({ message: "Invalid payment type specification" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie || !movie.isPublished || !movie.approvedByAdmin) {
      return res.status(404).json({ message: "Movie asset entry record not found" });
    }

    if (req.user?.id) {
      const existingAccess = await MovieAccess.findOne({
        user: req.user.id,
        movie: movie._id,
      });

      if (existingAccess) {
        return res.status(400).json({ message: "You already have streaming access to this movie" });
      }
    }

    const isGuest = !req.user;
    const sessionMetadata = {
      movieId: movie._id.toString(),
      purpose: "movie-purchase",
      isGuest: String(isGuest),
      userId: isGuest ? "anonymous" : req.user.id.toString(),
    };

    const sessionPayload = {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(movie.price * 100),
            product_data: {
              name: movie.title,
              images: movie.posterImage ? [movie.posterImage] : [],
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${FRONTEND_URL}/watch/${movie._id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/movies/${movie._id}`,
      metadata: sessionMetadata,
    };

    if (!isGuest) {
      const user = await User.findById(req.user.id);
      if (user && user.stripeCustomerId) {
        sessionPayload.customer = user.stripeCustomerId;
      }
    }

    const session = await stripe.checkout.sessions.create(sessionPayload);
    return res.json({ paymentUrl: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Initiate payment error:", err);
    return res.status(500).json({ message: "Failed to initiate payment layer" });
  }
};

// GET /api/stripe/producer-payment/verify
export const verifyProducerPayment = async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId parameter is required" });
    }

    const record = await PendingProducerPayment.findOne({ stripeSessionId: sessionId });

    if (!record) {
      return res.status(404).json({ message: "No transaction ledger found for this session" });
    }

    if (record.status === "form_submitted") {
      return res.status(400).json({ message: "Application sequence already completed for this instance" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(410).json({ message: "Payment session window closed expired bounds." });
    }

    return res.json({
      verified: true,
      email: record.email,
      fullName: record.fullName,
      sessionId: record.stripeSessionId,
      status: record.status
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    return res.status(500).json({ message: "Verification engine exception thrown", error: err.message });
  }
};

// POST /api/stripe/connect/onboard
export const createConnectAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (!user.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: { transfers: { requested: true } },
      });
      user.stripeAccountId = account.id;
      await user.save();
    }

    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${FRONTEND_URL}/producer/earnings?reauth=true`,
      return_url: `${FRONTEND_URL}/producer/earnings?connected=true`,
      type: "account_onboarding",
    });

    return res.json({ onboardingUrl: accountLink.url });
  } catch (err) {
    console.error("Connect account error:", err);
    return res.status(500).json({ message: "Failed to create Connect account infrastructure", error: err.message });
  }
};

// GET /api/stripe/movie-access/verify
export const verifyMovieAccess = async (req, res) => {
  try {
    const { sessionId, movieId } = req.query;

    if (!movieId) {
      return res.status(400).json({ message: "movieId parameter requirement missing" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie || !movie.isPublished || !movie.approvedByAdmin) {
      return res.status(404).json({ message: "Target movie item listing down offline" });
    }

    let access = null;

    if (req.user?.id) {
      access = await MovieAccess.findOne({ user: req.user.id, movie: movie._id });
    }

    if (!access && sessionId) {
      access = await MovieAccess.findOne({ stripeSessionId: sessionId, movie: movie._id });

      if (!access) {
        try {
          const session = await stripe.checkout.sessions.retrieve(sessionId);

          const isPaid =
            session.payment_status === "paid" &&
            session.metadata?.purpose === "movie-purchase" &&
            session.metadata?.movieId === movie._id.toString();

          if (isPaid) {
            const guestEmail = session.customer_details?.email?.toLowerCase().trim() || null;

            access = await MovieAccess.findOneAndUpdate(
              { stripeSessionId: sessionId, movie: movie._id },
              {
                $setOnInsert: {
                  user: session.metadata?.userId === "anonymous" ? null : session.metadata?.userId,
                  guestEmail,
                  movie: movie._id,
                  paidAmount: movie.price,
                  stripeSessionId: sessionId,
                  grantedAt: new Date(),
                },
              },
              { upsert: true, new: true },
            );
          }
        } catch (stripeErr) {
          console.error("Stripe fallback retrieval structural breakdown:", stripeErr.message);
        }
      }
    }

    if (!access) {
      return res.status(403).json({ message: "Access not granted. Subscription entry authorization block." });
    }

    return res.json({
      granted: true,
      movie: {
        ...movie.toObject(),
        videoUrl: movie.videoUrl || movie.streamUrl || movie.fileUrl || null,
      }
    });
  } catch (err) {
    console.error("Verify movie access error:", err);
    return res.status(500).json({ message: "Verification system crash bounds", error: err.message });
  }
};

// POST /api/stripe/connect/payout
export const payoutToProducer = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.stripeAccountId) {
      return res.status(400).json({
        message: "Complete Stripe Connect interface link setups before routing fund channels.",
      });
    }

    const unwithdrawnEarnings = await Earning.find({ producer: user._id, withdrawn: false });
    const availableBalance = unwithdrawnEarnings.reduce((sum, e) => sum + e.netAmount, 0);

    const sanitizedBalance = parseFloat(availableBalance.toFixed(2));
    if (sanitizedBalance <= 0) {
      return res.status(400).json({ message: "Available ledger balance limits zero bounds" });
    }

    const transfer = await stripe.transfers.create({
      amount: Math.round(sanitizedBalance * 100),
      currency: "usd",
      destination: user.stripeAccountId,
      description: `Payout processing loop execution targeting creator account identifier: ${user.username}`,
    });

    await Earning.updateMany(
      { _id: { $in: unwithdrawnEarnings.map((e) => e._id) } },
      { $set: { withdrawn: true } },
    );

    return res.status(201).json({
      message: "Payout processed via express channels successfully.",
      amount: sanitizedBalance,
      stripeTransferId: transfer.id,
    });
  } catch (err) {
    console.error("Payout system core exception:", err);
    return res.status(500).json({ message: "Failed to complete payout channel distribution.", error: err.message });
  }
};

// POST /api/stripe/webhook
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Construct event ensuring raw request body formats are evaluated cleanly
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Validation Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);

        // Look up both line metadata elements and ancestral customer configurations safely
        const userIdFromMeta = subscription.metadata?.userId || invoice.subscription_details?.metadata?.userId;
        const planFromMeta = subscription.metadata?.plan || invoice.subscription_details?.metadata?.plan;

        let user = userIdFromMeta ? await User.findById(userIdFromMeta) : null;

        if (user) {
          user.stripeSubscriptionId = subscription.id;
          user.isSubscribed = true;
          user.subscriptionStatus = "active";
          user.subscriptionType = planFromMeta === "premium" ? "premium" : "producer";

          if (subscription.current_period_end) {
            user.subscriptionExpires = new Date(subscription.current_period_end * 1000);
          }

          if (user.subscriptionType === "producer") {
            user.isProducer = true;
          }

          await user.save();
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object;

        if (session.metadata?.plan === "producer") {
          await PendingProducerPayment.findOneAndUpdate(
            { stripeSessionId: session.id },
            {
              $set: {
                status: "paid",
                amountPaid: (session.amount_total ?? 0) / 100,
              },
            },
          );
          break;
        }

        if (session.metadata?.purpose === "movie-purchase") {
          const { userId, movieId, isGuest } = session.metadata;
          const movie = await Movie.findById(movieId);
          if (!movie) break;

          if (isGuest === "true") {
            await MovieAccess.create({
              guestEmail: session.customer_details?.email?.toLowerCase().trim(),
              movie: movie._id,
              paidAmount: movie.price,
              stripeSessionId: session.id,
              grantedAt: new Date(),
            });
          } else {
            await MovieAccess.findOneAndUpdate(
              { user: userId, movie: movieId },
              {
                $setOnInsert: {
                  user: userId,
                  movie: movieId,
                  paidAmount: movie.price,
                  stripeSessionId: session.id,
                  grantedAt: new Date(),
                },
              },
              { upsert: true, new: true },
            );
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const user = await User.findOne({ stripeSubscriptionId: subscription.id });
        
        if (user) {
          user.subscriptionStatus = subscription.status;
          if (subscription.current_period_end) {
            user.subscriptionExpires = new Date(subscription.current_period_end * 1000);
          }

          if (["canceled", "unpaid", "incomplete_expired"].includes(subscription.status)) {
            user.isSubscribed = false;
            user.subscriptionStatus = "inactive";
            // Retain historical creator flag settings to protect underlying content assets ownership
          }

          await user.save();
        }
        break;
      }
    }
  } catch (err) {
    console.error("Critical Background Webhook Async Processor Crash Exception:", err);
  }

  return res.status(200).json({ received: true });
};