# Worfe RankFlow

**AI-Powered Multi-Tenant SEO Content SaaS Platform**

A production-ready SaaS platform that combines artificial intelligence, SEO analysis, and content management into a single automated ecosystem. Supports Turkish (default), English, Russian, and Arabic throughout the entire system.

---

## Features

### Core Platform
- **Multi-tenant Architecture** — Organization-based isolation with roles (Owner, Admin, Editor, Member)
- **4-Language Support** — Turkish (default), English, Russian, Arabic — UI, AI content, keywords, and reports
- **AI Domain Analysis** — Automatic niche, brand voice, and audience detection on website connection
- **Subscription Management** — Stripe-powered billing with FREE/STARTER/PRO/ENTERPRISE plans

### Keyword Intelligence
- **AI Keyword Research** — High-volume, low-competition keyword discovery via GPT-4o
- **Search Intent Classification** — Informational, Commercial, Transactional, Navigational, Comparison
- **Topic Clustering** — Automatic pillar-cluster architecture generation
- **Duplicate Detection** — Prevents overlapping content across articles
- **Content Gap Analysis** — Identifies missing content opportunities

### AI Content Generation
- **GPT-4o Powered** — Full article generation (1,500+ words)
- **Complete SEO Package** — Title, URL slug, meta title/description, H1-H6 hierarchy
- **Structured Data** — Schema.org JSON-LD markup
- **FAQ Sections** — Automatically generated Q&A
- **Internal/External Links** — AI-suggested link strategy
- **Image Alt Texts** — SEO-optimized image metadata
- **Hreflang Tags** — Multi-language SEO support
- **Open Graph** — Social media preview metadata

### Quality Assurance Pipeline
- Duplicate content check
- Keyword stuffing detection
- Readability scoring
- Originality scoring
- E-E-A-T compliance evaluation
- Semantic SEO analysis
- Automatic rewrite if quality fails

### Publishing & Integrations
- **WordPress** — REST API + Application Passwords
- **Shopify** — Admin API integration
- **Webflow** — CMS integration
- **Wix** — Blog publishing
- **Custom REST API** — Any CMS with Bearer token auth
- **Webhooks** — HMAC-signed event notifications

### Automation
- **Content Scheduling** — Daily/Weekly/Monthly publishing schedules
- **Queue Architecture** — BullMQ + Redis for reliable background jobs
- **Auto-retry** — Failed publishing attempts retried with exponential backoff
- **Audit Logging** — Full operation history

### Analytics & Monitoring
- Keyword ranking tracking
- Organic traffic metrics (CTR, impressions, clicks)
- Indexing status monitoring
- Article performance scoring
- Automatic re-optimization of underperformers

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (via Prisma ORM) |
| Auth | NextAuth v5 (Google OAuth + Credentials) |
| AI | OpenAI GPT-4o |
| Queue | BullMQ + Redis |
| Billing | Stripe |
| UI | Radix UI primitives |
| State | React Query + Zustand |
| i18n | next-i18next |
| Web Scraping | Cheerio + Axios |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis instance
- OpenAI API key
- Stripe account (for billing)

### Installation

```bash
git clone https://github.com/efekose7/worferankflow.git
cd worferankflow
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your credentials
```

### Database Setup

```bash
npm run db:push        # Push schema to database
npm run db:generate    # Generate Prisma client
npm run db:seed        # Seed with demo data
```

### Development

```bash
npm run dev
# Open http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Auth pages (signin, signup)
│   ├── (dashboard)/     # Protected dashboard routes
│   │   ├── dashboard/   # Overview stats
│   │   ├── projects/    # Project management
│   │   ├── keywords/    # Keyword research & clusters
│   │   ├── content/     # Article management & generation
│   │   ├── analytics/   # SEO analytics
│   │   ├── integrations/# CMS integrations
│   │   ├── team/        # Team & roles
│   │   ├── billing/     # Plans & invoices
│   │   └── settings/    # Account settings
│   ├── api/             # API routes
│   └── page.tsx         # Marketing landing page
├── components/
│   ├── layout/          # Sidebar, TopBar
│   └── ui/              # Reusable UI components
├── lib/
│   ├── ai/              # OpenAI integration
│   ├── integrations/    # WordPress, Shopify, webhooks
│   ├── queue/           # BullMQ job definitions
│   ├── seo/             # SEO analysis tools
│   ├── i18n/            # Locale config
│   ├── auth.ts          # NextAuth config
│   ├── db.ts            # Prisma client
│   ├── crypto.ts        # Encryption utilities
│   └── utils.ts         # Shared utilities
├── middleware.ts         # Auth middleware
└── types/               # TypeScript types
prisma/
├── schema.prisma        # Full database schema
└── seed.ts              # Demo data seeder
public/
└── locales/             # i18n translation files (tr/en/ru/ar)
```

---

## API Reference

### Projects
- `GET /api/projects` — List projects
- `POST /api/projects` — Create project
- `POST /api/projects/analyze-domain` — AI domain analysis

### Keywords
- `GET /api/keywords` — List keywords
- `POST /api/keywords` — Add keyword
- `POST /api/keywords/research` — AI keyword research
- `POST /api/keywords/bulk` — Bulk import keywords
- `POST /api/keywords/build-clusters` — AI topic clustering

### Articles
- `POST /api/articles/generate` — Generate article with AI
- `POST /api/articles/[id]/publish` — Publish to integrations

### Integrations
- `GET /api/integrations` — List integrations
- `POST /api/integrations` — Add integration
- `POST /api/integrations/[id]/test` — Test connection
- `DELETE /api/integrations/[id]` — Remove integration

### Billing
- `POST /api/billing/checkout` — Stripe checkout session
- `POST /api/billing/webhook` — Stripe webhook handler

---

## Environment Variables

See `.env.example` for all required variables.

---

## License

MIT © 2024 Worfe RankFlow
