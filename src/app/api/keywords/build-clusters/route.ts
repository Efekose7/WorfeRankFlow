import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateTopicClusters } from '@/lib/ai/openai';

export async function POST(req: NextRequest) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!session?.user || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let projectId: string;
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await req.json();
    projectId = body.projectId;
  } else {
    const form = await req.formData();
    projectId = form.get('projectId') as string;
  }

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const project = await prisma.project.findFirst({ where: { id: projectId, organizationId: orgId } });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const keywords = await prisma.keyword.findMany({
    where: { projectId, clusterId: null },
    select: { id: true, phrase: true },
    take: 50,
  });

  if (keywords.length < 3) return NextResponse.json({ error: 'Need at least 3 keywords to build clusters' }, { status: 400 });

  const clusterSuggestions = await generateTopicClusters(
    keywords.map(k => k.phrase),
    project.niche ?? project.name
  );

  const created = [];
  for (const suggestion of clusterSuggestions) {
    const cluster = await prisma.topicCluster.create({
      data: {
        projectId,
        name: suggestion.clusterName,
        pillarTitle: suggestion.pillarTitle,
        locale: project.locale,
      },
    });

    const matchingKws = keywords.filter(k => suggestion.keywords.some((sk: string) => sk.toLowerCase() === k.phrase.toLowerCase()));
    if (matchingKws.length > 0) {
      await prisma.keyword.updateMany({
        where: { id: { in: matchingKws.map(k => k.id) } },
        data: { clusterId: cluster.id },
      });
    }
    created.push(cluster);
  }

  return NextResponse.json({ clusters: created });
}
