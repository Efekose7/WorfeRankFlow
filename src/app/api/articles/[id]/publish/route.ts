import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { publishToWordPress } from '@/lib/integrations/wordpress';
import { publishToShopify, publishToCustomRest, sendWebhook } from '@/lib/integrations/webhooks';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!session?.user || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const article = await prisma.article.findFirst({
    where: { id: params.id, project: { organizationId: orgId } },
    include: { project: { include: { integrations: { where: { isActive: true } } } } },
  });
  if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  if (article.status !== 'APPROVED') return NextResponse.json({ error: 'Article must be approved first' }, { status: 400 });

  const integrations = article.project.integrations;
  if (!integrations.length) return NextResponse.json({ error: 'No active integrations' }, { status: 400 });

  await prisma.article.update({ where: { id: params.id }, data: { status: 'PUBLISHING' } });

  const results = [];

  for (const integration of integrations) {
    const historyEntry = await prisma.publishHistory.create({
      data: { articleId: article.id, integrationId: integration.id, status: 'PENDING' },
    });

    try {
      let externalId: string | undefined;
      let externalUrl: string | undefined;

      if (integration.type === 'WORDPRESS' && integration.baseUrl && integration.apiKey && integration.apiSecret) {
        const result = await publishToWordPress(
          { baseUrl: integration.baseUrl, username: integration.apiKey, appPassword: integration.apiSecret },
          {
            title: article.title,
            content: article.contentHtml ?? article.content ?? '',
            slug: article.slug,
            status: 'publish',
            excerpt: article.metaDescription ?? undefined,
          }
        );
        externalId = String(result.id);
        externalUrl = result.link;
      } else if (integration.type === 'SHOPIFY' && integration.baseUrl && integration.apiKey) {
        const result = await publishToShopify(
          { shopDomain: integration.baseUrl, accessToken: integration.apiKey },
          { title: article.title, body_html: article.contentHtml ?? '', handle: article.slug, published: true }
        );
        externalId = String(result.id);
        externalUrl = result.url;
      } else if (integration.type === 'WEBHOOK' && integration.webhookUrl) {
        await sendWebhook(integration.webhookUrl, {
          event: 'article.published',
          article: { id: article.id, title: article.title, slug: article.slug, content: article.content },
        }, integration.apiKey ?? undefined);
        externalId = article.id;
      } else if (integration.type === 'CUSTOM_REST' && integration.baseUrl && integration.apiKey) {
        const result = await publishToCustomRest(integration.baseUrl, '/articles', integration.apiKey, {
          title: article.title,
          content: article.contentHtml ?? article.content,
          slug: article.slug,
          meta_title: article.metaTitle,
          meta_description: article.metaDescription,
        });
        externalId = result.id;
        externalUrl = result.url;
      }

      await prisma.publishHistory.update({
        where: { id: historyEntry.id },
        data: { status: 'SUCCESS', externalId, externalUrl, publishedAt: new Date() },
      });
      results.push({ integrationId: integration.id, success: true, url: externalUrl });
    } catch (err: any) {
      await prisma.publishHistory.update({
        where: { id: historyEntry.id },
        data: { status: 'FAILED', errorMessage: err.message, attempt: 1 },
      });
      results.push({ integrationId: integration.id, success: false, error: err.message });
    }
  }

  const anySuccess = results.some(r => r.success);
  await prisma.article.update({
    where: { id: params.id },
    data: {
      status: anySuccess ? 'PUBLISHED' : 'FAILED',
      publishedAt: anySuccess ? new Date() : undefined,
      externalUrl: results.find(r => r.success)?.url,
    },
  });

  return NextResponse.json({ results });
}
