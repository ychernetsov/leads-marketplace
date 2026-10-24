import { randomUUID } from 'crypto';
import { isMocksMode } from './mocks.js';
import { getStripe } from './stripe.js';

export type CheckoutSessionParams = {
  fileId: string;
  title: string;
  priceCents: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutSessionResult = {
  id: string;
  url: string;
};

export async function createCheckoutSession(
  params: CheckoutSessionParams,
): Promise<CheckoutSessionResult> {
  if (isMocksMode()) {
    return {
      id: `mock_cs_${randomUUID()}`,
      url: params.successUrl,
    };
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: params.currency,
          product_data: { name: params.title },
          unit_amount: params.priceCents,
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }

  return { id: session.id, url: session.url };
}
