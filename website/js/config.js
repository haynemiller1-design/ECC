/*
 * OmniKit configuration — edit this file before launch.
 *
 * 1. Create two Payment Links in your Stripe dashboard
 *    (Products -> Payment Links): one one-time price (lifetime)
 *    and one recurring price (monthly).
 * 2. Paste the URLs below.
 * 3. See website/README.md for the full launch checklist,
 *    including how license keys are issued to buyers.
 */
window.OMNIKIT_CONFIG = {
  productName: 'OmniKit',

  // Stripe Payment Link URLs. Leave empty to show a "coming soon" toast
  // instead of redirecting (useful while developing).
  stripeLifetimeUrl: '',
  stripeMonthlyUrl: '',

  prices: {
    lifetime: '$29',
    monthly: '$4/mo'
  },

  // Free-tier limits (Pro removes them).
  limits: {
    batchImages: 1,     // images processed at once
    bulkUuids: 10,      // UUIDs per generation
    bulkPasswords: 5    // passwords per generation
  }
};
