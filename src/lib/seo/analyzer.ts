import * as cheerio from 'cheerio';
import axios from 'axios';

export interface SeoAnalysis {
  title: string;
  metaDescription: string;
  h1s: string[];
  h2s: string[];
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  images: Array<{ src: string; alt: string }>;
  canonicalUrl: string;
  robots: string;
  score: number;
  issues: string[];
}

export async function analyzePage(url: string): Promise<SeoAnalysis> {
  const res = await axios.get(url, {
    timeout: 15000,
    headers: { 'User-Agent': 'WorfeRankFlow-Crawler/1.0' },
  });

  const $ = cheerio.load(res.data);
  const issues: string[] = [];

  const title = $('title').text().trim();
  const metaDesc = $('meta[name="description"]').attr('content') ?? '';
  const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
  const h2s = $('h2').map((_, el) => $(el).text().trim()).get();
  const canonical = $('link[rel="canonical"]').attr('href') ?? '';
  const robots = $('meta[name="robots"]').attr('content') ?? '';
  const bodyText = $('body').text();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  const images = $('img').map((_, el) => ({
    src: $(el).attr('src') ?? '',
    alt: $(el).attr('alt') ?? '',
  })).get();

  let internalLinks = 0;
  let externalLinks = 0;
  const domain = new URL(url).hostname;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (href.startsWith('http') && !href.includes(domain)) externalLinks++;
    else internalLinks++;
  });

  let score = 100;
  if (!title) { issues.push('Missing title tag'); score -= 20; }
  else if (title.length > 60) { issues.push('Title too long (>60 chars)'); score -= 5; }
  if (!metaDesc) { issues.push('Missing meta description'); score -= 15; }
  else if (metaDesc.length > 160) { issues.push('Meta description too long'); score -= 5; }
  if (h1s.length === 0) { issues.push('Missing H1 tag'); score -= 15; }
  if (h1s.length > 1) { issues.push('Multiple H1 tags'); score -= 10; }
  if (wordCount < 300) { issues.push('Low word count'); score -= 10; }
  images.forEach(img => { if (!img.alt) { issues.push(`Image missing alt: ${img.src}`); score -= 2; } });

  return { title, metaDescription: metaDesc, h1s, h2s, wordCount, internalLinks, externalLinks, images, canonicalUrl: canonical, robots, score: Math.max(0, score), issues };
}

export async function crawlWebsite(domain: string, maxPages = 20): Promise<{
  pages: string[];
  titles: string[];
  slugs: string[];
  issues: string[];
}> {
  const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
  const visited = new Set<string>();
  const queue = [baseUrl];
  const pages: string[] = [];
  const titles: string[] = [];
  const slugs: string[] = [];
  const issues: string[] = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const res = await axios.get(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'WorfeRankFlow-Crawler/1.0' },
      });

      const $ = cheerio.load(res.data);
      const title = $('title').text().trim();
      const slug = new URL(url).pathname;

      pages.push(url);
      if (title) titles.push(title);
      slugs.push(slug);

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        if (href.startsWith('/') || href.startsWith(baseUrl)) {
          const full = href.startsWith('/') ? `${baseUrl}${href}` : href;
          if (!visited.has(full) && !queue.includes(full)) {
            queue.push(full);
          }
        }
      });
    } catch (e: any) {
      issues.push(`Failed to crawl ${url}: ${e.message}`);
    }
  }

  return { pages, titles, slugs, issues };
}

export function calculateSeoScore(article: {
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  h1?: string | null;
  content?: string | null;
  keyword: string;
  wordCount?: number | null;
  faqSection?: unknown;
  internalLinks?: unknown;
  schemaMarkup?: unknown;
}): number {
  let score = 0;

  if (article.title?.toLowerCase().includes(article.keyword.toLowerCase())) score += 15;
  if (article.metaTitle) {
    score += 10;
    if (article.metaTitle.length <= 60) score += 5;
  }
  if (article.metaDescription) {
    score += 10;
    if (article.metaDescription.length <= 160) score += 5;
  }
  if (article.h1?.toLowerCase().includes(article.keyword.toLowerCase())) score += 10;
  if ((article.wordCount ?? 0) >= 1500) score += 15;
  else if ((article.wordCount ?? 0) >= 800) score += 8;
  if (Array.isArray(article.faqSection) && (article.faqSection as unknown[]).length > 0) score += 10;
  if (Array.isArray(article.internalLinks) && (article.internalLinks as unknown[]).length > 0) score += 5;
  if (article.schemaMarkup) score += 10;
  if (article.content?.toLowerCase().includes(article.keyword.toLowerCase())) score += 5;

  return Math.min(100, score);
}
