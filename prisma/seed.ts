// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Demo organization and user
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      plan: 'STARTER',
      quotaArticles: 50,
      quotaKeywords: 500,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'demo@worferankflow.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@worferankflow.com',
      locale: 'tr',
      memberships: {
        create: {
          organizationId: org.id,
          role: 'OWNER',
        },
      },
    },
  });

  // Demo project
  const project = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {},
    create: {
      id: 'demo-project-1',
      organizationId: org.id,
      name: 'Demo Blog',
      domain: 'demo.example.com',
      niche: 'Teknoloji ve Yazılım',
      locale: 'tr',
      targetLocales: ['tr', 'en'],
      brandVoice: 'Profesyonel',
      targetAudience: 'Yazılım geliştiricileri ve teknoloji meraklıları',
    },
  });

  // Demo keywords
  const keywords = [
    { phrase: 'next.js nedir', intent: 'INFORMATIONAL' as const, searchVolume: 2400, difficulty: 35 },
    { phrase: 'react vs vue', intent: 'COMPARISON' as const, searchVolume: 1800, difficulty: 55 },
    { phrase: 'typescript öğren', intent: 'INFORMATIONAL' as const, searchVolume: 3200, difficulty: 40 },
    { phrase: 'web geliştirme kurs satın al', intent: 'TRANSACTIONAL' as const, searchVolume: 900, difficulty: 65 },
    { phrase: 'en iyi frontend framework', intent: 'COMMERCIAL' as const, searchVolume: 1500, difficulty: 45 },
  ];

  for (const kw of keywords) {
    await prisma.keyword.upsert({
      where: { projectId_phrase_locale: { projectId: project.id, phrase: kw.phrase, locale: 'tr' } },
      update: {},
      create: { projectId: project.id, locale: 'tr', status: 'PENDING', ...kw },
    });
  }

  console.log('✅ Seed complete!');
  console.log(`   Org: ${org.name} (${org.id})`);
  console.log(`   User: ${user.email}`);
  console.log(`   Project: ${project.name}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
