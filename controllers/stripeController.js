import Stripe from "stripe";
import { User } from "../models/User.js";
import { Movie } from "../models/movies.js";
import { MovieAccess } from "../models/movieAccess.js";
import { Earning } from "../models/earning.js";
import { PendingProducerPayment } from "../models/pendingProducerPayment.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

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

// ====================== FLOW 3: PREMIUM SUBSCRIPTION ($5/mo) ======================
export const subscribePremium = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    await createCustomerIfNeeded(user);

    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        { price: process.env.STRIPE_PRICE_PREMIUM_MONTHLY, quantity: 1 },
      ],
      success_url: `${FRONTEND_URL}/payment-success?plan=premium`,
      cancel_url: `${FRONTEND_URL}/pricing`,
      subscription_data: {
        metadata: { userId: user._id.toString(), plan: "premium" },
      },
      metadata: { userId: user._id.toString(), plan: "premium" },
    });

    res.json({ paymentUrl: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Premium subscription error:", err);
    res.status(500).json({ message: "Failed to create premium subscription" });
  }
};

// export const createProducerSubscription = async (req, res) => {
//   try {
//     const { email, fullName, paymentMethodId } = req.body;

//     if (!email || !fullName || !paymentMethodId) {
//       return res.status(400).json({
//         message: "email, fullName, and paymentMethodId are required",
//       });
//     }

//     const normalizedEmail = email.trim().toLowerCase();

//     // Prevent duplicate active subscription records
//     const existing = await PendingProducerPayment.findOne({
//       email: normalizedEmail,
//       status: { $in: ["paid", "form_submitted"] },
//       expiresAt: { $gt: new Date() },
//     });

//     if (existing) {
//       return res.status(400).json({
//         message:
//           "A verified producer subscription session already exists for this email",
//         sessionId: existing.stripeSessionId,
//       });
//     }

//     // Check if the input token is a Postman source token or modern frontend element token
//     const isSourceToken = paymentMethodId.startsWith("tok_");

//     const customerPayload = {
//       email: normalizedEmail,
//       name: fullName.trim(),
//     };

//     if (!isSourceToken) {
//       // FIX: Use the root-level payment_method attribute!
//       // This forces Stripe to link ownership before finalizing setup.
//       customerPayload.payment_method = paymentMethodId;
//       customerPayload.invoice_settings = {
//         default_payment_method: paymentMethodId,
//       };
//     } else {
//       // Legacy source string handling for fallback testing patterns
//       customerPayload.source = paymentMethodId;
//     }

//     // 1. Create the customer safely without race conditions
//     const customer = await stripe.customers.create(customerPayload);

//     // 2. Build the subscription tracking model rules
//     const subscriptionPayload = {
//       customer: customer.id,
//       items: [{ price: process.env.STRIPE_PRICE_PRODUCER_MONTHLY }],
//       payment_behavior: "default_incomplete",
//       payment_settings: {
//         save_default_payment_method: "on_subscription",
//       },
//       expand: ["latest_invoice.payment_intent"],
//     };

//     if (!isSourceToken) {
//       subscriptionPayload.default_payment_method = paymentMethodId;
//     } else if (customer.default_source) {
//       subscriptionPayload.default_source = customer.default_source;
//     }

//     // 3. Complete the initialization process
//     const subscription = await stripe.subscriptions.create(subscriptionPayload);

//     const paymentIntent = subscription.latest_invoice?.payment_intent;
//     const amountPaid = subscription.latest_invoice?.amount_paid ?? 0;

//     const pending = await PendingProducerPayment.create({
//       stripeSessionId: subscription.id,
//       email: normalizedEmail,
//       fullName: fullName.trim(),
//       amountPaid: amountPaid / 100 || 0,
//       status: "paid",
//       expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//     });

//     res.status(200).json({
//       success: true,
//       subscriptionId: subscription.id,
//       clientSecret: paymentIntent?.client_secret,
//       pendingId: pending._id,
//       message: "Producer subscription created successfully.",
//     });
//   } catch (err) {
//     console.error("Producer subscription error:", err);
//     res.status(500).json({
//       message: "Failed to create producer subscription",
//       error: err.message,
//     });
//   }
// };
// ====================== FLOW 1: PRODUCER SUBSCRIPTION ($100/mo via CHECKOUT) ======================
export const createProducerSubscription = async (req, res) => {
  try {
    const { email, fullName } = req.body; // Look! No paymentMethodId needed anymore!

    if (!email || !fullName) {
      return res.status(400).json({
        message: "email and fullName are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Prevent duplicate active registration sessions
    const existing = await PendingProducerPayment.findOne({
      email: normalizedEmail,
      status: { $in: ["paid", "form_submitted"] },
      expiresAt: { $gt: new Date() },
    });

    if (existing) {
      return res.status(400).json({
        message:
          "A verified producer subscription session already exists for this email",
        sessionId: existing.stripeSessionId,
      });
    }

    // 1. Create a customer or retrieve one if they exist by email
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

    // 2. Launch a hosted Checkout Session just like the premium plan
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        { price: process.env.STRIPE_PRICE_PRODUCER_MONTHLY, quantity: 1 },
      ],
      // Redirect back to your frontend verification wizard after successful payment
      success_url: `${FRONTEND_URL}/become-producer?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pricing`,
      metadata: {
        email: normalizedEmail,
        fullName: fullName.trim(),
        plan: "producer",
      },
    });

    // 3. Pre-create the local tracking draft (Using Checkout Session ID instead)
    await PendingProducerPayment.create({
      stripeSessionId: session.id,
      email: normalizedEmail,
      fullName: fullName.trim(),
      amountPaid: 0,
      status: "paid",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Send the payment link back to your application client
    res.status(200).json({
      success: true,
      paymentUrl: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("Producer checkout error:", err);
    res.status(500).json({
      message: "Failed to initiate producer subscription checkout",
      error: err.message,
    });
  }
};

// ====================== FLOW 2: ONE-TIME ANONYMOUS MOVIE PURCHASE ======================
export const initiatePayment = async (req, res) => {
  try {
    const { type, movieId } = req.body;
    if (type !== "movie") {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie || !movie.isPublished || !movie.approvedByAdmin) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // Check if authenticated user already has access
    if (req.user?.id) {
      const existingAccess = await MovieAccess.findOne({
        user: req.user.id,
        movie: movie._id,
      });

      if (existingAccess) {
        return res
          .status(400)
          .json({ message: "You already have access to this movie" });
      }
    }

    // Dynamic metadata tracking parameters based on user authentication status
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
      // Anonymous flows receive a unique query token back to easily verify guest rights on the frontend
      success_url: `${FRONTEND_URL}/watch/${movie._id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/movies/${movie._id}`,
      metadata: sessionMetadata,
    };

    // If logged in, safely link the existing Stripe customer ID wrapper
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
    res.status(500).json({ message: "Failed to initiate payment" });
  }
};

// ====================== VERIFY PRODUCER APPLICATION TOKEN ======================
export const verifyProducerPayment = async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const record = await PendingProducerPayment.findOne({
      stripeSessionId: sessionId,
    });

    if (!record) {
      return res
        .status(404)
        .json({ message: "No payment found for this session" });
    }

    if (record.status === "form_submitted") {
      return res
        .status(400)
        .json({ message: "Application already submitted for this payment" });
    }

    if (record.expiresAt < new Date()) {
      return res
        .status(410)
        .json({ message: "Payment session expired. Please subscribe again." });
    }

    res.json({
      verified: true,
      email: record.email,
      fullName: record.fullName,
      sessionId: record.stripeSessionId,
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    res
      .status(500)
      .json({ message: "Verification failed", error: err.message });
  }
};

// ====================== STRIPE CONNECT ======================
export const createConnectAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
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

    res.json({ onboardingUrl: accountLink.url });
  } catch (err) {
    console.error("Connect account error:", err);
    res.status(500).json({
      message: "Failed to create Connect account",
      error: err.message,
    });
  }
};

export const verifyMovieAccess = async (req, res) => {
  try {
    const { sessionId, movieId } = req.query;

    if (!movieId) {
      return res.status(400).json({ message: "movieId is required" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie || !movie.isPublished || !movie.approvedByAdmin) {
      return res.status(404).json({ message: "Movie not found" });
    }

    let access = null;

    if (req.user?.id) {
      access = await MovieAccess.findOne({
        user: req.user.id,
        movie: movie._id,
      });
    }

    if (!access && sessionId) {
      access = await MovieAccess.findOne({
        stripeSessionId: sessionId,
        movie: movie._id,
      });

      if (!access) {
        try {
          const session = await stripe.checkout.sessions.retrieve(sessionId);

          const isPaid =
            session.payment_status === "paid" &&
            session.metadata?.purpose === "movie-purchase" &&
            session.metadata?.movieId === movie._id.toString();

          if (isPaid) {
            const guestEmail =
              session.customer_details?.email?.toLowerCase().trim() || null;

            access = await MovieAccess.findOneAndUpdate(
              { stripeSessionId: sessionId, movie: movie._id },
              {
                $setOnInsert: {
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
          console.error("Stripe session retrieval error:", stripeErr.message);
        }
      }
    }

    if (!access) {
      return res.status(403).json({
        message: "Access not granted. Please complete payment first.",
      });
    }

    return res.json({
      granted: true,
      movie: {
        _id: movie._id,
        title: movie.title,
        synopsis: movie.synopsis,
        posterImage: movie.posterImage,
        backdropImage: movie.backdropImage,
        trailerUrl: movie.trailerUrl,
        runtime: movie.runtime,
        year: movie.year,
        genre: movie.genre,
        ageRating: movie.ageRating,
        cast: movie.cast,
        videoUrl: movie.videoUrl || movie.streamUrl || movie.fileUrl || null,
      },
    });
  } catch (err) {
    console.error("Verify movie access error:", err);
    res
      .status(500)
      .json({ message: "Verification failed", error: err.message });
  }
};

export const payoutToProducer = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.stripeAccountId) {
      return res.status(400).json({
        message:
          "You must complete Stripe Connect onboarding before withdrawing.",
      });
    }

    const unwithdrawnEarnings = await Earning.find({
      producer: user._id,
      withdrawn: false,
    });
    const availableBalance = unwithdrawnEarnings.reduce(
      (sum, e) => sum + e.netAmount,
      0,
    );

    if (availableBalance <= 0) {
      return res
        .status(400)
        .json({ message: "No available balance to withdraw" });
    }

    const transfer = await stripe.transfers.create({
      amount: Math.round(availableBalance * 100),
      currency: "usd",
      destination: user.stripeAccountId,
      description: `Payout to producer ${user.username}`,
    });

    await Earning.updateMany(
      { _id: { $in: unwithdrawnEarnings.map((e) => e._id) } },
      { $set: { withdrawn: true } },
    );

    res.status(201).json({
      message: "Payout sent successfully",
      amount: availableBalance,
      stripeTransferId: transfer.id,
    });
  } catch (err) {
    console.error("Payout error:", err);
    res
      .status(500)
      .json({ message: "Failed to process payout", error: err.message });
  }
};

// ====================== WEBHOOK ENGINE ======================
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  console.log(`Webhook event first step received: ${req.body}`);
  let event;

  try {
    console.log(`Webhook event first step signature received: ${sig}`);
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    console.log("Webhook event received:", JSON.stringify(event));
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription,
        );

        const userIdFromMeta = subscription.metadata?.userId;
        const planFromMeta = subscription.metadata?.plan;

        let user = userIdFromMeta ? await User.findById(userIdFromMeta) : null;

        if (user) {
          user.stripeSubscriptionId = subscription.id;
          user.isSubscribed = true;
          user.subscriptionStatus = "active";

          user.subscriptionPlan =
            planFromMeta === "premium" ? "premium" : "producer";

          if (subscription.current_period_end) {
            user.currentPeriodEnd = new Date(
              subscription.current_period_end * 1000,
            );
          }

          if (user.subscriptionPlan === "producer") {
            user.isProducer = true;
          }

          await user.save();
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object;

        // Producer subscription completed via Checkout
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

        // Movie purchase
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
        const user = await User.findOne({
          stripeSubscriptionId: subscription.id,
        });
        if (user) {
          user.subscriptionStatus = subscription.status;
          if (subscription.current_period_end) {
            user.currentPeriodEnd = new Date(
              subscription.current_period_end * 1000,
            );
          }

          user.cancelAtPeriodEnd = subscription.cancel_at_period_end || false;

          if (
            ["canceled", "unpaid", "incomplete_expired"].includes(
              subscription.status,
            )
          ) {
            user.isSubscribed = false;
            user.subscriptionStatus = "inactive";
          }

          await user.save();
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
  }

  res.status(200).json({ received: true });
};

export default {
  subscribePremium,
  createProducerSubscription,
  initiatePayment,
  stripeWebhook,
  createConnectAccount,
  payoutToProducer,
  verifyProducerPayment,
};
