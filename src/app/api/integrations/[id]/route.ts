import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!session?.user || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const integration = await prisma.integration.findFirst({
    where: { id: params.id, project: { organizationId: orgId } },
  });
  if (!integration) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.integration.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!session?.user || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const integration = await prisma.integration.findFirst({
    where: { id: params.id, project: { organizationId: orgId } },
  });
  if (!integration) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.integration.update({
    where: { id: params.id },
    data: {
      name: body.name,
      baseUrl: body.baseUrl,
      apiKey: body.apiKey,
      apiSecret: body.apiSecret,
      config: body.config,
      isActive: body.isActive,
    },
  });

  return NextResponse.json({ integration: updated });
}
