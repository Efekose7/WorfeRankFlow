import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Globe, Plus, Settings, Hash, FileText, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Projeler' };

export default async function ProjectsPage() {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!orgId) return null;

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    include: {
      _count: { select: { keywords: true, articles: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusColors = { ACTIVE: 'bg-green-100 text-green-700', PAUSED: 'bg-yellow-100 text-yellow-700', ARCHIVED: 'bg-slate-100 text-slate-500' };
  const statusLabels = { ACTIVE: 'Aktif', PAUSED: 'Duraklatıldı', ARCHIVED: 'Arşivlendi' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projeler</h1>
          <p className="text-slate-500 mt-1">Web siteleriniz ve SEO projeleriniz</p>
        </div>
        <Link href="/projects/new" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Yeni Proje
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-16 text-center">
          <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Henüz proje yok</h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">İlk projenizi oluşturun ve web siteniz için otomatik SEO içerik üretimine başlayın.</p>
          <Link href="/projects/new" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-medium inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> İlk Projeyi Oluştur
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-200 group">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[project.status]}`}>
                    {statusLabels[project.status]}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{project.name}</h3>
                <p className="text-sm text-blue-600">{project.domain}</p>
                {project.niche && <p className="text-xs text-slate-500 mt-1">{project.niche}</p>}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span>{project._count.keywords} kelime</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>{project._count.articles} makale</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto text-xs text-slate-400">
                    {project.targetLocales.map(l => l.toUpperCase()).join(', ')}
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 flex">
                <Link href={`/projects/${project.id}`} className="flex-1 py-3 text-center text-sm text-blue-600 hover:bg-blue-50 font-medium transition-colors flex items-center justify-center gap-1.5">
                  Görüntüle <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <div className="border-l border-slate-100" />
                <Link href={`/projects/${project.id}/settings`} className="px-4 py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                  <Settings className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
