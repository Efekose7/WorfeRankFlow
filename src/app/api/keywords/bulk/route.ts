import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!session?.user || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { projectId, keywords } = await req.json();
    if (!projectId || !Array.isArray(keywords)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const project = await prisma.project.findFirst({ where: { id: projectId, organizationId: orgId } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const intentMap: Record<string, any> = {
      INFORMATIONAL: 'INFORMATIONAL', COMMERCIAL: 'COMMERCIAL', TRANSACTIONAL: 'TRANSACTIONAL',
      NAVIGATIONAL: 'NAVIGATIONAL', COMPARISON: 'COMPARISON',
    };

    const created = await Promise.all(
      keywords.map(async (kw: any) => {
        try {
          return await prisma.keyword.upsert({
            where: { projectId_phrase_locale: { projectId, phrase: kw.phrase, locale: kw.locale ?? 'tr' } },
            update: {},
            create: {
              projectId,
              phrase: kw.phrase,
              locale: kw.locale ?? 'tr',
              intent: intentMap[kw.intent] ?? 'INFORMATIONAL',
              status: 'PENDING',
            },
          });
        } catch {
          return null;
        }
      })
    );

    const saved = created.filter(Boolean).length;
    await prisma.organization.update({
      where: { id: orgId },
      data: { usageKeywords: { increment: saved } },
    });

    return NextResponse.json({ saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
