import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  orgName: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, orgName } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 });

    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        memberships: {
          create: {
            role: 'OWNER',
            organization: {
              create: {
                name: orgName,
                slug: uniqueSlug,
                plan: 'FREE',
                quotaArticles: 5,
                quotaKeywords: 50,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
