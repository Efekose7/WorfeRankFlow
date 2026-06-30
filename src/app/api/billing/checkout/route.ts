import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-06-24.dahlia' as any,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  if (!session?.user || !orgId) return NextResponse.redirect(`${base}/auth/signin`);

  const formData = await req.formData();
  const priceId = formData.get('priceId') as string;
  if (!priceId) return NextResponse.redirect(`${base}/billing?error=no-price`);

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.redirect('/billing');

  try {
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        name: org.name,
        metadata: { orgId },
      });
      customerId = customer.id;
      await prisma.organization.update({ where: { id: orgId }, data: { stripeCustomerId: customerId } });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: { orgId },
    });

    return NextResponse.redirect(checkoutSession.url!);
  } catch (err: any) {
    return NextResponse.redirect(`${base}/billing?error=${encodeURIComponent(err.message)}`);
  }
}
