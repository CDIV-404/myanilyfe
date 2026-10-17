/**
 * ANILyfe Payment Service Abstraction
 * Supports swappable regional payment providers (Paystack, Flutterwave, and future gateways)
 * Multi-currency ready (NGN, GHS, KES, ZAR, USD).
 * Payment verification happens authoritatively on backend.
 */
(function() {
  const paymentService = {
    provider: 'paystack', // 'paystack' | 'flutterwave' | 'mock'
    supportedCurrencies: ['NGN', 'GHS', 'KES', 'ZAR', 'USD'],

    setProvider(providerName) {
      if (['paystack', 'flutterwave', 'mock'].includes(providerName)) {
        this.provider = providerName;
      }
    },

    getProvider() {
      return this.provider;
    },

    async simulateInitializePayment({ amount, email, currency = 'NGN', metadata = {} }) {
      await new Promise(r => setTimeout(r, 100));
      const reference = `ANL-REF-${Date.now().toString(36).toUpperCase()}`;
      return {
        provider: this.provider,
        reference,
        amount,
        currency,
        checkoutUrl: `https://checkout.${this.provider}.com/simulate/${reference}`,
        status: 'initialized'
      };
    },

    async simulateVerifyPayment(reference) {
      await new Promise(r => setTimeout(r, 100));
      return {
        reference,
        verified: true,
        channel: 'card',
        paidAt: new Date().toISOString(),
        gatewayResponse: 'Successful simulated transaction'
      };
    }
  };

  window.paymentService = paymentService;
})();
