import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!session?.user || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const intent = searchParams.get('intent') ?? undefined;

  const keywords = await prisma.keyword.findMany({
    where: {
      ...(projectId ? { projectId } : { project: { organizationId: orgId } }),
      ...(status ? { status: status as any } : {}),
      ...(intent ? { intent: intent as any } : {}),
    },
    include: { cluster: { select: { name: true } } },
    orderBy: [{ searchVolume: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  });

  return NextResponse.json({ keywords });
}

const createSchema = z.object({
  projectId: z.string(),
  phrase: z.string().min(1),
  locale: z.string().default('tr'),
  intent: z.enum(['INFORMATIONAL', 'COMMERCIAL', 'TRANSACTIONAL', 'NAVIGATIONAL', 'COMPARISON']).default('INFORMATIONAL'),
  searchVolume: z.number().optional(),
  difficulty: z.number().min(0).max(100).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const keyword = await prisma.keyword.create({
      data: {
        projectId: data.projectId,
        phrase: data.phrase,
        locale: data.locale,
        intent: data.intent,
        searchVolume: data.searchVolume,
        difficulty: data.difficulty,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ keyword });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
