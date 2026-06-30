import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { FileText, Hash, TrendingUp, Zap, ArrowRight, BarChart3, Globe, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Gösterge Paneli' };

async function getDashboardStats(orgId: string) {
  const [articles, keywords, publishedArticles, projects] = await Promise.all([
    prisma.article.count({ where: { project: { organizationId: orgId } } }),
    prisma.keyword.count({ where: { project: { organizationId: orgId } } }),
    prisma.article.count({ where: { project: { organizationId: orgId }, status: 'PUBLISHED' } }),
    prisma.project.count({ where: { organizationId: orgId } }),
  ]);

  const recentArticles = await prisma.article.findMany({
    where: { project: { organizationId: orgId } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, title: true, status: true, seoScore: true, createdAt: true, project: { select: { name: true } } },
  });

  const avgSeoScore = await prisma.article.aggregate({
    where: { project: { organizationId: orgId }, seoScore: { not: null } },
    _avg: { seoScore: true },
  });

  return { articles, keywords, publishedArticles, projects, recentArticles, avgSeoScore: Math.round(avgSeoScore._avg.seoScore ?? 0) };
}

const statusColors: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-700',
  DRAFT: 'bg-slate-100 text-slate-600',
  GENERATING: 'bg-blue-100 text-blue-700',
  QA_PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  PUBLISHED: 'Yayınlandı', DRAFT: 'Taslak', GENERATING: 'Oluşturuluyor',
  QA_PENDING: 'Kalite Kontrolü', APPROVED: 'Onaylandı', FAILED: 'Başarısız',
};

export default async function DashboardPage() {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;

  if (!orgId) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Organizasyon bulunamadı</h2>
        <Link href="/onboarding" className="bg-blue-600 text-white px-6 py-3 rounded-xl">Kurulumu Tamamla</Link>
      </div>
    );
  }

  const stats = await getDashboardStats(orgId);

  const statCards = [
    { label: 'Toplam Makale', value: stats.articles, icon: FileText, color: 'bg-blue-500', change: '+12%' },
    { label: 'Yayınlanan', value: stats.publishedArticles, icon: Globe, color: 'bg-green-500', change: '+8%' },
    { label: 'Anahtar Kelime', value: stats.keywords, icon: Hash, color: 'bg-purple-500', change: '+24%' },
    { label: 'Ort. SEO Skoru', value: stats.avgSeoScore, icon: TrendingUp, color: 'bg-orange-500', suffix: '/100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gösterge Paneli</h1>
        <p className="text-slate-500 mt-1">Platform genel durumu ve özet istatistikler</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${card.color} bg-opacity-10 rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color.replace('bg-', 'text-')}`} />
              </div>
              {card.change && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">{card.change}</span>
              )}
            </div>
            <div className="text-3xl font-bold text-slate-900">{card.value}{card.suffix ?? ''}</div>
            <div className="text-sm text-slate-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { href: '/content/new', icon: Zap, title: 'İçerik Oluştur', desc: 'AI ile yeni SEO makalesi oluşturun', color: 'bg-blue-600' },
          { href: '/keywords/research', icon: Hash, title: 'Anahtar Kelime Araştır', desc: 'Yeni anahtar kelimeler keşfedin', color: 'bg-purple-600' },
          { href: '/analytics', icon: BarChart3, title: 'Analitik Görüntüle', desc: 'Performans metriklerini inceleyin', color: 'bg-green-600' },
        ].map((action) => (
          <Link key={action.href} href={action.href} className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group">
            <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center mb-3`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{action.title}</div>
            <div className="text-sm text-slate-500 mt-1">{action.desc}</div>
            <div className="flex items-center gap-1 text-blue-600 text-xs mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Başla <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Articles */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Son Makaleler</h2>
          <Link href="/content" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {stats.recentArticles.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Henüz makale oluşturulmamış.</p>
              <Link href="/content/new" className="mt-3 inline-block text-sm text-blue-600 hover:underline">İlk makalenizi oluşturun</Link>
            </div>
          ) : (
            stats.recentArticles.map((article) => (
              <div key={article.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{article.title}</div>
                  <div className="text-xs text-slate-500">{article.project.name}</div>
                </div>
                <div className="flex items-center gap-3">
                  {article.seoScore && (
                    <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${article.seoScore >= 80 ? 'bg-green-100 text-green-700' : article.seoScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {article.seoScore}
                    </div>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[article.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {statusLabels[article.status] ?? article.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
