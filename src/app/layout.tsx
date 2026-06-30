import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: {
    default: 'Worfe RankFlow - AI Destekli SEO İçerik Platformu',
    template: '%s | Worfe RankFlow',
  },
  description: 'Yapay zeka ile anahtar kelime araştırması, SEO içerik üretimi ve otomatik yayınlama platformu.',
  keywords: ['SEO', 'içerik üretimi', 'yapay zeka', 'anahtar kelime', 'WordPress', 'Shopify'],
  authors: [{ name: 'Worfe RankFlow' }],
  creator: 'Worfe RankFlow',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'Worfe RankFlow',
    description: 'AI Destekli SEO İçerik Platformu',
    siteName: 'Worfe RankFlow',
  },
  twitter: { card: 'summary_large_image', title: 'Worfe RankFlow', description: 'AI Destekli SEO İçerik Platformu' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
