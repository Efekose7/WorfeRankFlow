import { GoogleGenerativeAI } from '@google/generative-ai';

let _client: GoogleGenerativeAI | null = null;

export function getGemini(): GoogleGenerativeAI {
  if (!_client) {
    _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
  }
  return _client;
}

function extractJson(raw: string): any {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

async function generateJson(prompt: string, maxOutputTokens: number, temperature: number): Promise<any> {
  const gemini = getGemini();
  const model = gemini.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  return { parsed: extractJson(raw), tokensUsed: result.response.usageMetadata?.totalTokenCount ?? 0 };
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
  const language = LOCALE_MAP[input.locale] ?? 'Turkish';

  const prompt = `You are an expert SEO content writer producing high-quality, E-E-A-T compliant articles in ${language}.
Brand: ${input.projectName} (${input.domain})
${input.niche ? `Niche: ${input.niche}` : ''}
${input.brandVoice ? `Brand voice: ${input.brandVoice}` : ''}
${input.targetAudience ? `Target audience: ${input.targetAudience}` : ''}
${input.prohibitedWords?.length ? `Avoid these words: ${input.prohibitedWords.join(', ')}` : ''}
${input.writingGuidelines ? `Writing guidelines: ${input.writingGuidelines}` : ''}
${input.customInstructions ? `Custom instructions: ${input.customInstructions}` : ''}
${input.existingTitles?.length ? `Do NOT write about these already covered topics: ${input.existingTitles.slice(0, 10).join(', ')}` : ''}

Generate a comprehensive SEO article for the keyword: "${input.keyword}"
Search intent: ${input.intent}
${input.relatedKeywords?.length ? `Related keywords to naturally include: ${input.relatedKeywords.slice(0, 10).join(', ')}` : ''}

CRITICAL: Respond ONLY with valid JSON in the exact schema below. No markdown, no code blocks.
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
  "schemaMarkup": {"@context": "https://schema.org", "@type": "Article"},
  "altTexts": ["descriptive alt text for featured image", "alt text for in-article image 2"],
  "hreflangSuggestions": ["suggested hreflang locales for this content"]
}`;

  const { parsed, tokensUsed } = await generateJson(prompt, 8000, 0.7);

  return {
    ...parsed,
    tokensUsed,
  };
}

export async function researchKeywords(input: {
  domain: string;
  niche: string;
  locale: string;
  existingKeywords?: string[];
}): Promise<Array<{ phrase: string; intent: string; estimatedVolume: string; difficulty: string }>> {
  const language = LOCALE_MAP[input.locale] ?? 'Turkish';

  const prompt = `You are an SEO keyword research expert specializing in ${language} content.
Research 20 high-value keywords for a ${input.niche} website at ${input.domain}.
${input.existingKeywords?.length ? `Avoid these existing keywords: ${input.existingKeywords.slice(0, 20).join(', ')}` : ''}
Focus on keywords with good search volume and low-to-medium competition.

Return ONLY valid JSON: {"keywords": [{"phrase": "keyword", "intent": "INFORMATIONAL|COMMERCIAL|TRANSACTIONAL|NAVIGATIONAL|COMPARISON", "estimatedVolume": "high|medium|low", "difficulty": "low|medium|high"}]}`;

  const { parsed } = await generateJson(prompt, 2500, 0.5);
  return parsed.keywords ?? [];
}

export async function analyzeDomain(domain: string): Promise<{
  niche: string;
  description: string;
  targetAudience: string;
  brandVoice: string;
  topics: string[];
}> {
  const prompt = `You are a brand and SEO analyst.
Analyze the domain: ${domain}
Based on the domain name, infer the business niche, description, target audience, brand voice, and main content topics.

Return ONLY valid JSON: {"niche": "...", "description": "...", "targetAudience": "...", "brandVoice": "professional|friendly|authoritative|conversational", "topics": ["topic1", "topic2"]}`;

  const { parsed } = await generateJson(prompt, 600, 0.5);
  return parsed;
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
  const prompt = `You are a content quality analyst. Evaluate content against SEO and E-E-A-T standards.
Evaluate this article for the keyword "${keyword}":

${content.slice(0, 3000)}...

Return ONLY valid JSON: {
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
}`;

  const { parsed } = await generateJson(prompt, 900, 0.3);
  return parsed;
}

export async function generateTopicClusters(keywords: string[], niche: string): Promise<
  Array<{ clusterName: string; pillarTitle: string; keywords: string[] }>
> {
  const prompt = `You are an SEO topic cluster strategist.
Organize these keywords into topic clusters for a ${niche} website:
Keywords: ${keywords.join(', ')}

Create 3-6 clusters with pillar page titles.
Return ONLY valid JSON: {"clusters": [{"clusterName": "...", "pillarTitle": "...", "keywords": []}]}`;

  const { parsed } = await generateJson(prompt, 1200, 0.5);
  return parsed.clusters ?? [];
}
