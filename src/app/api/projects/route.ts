import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { slugify } from '@/lib/utils';

const createSchema = z.object({
  name: z.string().min(1),
  domain: z.string().min(1),
  niche: z.string().optional(),
  description: z.string().optional(),
  locale: z.string().default('tr'),
  targetLocales: z.array(z.string()).default(['tr']),
  brandVoice: z.string().optional(),
  targetAudience: z.string().optional(),
  writingGuidelines: z.string().optional(),
  customInstructions: z.string().optional(),
  prohibitedWords: z.array(z.string()).default([]),
});

export async function GET() {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!session?.user || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    include: { _count: { select: { keywords: true, articles: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!session?.user || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const domain = data.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    const project = await prisma.project.create({
      data: {
        organizationId: orgId,
        name: data.name,
        domain,
        niche: data.niche,
        description: data.description,
        locale: data.locale,
        targetLocales: data.targetLocales,
        brandVoice: data.brandVoice,
        targetAudience: data.targetAudience,
        writingGuidelines: data.writingGuidelines,
        customInstructions: data.customInstructions,
        prohibitedWords: data.prohibitedWords,
      },
    });

    return NextResponse.json({ id: project.id, project });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
