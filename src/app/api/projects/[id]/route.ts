import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { _count: { select: { keywords: true, articles: true } } },
  });

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const project = await prisma.project.update({ where: { id: params.id }, data: body });
  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
