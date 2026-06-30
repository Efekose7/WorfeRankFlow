import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID,
    });
  }
  return _client;
}

export interface ArticleGenerationInput {
  keyword: string;
  locale: string;
  projectName: string;
  domain: string;
  niche?: string;
  brandVoice?: string;
  targetAudience?: string;
  prohibitedWords?: string[];
  writingGuidelines?: string;
  customInstructions?: string;
  intent: string;
  relatedKeywords?: string[];
  existingTitles?: string[];
}

export interface ArticleGenerationOutput {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  content: string;
  contentHtml: string;
  faqSection: Array<{ question: string; answer: string }>;
  internalLinks: Array<{ anchor: string; suggestion: string }>;
  externalLinks: Array<{ anchor: string; url: string; reason: string }>;
  schemaMarkup: Record<string, unknown>;
  altTexts: string[];
  hreflangSuggestions: string[];
  tokensUsed: number;
}

const LOCALE_MAP: Record<string, string> = {
  tr: 'Türkçe',
  en: 'English',
  ru: 'Russian',
  ar: 'Arabic',
};

export async function generateArticle(input: ArticleGenerationInput): Promise<ArticleGenerationOutput> {
  const openai = getOpenAI();
  const language = LOCALE_MAP[input.locale] ?? 'Turkish';

  const systemPrompt = `You are an expert SEO content writer producing high-quality, E-E-A-T compliant articles in ${language}.
Brand: ${input.projectName} (${input.domain})
${input.niche ? `Niche: ${input.niche}` : ''}
${input.brandVoice ? `Brand voice: ${input.brandVoice}` : ''}
${input.targetAudience ? `Target audience: ${input.targetAudience}` : ''}
${input.prohibitedWords?.length ? `Avoid these words: ${input.prohibitedWords.join(', ')}` : ''}
${input.writingGuidelines ? `Writing guidelines: ${input.writingGuidelines}` : ''}
${input.customInstructions ? `Custom instructions: ${input.customInstructions}` : ''}
${input.existingTitles?.length ? `Do NOT write about these already covered topics: ${input.existingTitles.slice(0, 10).join(', ')}` : ''}

CRITICAL: Respond ONLY with valid JSON in the exact schema below. No markdown, no code blocks.`;

  const userPrompt = `Generate a comprehensive SEO article for the keyword: "${input.keyword}"
Search intent: ${input.intent}
${input.relatedKeywords?.length ? `Related keywords to naturally include: ${input.relatedKeywords.slice(0, 10).join(', ')}` : ''}

Return JSON with this exact structure:
{
  "title": "SEO optimized article title",
  "slug": "url-friendly-slug",
  "metaTitle": "SEO meta title (max 60 chars)",
  "metaDescription": "Compelling meta description (max 160 chars)",
  "h1": "Main H1 heading",
  "content": "Full article content in markdown (min 1500 words) with H2-H6 headings, bullet points, tables where relevant",
  "contentHtml": "Same article as semantic HTML with proper heading hierarchy",
  "faqSection": [{"question": "...", "answer": "..."}],
  "internalLinks": [{"anchor": "anchor text", "suggestion": "describe what page to link to"}],
  "externalLinks": [{"anchor": "anchor text", "url": "authoritative source URL", "reason": "why this source"}],
  "schemaMarkup": {"@context": "https://schema.org", "@type": "Article", ...},
  "altTexts": ["descriptive alt text for featured image", "alt text for in-article image 2"],
  "hreflangSuggestions": ["suggested hreflang locales for this content"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content ?? '{}';
  const parsed = JSON.parse(raw);

  return {
    ...parsed,
    tokensUsed: response.usage?.total_tokens ?? 0,
  };
}

export async function researchKeywords(input: {
  domain: string;
  niche: string;
  locale: string;
  existingKeywords?: string[];
}): Promise<Array<{ phrase: string; intent: string; estimatedVolume: string; difficulty: string }>> {
  const openai = getOpenAI();
  const language = LOCALE_MAP[input.locale] ?? 'Turkish';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an SEO keyword research expert specializing in ${language} content. Return ONLY valid JSON.`,
      },
      {
        role: 'user',
        content: `Research 20 high-value keywords for a ${input.niche} website at ${input.domain}.
${input.existingKeywords?.length ? `Avoid these existing keywords: ${input.existingKeywords.slice(0, 20).join(', ')}` : ''}
Focus on keywords with good search volume and low-to-medium competition.

Return JSON: {"keywords": [{"phrase": "keyword", "intent": "INFORMATIONAL|COMMERCIAL|TRANSACTIONAL|NAVIGATIONAL|COMPARISON", "estimatedVolume": "high|medium|low", "difficulty": "low|medium|high"}]}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const raw = JSON.parse(response.choices[0].message.content ?? '{"keywords":[]}');
  return raw.keywords ?? [];
}

export async function analyzeDomain(domain: string): Promise<{
  niche: string;
  description: string;
  targetAudience: string;
  brandVoice: string;
  topics: string[];
}> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a brand and SEO analyst. Return ONLY valid JSON.',
      },
      {
        role: 'user',
        content: `Analyze the domain: ${domain}
Based on the domain name, infer the business niche, description, target audience, brand voice, and main content topics.

Return JSON: {"niche": "...", "description": "...", "targetAudience": "...", "brandVoice": "professional|friendly|authoritative|conversational", "topics": ["topic1", "topic2", ...]}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content ?? '{}');
}

export async function qaCheckArticle(content: string, keyword: string): Promise<{
  duplicateContent: boolean;
  keywordStuffing: boolean;
  grammarIssues: boolean;
  readabilityScore: number;
  originalityScore: number;
  eeatScore: number;
  semanticScore: number;
  overallScore: number;
  issues: string[];
  suggestions: string[];
  passed: boolean;
}> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a content quality analyst. Evaluate content against SEO and E-E-A-T standards. Return ONLY valid JSON.',
      },
      {
        role: 'user',
        content: `Evaluate this article for the keyword "${keyword}":

${content.slice(0, 3000)}...

Return JSON: {
  "duplicateContent": false,
  "keywordStuffing": false,
  "grammarIssues": false,
  "readabilityScore": 85,
  "originalityScore": 90,
  "eeatScore": 80,
  "semanticScore": 85,
  "overallScore": 85,
  "issues": [],
  "suggestions": [],
  "passed": true
}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content ?? '{}');
}

export async function generateTopicClusters(keywords: string[], niche: string): Promise<
  Array<{ clusterName: string; pillarTitle: string; keywords: string[] }>
> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an SEO topic cluster strategist. Return ONLY valid JSON.' },
      {
        role: 'user',
        content: `Organize these keywords into topic clusters for a ${niche} website:
Keywords: ${keywords.join(', ')}

Create 3-6 clusters with pillar page titles.
Return JSON: {"clusters": [{"clusterName": "...", "pillarTitle": "...", "keywords": [...]}]}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const raw = JSON.parse(response.choices[0].message.content ?? '{"clusters":[]}');
  return raw.clusters ?? [];
}
