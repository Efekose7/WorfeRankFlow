import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { researchKeywords } from '@/lib/ai/openai';

export async function POST(req: NextRequest) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!session?.user || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { projectId, locale = 'tr' } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId },
    });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const existing = await prisma.keyword.findMany({
      where: { projectId },
      select: { phrase: true },
      take: 50,
    });

    const keywords = await researchKeywords({
      domain: project.domain,
      niche: project.niche ?? project.name,
      locale,
      existingKeywords: existing.map(k => k.phrase),
    });

    return NextResponse.json({ keywords });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
