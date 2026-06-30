import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const status = searchParams.get('status');
  const locale = searchParams.get('locale');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const offset = parseInt(searchParams.get('offset') ?? '0');

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (locale) where.locale = locale;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true, title: true, status: true, locale: true,
        seoScore: true, wordCount: true, createdAt: true,
        keyword: { select: { phrase: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({ articles, total });
}
