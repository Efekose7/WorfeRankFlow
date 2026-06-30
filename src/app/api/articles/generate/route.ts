import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateArticle, qaCheckArticle } from '@/lib/ai/openai';
import { calculateSeoScore } from '@/lib/seo/analyzer';
import { slugify as makeSlug } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!session?.user || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { projectId, keywordId, locale = 'tr' } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId },
    });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Check quota
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    if (org.quotaArticles > 0 && org.usageArticles >= org.quotaArticles) {
      return NextResponse.json({ error: 'Article quota exceeded. Please upgrade your plan.' }, { status: 429 });
    }

    let keyword = null;
    if (keywordId) {
      keyword = await prisma.keyword.findFirst({ where: { id: keywordId, projectId } });
    } else {
      // Pick first approved keyword without an article
      keyword = await prisma.keyword.findFirst({
        where: {
          projectId,
          status: 'PENDING',
          articles: { none: {} },
          locale,
        },
        orderBy: { searchVolume: 'desc' },
      });
    }

    // Get existing titles for duplicate prevention
    const existingTitles = await prisma.article.findMany({
      where: { projectId },
      select: { title: true },
      take: 30,
    }).then(a => a.map(x => x.title));

    // Related keywords
    const relatedKeywords = await prisma.keyword.findMany({
      where: { projectId, locale, id: { not: keyword?.id } },
      select: { phrase: true },
      take: 10,
    }).then(k => k.map(x => x.phrase));

    const genInput = {
      keyword: keyword?.phrase ?? `${project.niche ?? project.name} hakkında`,
      locale,
      projectName: project.name,
      domain: project.domain,
      niche: project.niche ?? undefined,
      brandVoice: project.brandVoice ?? undefined,
      targetAudience: project.targetAudience ?? undefined,
      prohibitedWords: project.prohibitedWords,
      writingGuidelines: project.writingGuidelines ?? undefined,
      customInstructions: project.customInstructions ?? undefined,
      intent: keyword?.intent ?? 'INFORMATIONAL',
      relatedKeywords,
      existingTitles,
    };

    // Create article placeholder
    const article = await prisma.article.create({
      data: {
        projectId,
        keywordId: keyword?.id,
        title: `[Oluşturuluyor] ${genInput.keyword}`,
        slug: `generating-${Date.now()}`,
        locale,
        status: 'GENERATING',
      },
    });

    // Generate content
    const generated = await generateArticle(genInput);
    const wordCount = generated.content.split(/\s+/).filter(Boolean).length;

    // QA Check
    const qa = await qaCheckArticle(generated.content, genInput.keyword);

    const seoScore = calculateSeoScore({
      title: generated.title,
      metaTitle: generated.metaTitle,
      metaDescription: generated.metaDescription,
      h1: generated.h1,
      content: generated.content,
      keyword: genInput.keyword,
      wordCount,
      faqSection: generated.faqSection,
      internalLinks: generated.internalLinks,
      schemaMarkup: generated.schemaMarkup,
    });

    // Update article with generated content
    const updated = await prisma.article.update({
      where: { id: article.id },
      data: {
        title: generated.title,
        slug: makeSlug(generated.slug || generated.title),
        metaTitle: generated.metaTitle,
        metaDescription: generated.metaDescription,
        h1: generated.h1,
        content: generated.content,
        contentHtml: generated.contentHtml,
        faqSection: generated.faqSection,
        internalLinks: generated.internalLinks,
        externalLinks: generated.externalLinks,
        schemaMarkup: generated.schemaMarkup as any,
        altTexts: generated.altTexts,
        hreflangTags: generated.hreflangSuggestions,
        wordCount,
        readingTime: Math.ceil(wordCount / 200),
        seoScore,
        readabilityScore: qa.readabilityScore,
        originalityScore: qa.originalityScore,
        eeatScore: qa.eeatScore,
        qualityPassed: qa.passed,
        status: qa.passed ? 'APPROVED' : 'QA_FAILED',
        aiModel: 'gpt-4o',
        tokensUsed: generated.tokensUsed,
      },
    });

    // Save QA results
    await prisma.qAResult.createMany({
      data: [
        { articleId: article.id, checkType: 'duplicate_content', passed: !qa.duplicateContent, score: qa.duplicateContent ? 0 : 100 },
        { articleId: article.id, checkType: 'keyword_stuffing', passed: !qa.keywordStuffing, score: qa.keywordStuffing ? 0 : 100 },
        { articleId: article.id, checkType: 'readability', passed: qa.readabilityScore >= 60, score: qa.readabilityScore },
        { articleId: article.id, checkType: 'originality', passed: qa.originalityScore >= 70, score: qa.originalityScore },
        { articleId: article.id, checkType: 'eeat', passed: qa.eeatScore >= 60, score: qa.eeatScore },
        { articleId: article.id, checkType: 'semantic_seo', passed: qa.semanticScore >= 60, score: qa.semanticScore },
        { articleId: article.id, checkType: 'overall', passed: qa.passed, score: qa.overallScore },
      ],
    });

    // Update keyword status
    if (keyword) {
      await prisma.keyword.update({ where: { id: keyword.id }, data: { status: 'IN_USE' } });
    }

    // Increment usage
    await prisma.organization.update({
      where: { id: orgId },
      data: { usageArticles: { increment: 1 } },
    });

    return NextResponse.json({ articleId: updated.id, seoScore, qualityPassed: qa.passed });
  } catch (err: any) {
    console.error('Article generation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
