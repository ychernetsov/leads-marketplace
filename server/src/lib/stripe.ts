import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

/** Lazy init so mocks mode never requires STRIPE_SECRET_KEY at import time. */
export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  stripeClient = new Stripe(key, {
    apiVersion: '2026-08-26.dahlia',
  });
  return stripeClient;
}
