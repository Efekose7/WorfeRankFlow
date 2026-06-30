import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Layers, Hash, FileText, Wand2, Plus } from 'lucide-react';

export const metadata = { title: 'Konu Kümeleri' };

export default async function TopicClustersPage({ searchParams }: { searchParams: { project?: string } }) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!orgId) return null;

  const projects = await prisma.project.findMany({ where: { organizationId: orgId }, select: { id: true, name: true } });
  const projectId = searchParams.project ?? projects[0]?.id;

  const clusters = projectId ? await prisma.topicCluster.findMany({
    where: { projectId },
    include: {
      _count: { select: { keywords: true, articles: true } },
      keywords: { take: 5, select: { phrase: true, intent: true } },
    },
    orderBy: { createdAt: 'desc' },
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Konu Kümeleri</h1>
          <p className="text-slate-500 mt-1">Pillar-cluster içerik mimarisi</p>
        </div>
        <div className="flex items-center gap-3">
          <form action="/api/keywords/build-clusters" method="POST">
            <input type="hidden" name="projectId" value={projectId ?? ''} />
            <button type="submit" className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors">
              <Wand2 className="w-4 h-4" /> AI ile Oluştur
            </button>
          </form>
          <Link href="/keywords/clusters/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Yeni Küme
          </Link>
        </div>
      </div>

      {clusters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 mb-2">Henüz konu kümesi yok</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Anahtar kelimelerinizi konu kümelerine göre organize edin. AI, anahtar kelimelerinizi otomatik olarak kümeleyebilir.
          </p>
          <form action="/api/keywords/build-clusters" method="POST">
            <input type="hidden" name="projectId" value={projectId ?? ''} />
            <button type="submit" className="bg-purple-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-purple-500 transition-colors flex items-center gap-2 mx-auto">
              <Wand2 className="w-4 h-4" /> AI ile Otomatik Oluştur
            </button>
          </form>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map(cluster => (
            <div key={cluster.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-200">
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Layers className="w-4.5 h-4.5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900">{cluster.name}</h3>
                    {cluster.pillarTitle && (
                      <div className="text-xs text-purple-600 mt-0.5">Pillar: {cluster.pillarTitle}</div>
                    )}
                  </div>
                </div>
                {cluster.description && <p className="text-xs text-slate-500 mb-3">{cluster.description}</p>}
                {cluster.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {cluster.keywords.map(kw => (
                      <span key={kw.phrase} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{kw.phrase}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Hash className="w-3.5 h-3.5" /> {cluster._count.keywords} kelime
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <FileText className="w-3.5 h-3.5" /> {cluster._count.articles} makale
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 flex">
                <Link href={`/keywords?cluster=${cluster.id}`} className="flex-1 py-2.5 text-center text-xs text-blue-600 hover:bg-blue-50 font-medium transition-colors">
                  Kelimeleri Gör
                </Link>
                <div className="border-l border-slate-100" />
                <Link href={`/content/generate?cluster=${cluster.id}`} className="flex-1 py-2.5 text-center text-xs text-purple-600 hover:bg-purple-50 font-medium transition-colors">
                  İçerik Oluştur
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
