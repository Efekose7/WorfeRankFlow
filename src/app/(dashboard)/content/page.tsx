import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { FileText, Plus, Wand2, Search, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'İçerik Yönetimi' };

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Taslak', color: 'bg-slate-100 text-slate-600' },
  GENERATING: { label: 'Oluşturuluyor', color: 'bg-blue-100 text-blue-700' },
  QA_PENDING: { label: 'Kalite Kontrolü', color: 'bg-yellow-100 text-yellow-700' },
  QA_FAILED: { label: 'QA Hatası', color: 'bg-red-100 text-red-600' },
  APPROVED: { label: 'Onaylandı', color: 'bg-emerald-100 text-emerald-700' },
  SCHEDULED: { label: 'Zamanlandı', color: 'bg-indigo-100 text-indigo-700' },
  PUBLISHING: { label: 'Yayınlanıyor', color: 'bg-blue-100 text-blue-600' },
  PUBLISHED: { label: 'Yayınlandı', color: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Başarısız', color: 'bg-red-100 text-red-600' },
  ARCHIVED: { label: 'Arşivlendi', color: 'bg-slate-100 text-slate-500' },
};

export default async function ContentPage({ searchParams }: { searchParams: { project?: string; status?: string } }) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!orgId) return null;

  const projects = await prisma.project.findMany({ where: { organizationId: orgId }, select: { id: true, name: true } });
  const projectFilter = searchParams.project ?? projects[0]?.id;

  const articles = projectFilter ? await prisma.article.findMany({
    where: {
      projectId: projectFilter,
      ...(searchParams.status ? { status: searchParams.status as any } : {}),
    },
    include: { keyword: { select: { phrase: true } }, cluster: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  }) : [];

  const counts = projectFilter ? await prisma.article.groupBy({
    by: ['status'],
    where: { projectId: projectFilter },
    _count: { _all: true },
  }) : [];

  const totalByStatus = Object.fromEntries(counts.map(c => [c.status, c._count._all]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">İçerik Yönetimi</h1>
          <p className="text-slate-500 mt-1">{articles.length} makale</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/content/generate${projectFilter ? `?project=${projectFilter}` : ''}`} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors">
            <Wand2 className="w-4 h-4" /> AI ile Oluştur
          </Link>
          <Link href="/content/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Yeni Makale
          </Link>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Link href={`/content${projectFilter ? `?project=${projectFilter}` : ''}`} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${!searchParams.status ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
          Tümü ({articles.length})
        </Link>
        {Object.entries(statusConfig).map(([status, cfg]) => {
          const count = totalByStatus[status] ?? 0;
          if (!count) return null;
          return (
            <Link key={status} href={`/content?${projectFilter ? `project=${projectFilter}&` : ''}status=${status}`} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${searchParams.status === status ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
              {cfg.label} ({count})
            </Link>
          );
        })}
      </div>

      {/* Project tabs */}
      {projects.length > 1 && (
        <div className="flex gap-2">
          {projects.map(p => (
            <Link key={p.id} href={`/content?project=${p.id}${searchParams.status ? `&status=${searchParams.status}` : ''}`} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${projectFilter === p.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
              {p.name}
            </Link>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input placeholder="Makale ara..." className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" /> Filtrele
          </button>
        </div>

        {articles.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-700 mb-2">Henüz makale yok</h3>
            <p className="text-slate-400 text-sm mb-6">AI ile otomatik makale oluşturun veya manuel olarak ekleyin</p>
            <Link href={`/content/generate${projectFilter ? `?project=${projectFilter}` : ''}`} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium inline-flex items-center gap-2 hover:bg-blue-500 transition-colors">
              <Wand2 className="w-4 h-4" /> AI ile Oluştur
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Başlık</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">SEO</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Kelime</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Dil</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Anahtar Kelime</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Durum</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Tarih</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {articles.map(article => (
                  <tr key={article.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 max-w-xs truncate">{article.title}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">/{article.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {article.seoScore != null ? (
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${article.seoScore >= 80 ? 'bg-green-100 text-green-700' : article.seoScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {article.seoScore}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">{article.wordCount?.toLocaleString() ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium uppercase">{article.locale}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{article.keyword?.phrase ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[article.status]?.color ?? 'bg-slate-100 text-slate-600'}`}>
                        {statusConfig[article.status]?.label ?? article.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(article.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/content/${article.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Görüntüle</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
