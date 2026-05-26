import Stripe from "stripe";

// Initialize Stripe instance safely with fallback handling
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16", // Ensured a stable, predictable API version lock
});

class StripeService {
  /**
   * Initializes a hosted checkout session for subscription plans (Premium or Producer)
   * @param {string} customerEmail - Email of the purchasing account
   * @param {string} priceId - Stripe Dashboard Price Object ID string
   * @param {string} successUrl - Redirect destination upon successful transaction completion
   * @param {string} cancelUrl - Redirect destination if checkout is aborted
   * @param {Object} metadata - Optional custom tracking reference keys
   * @returns {Promise<Object>} - Returns the created session payload object
   */
  async createSubscriptionSession(customerEmail, priceId, successUrl, cancelUrl, metadata = {}) {
    try {
      return await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: customerEmail,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    } catch (error) {
      throw new Error(`Stripe Subscription Session Initialization Failed: ${error.message}`);
    }
  }

  /**
   * Initializes a unified checkout session for one-time payments (Pay-per-view movies)
   * @param {string} customerEmail - Purchasing user's tracking email
   * @param {number} amountInCents - Transaction cost value specified in target fractional units (e.g. 500 for $5.00)
   * @param {string} currency - Base ISO ticker currency selection ('USD' or 'GBP')
   * @param {string} successUrl - Destination URL on success
   * @param {string} cancelUrl - Destination URL on cancellation
   * @param {Object} metadata - Custom identity properties tracking references
   * @returns {Promise<Object>} - Created stripe checkout session instance object
   */
  async createOneTimePaymentSession(customerEmail, amountInCents, currency = "usd", successUrl, cancelUrl, metadata = {}) {
    try {
      return await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: customerEmail,
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: metadata.movieTitle || "Digital Media Content Access Access",
              },
              unit_amount: Math.round(amountInCents),
            },
            quantity: 1,
          },
        ],
        metadata,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    } catch (error) {
      throw new Error(`Stripe One-Time Checkout Initialization Failed: ${error.message}`);
    }
  }

  /**
   * Executes an automated transfer balance slice directly to a connected Express account mapping
   * @param {string} destinationConnectedAccountId - The target producer's verified stripe connect string id (acct_...)
   * @param {number} amountInCents - Transferred currency allocation calculation limits in base fractional units
   * @param {string} currency - ISO payment code string matching connected location specs ('usd' or 'gbp')
   * @returns {Promise<Object>} - Returns the confirmed transfer ledger object entry
   */
  async transferFundsToConnectedAccount(destinationConnectedAccountId, amountInCents, currency = "usd") {
    try {
      return await stripe.transfers.create({
        amount: Math.round(amountInCents),
        currency: currency.toLowerCase(),
        destination: destinationConnectedAccountId,
      });
    } catch (error) {
      throw new Error(`Stripe Connect Split Allocation Payout Route Failed: ${error.message}`);
    }
  }

  /**
   * Constructs an onboarding link chain for new producers accessing their Stripe Express panels
   * @param {string} connectedAccountId - Active generated core connect account identifier reference string
   * @param {string} refreshUrl - Re-route recovery handler path if session expiration drops trigger
   * @param {string} returnUrl - Success destination when onboard criteria registration finishes completely
   * @returns {Promise<Object>} - Active links mapping payloads object
   */
  async createAccountOnboardingLink(connectedAccountId, refreshUrl, returnUrl) {
    try {
      return await stripe.accountLinks.create({
        account: connectedAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
      });
    } catch (error) {
      throw new Error(`Stripe Express Link Configuration Routine Failed: ${error.message}`);
    }
  }
}

export const StripePaymentService = new StripeService();