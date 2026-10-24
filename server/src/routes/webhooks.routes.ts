import { Router } from 'express';
import { stripe } from '../lib/stripe.js';
import { prisma } from '../lib/prisma.js';
import { isMocksMode } from '../lib/mocks.js';

export const webhooksRouter = Router();

webhooksRouter.post('/stripe', async (req, res) => {
  if (isMocksMode()) {
    return res.json({ received: true, mock: true });
  }
  const signature = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // must be the raw Buffer, not parsed JSON
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const order = await prisma.order.findUnique({
      where: { stripeCheckoutSessionId: session.id },
    });

    if (order && order.status === 'pending') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          stripePaymentIntentId: session.payment_intent as string,
        },
      });
    }
  }

  res.json({ received: true });
});
