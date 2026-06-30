import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { BarChart3, TrendingUp, MousePointer, Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const metadata = { title: 'Analitik' };

export default async function AnalyticsPage({ searchParams }: { searchParams: { project?: string } }) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!orgId) return null;

  const projects = await prisma.project.findMany({ where: { organizationId: orgId }, select: { id: true, name: true } });
  const projectId = searchParams.project ?? projects[0]?.id;

  const analytics = projectId ? await prisma.analyticsRecord.findMany({
    where: { projectId, date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    orderBy: { date: 'asc' },
    take: 30,
  }) : [];

  const totals = analytics.reduce((acc, r) => ({
    clicks: acc.clicks + r.clicks,
    impressions: acc.impressions + r.impressions,
    ctr: acc.ctr + r.ctr,
    count: acc.count + 1,
  }), { clicks: 0, impressions: 0, ctr: 0, count: 0 });

  const avgCtr = totals.count ? (totals.ctr / totals.count).toFixed(1) : '0';

  const topArticles = projectId ? await prisma.article.findMany({
    where: { projectId, status: 'PUBLISHED' },
    orderBy: { seoScore: 'desc' },
    take: 5,
    select: { id: true, title: true, seoScore: true, wordCount: true, publishedAt: true, slug: true },
  }) : [];

  const statCards = [
    { label: 'Toplam Tıklama', value: totals.clicks.toLocaleString(), icon: MousePointer, color: 'text-blue-600', bg: 'bg-blue-50', change: '+12%', up: true },
    { label: 'Gösterim', value: totals.impressions.toLocaleString(), icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50', change: '+24%', up: true },
    { label: 'Ort. TO', value: `${avgCtr}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', change: '+3%', up: true },
    { label: 'Yayınlanan Makale', value: topArticles.length.toString(), icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50', change: '+5%', up: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analitik</h1>
          <p className="text-slate-500 mt-1">Son 30 günün performans metrikleri</p>
        </div>
        {projects.length > 1 && (
          <div className="flex gap-2">
            {projects.map(p => (
              <a key={p.id} href={`/analytics?project=${p.id}`} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${projectId === p.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                {p.name}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-medium ${card.up ? 'text-green-600' : 'text-red-600'}`}>
                {card.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {card.change}
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{card.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-4">Tıklama ve Gösterim Trendi</h2>
        {analytics.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Google Search Console entegrasyonu ile verilerinizi görüntüleyin</p>
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-end gap-1">
            {analytics.slice(-14).map((r, i) => (
              <div key={i} className="flex-1 flex flex-col gap-0.5">
                <div className="bg-blue-200 rounded-t" style={{ height: `${Math.max(4, (r.impressions / Math.max(...analytics.map(a => a.impressions), 1)) * 160)}px` }} />
                <div className="bg-blue-600 rounded-t" style={{ height: `${Math.max(2, (r.clicks / Math.max(...analytics.map(a => a.clicks), 1)) * 40)}px` }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top articles */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">En İyi Performanslı Makaleler</h2>
        </div>
        {topArticles.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">Henüz yayınlanan makale yok</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {topArticles.map((article, i) => (
              <div key={article.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{article.title}</div>
                  <div className="text-xs text-slate-500">/{article.slug}</div>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${(article.seoScore ?? 0) >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  SEO {article.seoScore ?? '—'}
                </div>
                <div className="text-xs text-slate-500 flex-shrink-0">{article.wordCount?.toLocaleString()} kelime</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
