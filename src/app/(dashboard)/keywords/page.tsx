import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Hash, Plus, Search, TrendingUp, Wand2, Layers } from 'lucide-react';

export const metadata = { title: 'Anahtar Kelimeler' };

const intentColors: Record<string, string> = {
  INFORMATIONAL: 'bg-blue-100 text-blue-700',
  COMMERCIAL: 'bg-green-100 text-green-700',
  TRANSACTIONAL: 'bg-purple-100 text-purple-700',
  NAVIGATIONAL: 'bg-orange-100 text-orange-700',
  COMPARISON: 'bg-pink-100 text-pink-700',
};

const intentLabels: Record<string, string> = {
  INFORMATIONAL: 'Bilgilendirici',
  COMMERCIAL: 'Ticari',
  TRANSACTIONAL: 'İşlemsel',
  NAVIGATIONAL: 'Navigasyon',
  COMPARISON: 'Karşılaştırma',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
  IN_USE: 'bg-blue-100 text-blue-700',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Bekliyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  IN_USE: 'Kullanımda',
};

export default async function KeywordsPage({ searchParams }: { searchParams: { project?: string; intent?: string; status?: string } }) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!orgId) return null;

  const projects = await prisma.project.findMany({ where: { organizationId: orgId }, select: { id: true, name: true } });
  const projectId = searchParams.project ?? projects[0]?.id;

  const keywords = projectId ? await prisma.keyword.findMany({
    where: {
      projectId,
      ...(searchParams.intent ? { intent: searchParams.intent as any } : {}),
      ...(searchParams.status ? { status: searchParams.status as any } : {}),
    },
    include: { cluster: { select: { name: true } } },
    orderBy: [{ searchVolume: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  }) : [];

  const stats = projectId ? await prisma.keyword.groupBy({
    by: ['intent'],
    where: { projectId },
    _count: { _all: true },
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Anahtar Kelimeler</h1>
          <p className="text-slate-500 mt-1">{keywords.length} anahtar kelime bulundu</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/keywords/clusters" className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Layers className="w-4 h-4" /> Konu Kümeleri
          </Link>
          <Link href={`/keywords/research${projectId ? `?project=${projectId}` : ''}`} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors">
            <Wand2 className="w-4 h-4" /> AI Araştır
          </Link>
          <Link href="/keywords/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Ekle
          </Link>
        </div>
      </div>

      {/* Intent stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(intentLabels).map(([intent, label]) => {
          const count = stats.find(s => s.intent === intent)?._count._all ?? 0;
          return (
            <Link key={intent} href={`/keywords?${projectId ? `project=${projectId}&` : ''}intent=${intent}`} className={`p-3 rounded-xl border text-center hover:shadow-sm transition-all ${searchParams.intent === intent ? 'border-blue-400 bg-blue-50' : 'bg-white border-slate-200'}`}>
              <div className="text-xl font-bold text-slate-900">{count}</div>
              <div className={`text-xs px-1.5 py-0.5 rounded-full inline-block mt-1 ${intentColors[intent]}`}>{label}</div>
            </Link>
          );
        })}
      </div>

      {/* Project selector + search */}
      {projects.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {projects.map(p => (
            <Link key={p.id} href={`/keywords?project=${p.id}`} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${projectId === p.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
              {p.name}
            </Link>
          ))}
        </div>
      )}

      {/* Keywords table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input placeholder="Anahtar kelime ara..." className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <TrendingUp className="w-4 h-4" /> Arama hacmine göre sıralı
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Anahtar Kelime</th>
                <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Hacim</th>
                <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Güçlük</th>
                <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Niyet</th>
                <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Küme</th>
                <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Durum</th>
                <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {keywords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Hash className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Henüz anahtar kelime yok.</p>
                    <Link href={`/keywords/research${projectId ? `?project=${projectId}` : ''}`} className="mt-2 inline-block text-sm text-blue-600 hover:underline">AI ile araştırın</Link>
                  </td>
                </tr>
              ) : keywords.map(kw => (
                <tr key={kw.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {kw.isPillar && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">Pillar</span>}
                      <span className="text-sm font-medium text-slate-900">{kw.phrase}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">{kw.searchVolume?.toLocaleString() ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {kw.difficulty != null ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-12 bg-slate-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${kw.difficulty >= 70 ? 'bg-red-500' : kw.difficulty >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${kw.difficulty}%` }} />
                        </div>
                        <span className="text-xs text-slate-600">{kw.difficulty}</span>
                      </div>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intentColors[kw.intent]}`}>{intentLabels[kw.intent]}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{kw.cluster?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[kw.status]}`}>{statusLabels[kw.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/content/new?keyword=${kw.id}`} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg transition-colors">
                      İçerik Oluştur
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
