import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function formatDate(date: Date | string, locale = 'tr-TR'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatNumber(n: number, locale = 'tr-TR'): string {
  return new Intl.NumberFormat(locale).format(n);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '…';
}

export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'wrf_';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function readingTime(wordCount: number): number {
  return Math.ceil(wordCount / 200);
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

export function planLimits(plan: string) {
  const limits: Record<string, { articles: number; keywords: number; projects: number; members: number }> = {
    FREE: { articles: 5, keywords: 50, projects: 1, members: 1 },
    STARTER: { articles: 50, keywords: 500, projects: 3, members: 3 },
    PRO: { articles: 200, keywords: 2000, projects: 10, members: 10 },
    ENTERPRISE: { articles: -1, keywords: -1, projects: -1, members: -1 },
  };
  return limits[plan] ?? limits.FREE;
}
