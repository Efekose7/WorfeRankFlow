import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createSchema = z.object({
  projectId: z.string(),
  type: z.enum(['WORDPRESS', 'SHOPIFY', 'WEBFLOW', 'WIX', 'CUSTOM_REST', 'WEBHOOK']),
  name: z.string().min(1),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  webhookUrl: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!session?.user || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId') ?? undefined;

  const integrations = await prisma.integration.findMany({
    where: {
      project: { organizationId: orgId },
      ...(projectId ? { projectId } : {}),
    },
    select: {
      id: true, type: true, name: true, baseUrl: true, isActive: true, lastTestedAt: true,
      projectId: true, createdAt: true,
    },
  });

  return NextResponse.json({ integrations });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!session?.user || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const project = await prisma.project.findFirst({ where: { id: data.projectId, organizationId: orgId } });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const integration = await prisma.integration.create({
      data: {
        projectId: data.projectId,
        type: data.type,
        name: data.name,
        baseUrl: data.baseUrl,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        webhookUrl: data.webhookUrl,
        config: data.config,
        isActive: false,
      },
    });

    return NextResponse.json({ integration: { ...integration, apiKey: undefined, apiSecret: undefined } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
