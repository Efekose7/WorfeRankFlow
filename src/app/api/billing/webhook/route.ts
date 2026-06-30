import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';
import { planLimits } from '@/lib/utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2026-06-24.dahlia' as any,
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const PLAN_PRICE_MAP: Record<string, 'STARTER' | 'PRO' | 'ENTERPRISE'> = {
    [process.env.STRIPE_STARTER_PRICE_ID ?? '']: 'STARTER',
    [process.env.STRIPE_PRO_PRICE_ID ?? '']: 'PRO',
    [process.env.STRIPE_ENTERPRISE_PRICE_ID ?? '']: 'ENTERPRISE',
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.orgId;
      if (!orgId) break;

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;
      const plan = PLAN_PRICE_MAP[priceId] ?? 'STARTER';
      const limits = planLimits(plan);

      await prisma.organization.update({
        where: { id: orgId },
        data: {
          plan,
          stripeSubscriptionId: subscription.id,
          quotaArticles: limits.articles < 0 ? 999999 : limits.articles,
          quotaKeywords: limits.keywords < 0 ? 999999 : limits.keywords,
          planExpires: new Date((subscription as any).current_period_end * 1000),
        },
      });
      break;
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const org = await prisma.organization.findFirst({ where: { stripeCustomerId: customerId } });
      if (!org) break;

      await prisma.invoice.create({
        data: {
          organizationId: org.id,
          stripeInvoiceId: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'PAID',
          paidAt: new Date((invoice.status_transitions.paid_at ?? Date.now() / 1000) * 1000),
        },
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const org = await prisma.organization.findFirst({ where: { stripeSubscriptionId: sub.id } });
      if (!org) break;

      await prisma.organization.update({
        where: { id: org.id },
        data: { plan: 'FREE', stripeSubscriptionId: null, quotaArticles: 5, quotaKeywords: 50 },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
