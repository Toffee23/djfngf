/**
 * Payment Provider Service
 * Centralized abstraction layer for coordinating regional (Paystack) 
 * and international (Stripe) financial transactions.
 */

class PaymentProviderService {
  constructor() {
    this.supportedCurrencies = ["USD", "GBP", "NGN"];
    this.defaultPlatformFeePercent = 20;
  }

  /**
   * Resolves the optimal payment gateway based on country or currency settings
   * @param {string} country - The resident country of the user (e.g., "Nigeria")
   * @param {string} currency - Target ISO currency string (e.g., "NGN", "USD")
   * @returns {string} - Resolves to either "paystack" or "stripe"
   */
  resolveGateway(country, currency) {
    const standardizedCountry = country?.trim().toLowerCase();
    const standardizedCurrency = currency?.trim().toUpperCase();

    if (standardizedCountry === "nigeria" || standardizedCurrency === "NGN") {
      return "paystack";
    }
    
    return "stripe";
  }

  /**
   * Utility to compute structural platform commissions splits cleanly
   * @param {number} grossAmount - Full incoming fiat transaction amount
   * @param {number} [customFeePercent] - Optional fee override parameter
   * @returns {Object} - Split ledger breakdown formatted to 2 decimal points
   */
  calculateFeeSplit(grossAmount, customFeePercent) {
    const feePercent = customFeePercent !== undefined ? customFeePercent : this.defaultPlatformFeePercent;
    const platformFee = parseFloat((grossAmount * (feePercent / 100)).toFixed(2));
    const netAmount = parseFloat((grossAmount - platformFee).toFixed(2));

    return {
      grossAmount,
      platformFeePercent: feePercent,
      platformFee,
      netAmount
    };
  }
}

export const PaymentProvider = new PaymentProviderService();