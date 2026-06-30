'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Globe, ArrowLeft, FileText, Tag, BarChart2, Settings,
  Plus, Loader2, ExternalLink, Calendar, Target, Users, Mic2
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  domain: string;
  description?: string;
  status: string;
  niche?: string;
  targetAudience?: string;
  brandVoice?: string;
  targetLocales: string[];
  _count?: { keywords: number; articles: number };
  createdAt: string;
}

interface Keyword {
  id: string;
  phrase: string;
  intent: string;
  status: string;
  searchVolume?: number;
  difficulty?: number;
}

interface Article {
  id: string;
  title: string;
  status: string;
  locale: string;
  seoScore?: number;
  wordCount?: number;
  createdAt: string;
}

const INTENT_COLORS: Record<string, string> = {
  INFORMATIONAL: 'bg-blue-500/10 text-blue-400',
  COMMERCIAL: 'bg-purple-500/10 text-purple-400',
  TRANSACTIONAL: 'bg-green-500/10 text-green-400',
  NAVIGATIONAL: 'bg-yellow-500/10 text-yellow-400',
  COMPARISON: 'bg-orange-500/10 text-orange-400',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400',
  PAUSED: 'bg-yellow-500/10 text-yellow-400',
  DRAFT: 'bg-slate-500/10 text-slate-400',
  GENERATING: 'bg-blue-500/10 text-blue-400',
  PUBLISHED: 'bg-emerald-500/10 text-emerald-400',
  FAILED: 'bg-red-500/10 text-red-400',
};

const LOCALE_LABELS: Record<string, string> = { tr: '🇹🇷 TR', en: '🇺🇸 EN', ru: '🇷🇺 RU', ar: '🇸🇦 AR' };

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'articles'>('overview');

  useEffect(() => {
    async function load() {
      try {
        const [projRes, kwRes, artRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/keywords?projectId=${projectId}&limit=10`),
          fetch(`/api/articles?projectId=${projectId}&limit=10`),
        ]);
        if (!projRes.ok) { router.push('/projects'); return; }
        const [proj, kw, art] = await Promise.all([projRes.json(), kwRes.json(), artRes.json()]);
        setProject(proj);
        setKeywords(kw.keywords ?? kw ?? []);
        setArticles(art.articles ?? art ?? []);
      } catch {
        router.push('/projects');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link href="/projects" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                <a
                  href={`https://${project.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-400 text-sm flex items-center gap-1 mt-0.5"
                >
                  {project.domain} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[project.status] ?? STATUS_COLORS.DRAFT}`}>
              {project.status}
            </span>
            <Link
              href={`/content/generate?projectId=${project.id}`}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Makale Üret
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Tag, label: 'Anahtar Kelime', value: project._count?.keywords ?? keywords.length, color: 'text-purple-400' },
            { icon: FileText, label: 'Makale', value: project._count?.articles ?? articles.length, color: 'text-blue-400' },
            { icon: Globe, label: 'Dil', value: project.targetLocales?.length ?? 1, color: 'text-green-400' },
            { icon: Calendar, label: 'Oluşturulma', value: new Date(project.createdAt).toLocaleDateString('tr'), color: 'text-yellow-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
          {(['overview', 'keywords', 'articles'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'overview' ? 'Genel Bakış' : tab === 'keywords' ? 'Anahtar Kelimeler' : 'Makaleler'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-white flex items-center gap-2"><Target className="w-4 h-4 text-blue-400" /> Proje Bilgileri</h2>
              {project.niche && (
                <div><p className="text-xs text-slate-500 mb-1">Niş / Sektör</p><p className="text-slate-200">{project.niche}</p></div>
              )}
              {project.description && (
                <div><p className="text-xs text-slate-500 mb-1">Açıklama</p><p className="text-slate-200 text-sm">{project.description}</p></div>
              )}
              {project.targetAudience && (
                <div><p className="text-xs text-slate-500 mb-1">Hedef Kitle</p><p className="text-slate-200 text-sm">{project.targetAudience}</p></div>
              )}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-white flex items-center gap-2"><Mic2 className="w-4 h-4 text-purple-400" /> İçerik Ayarları</h2>
              {project.brandVoice && (
                <div><p className="text-xs text-slate-500 mb-1">Marka Sesi</p><p className="text-slate-200">{project.brandVoice}</p></div>
              )}
              {project.targetLocales?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Hedef Diller</p>
                  <div className="flex gap-2 flex-wrap">
                    {project.targetLocales.map((l) => (
                      <span key={l} className="px-2 py-1 bg-white/5 rounded-lg text-sm text-slate-300">{LOCALE_LABELS[l] ?? l}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-green-400" /> Hızlı İşlemler</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Anahtar Kelime Araştır', href: `/keywords/research?projectId=${project.id}`, icon: Tag },
                  { label: 'Konu Kümeleri', href: `/keywords/clusters?projectId=${project.id}`, icon: Users },
                  { label: 'Makale Üret', href: `/content/generate?projectId=${project.id}`, icon: FileText },
                  { label: 'Analitik', href: `/analytics?projectId=${project.id}`, icon: BarChart2 },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-center"
                  >
                    <action.icon className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-slate-300">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="font-semibold text-white">Anahtar Kelimeler</h2>
              <Link href={`/keywords/research?projectId=${project.id}`} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                <Plus className="w-4 h-4" /> Araştır
              </Link>
            </div>
            {keywords.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Henüz anahtar kelime yok</p>
                <Link href={`/keywords/research?projectId=${project.id}`} className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
                  Anahtar kelime araştır →
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-white/10">
                    <th className="text-left p-4">Kelime</th>
                    <th className="text-left p-4">Intent</th>
                    <th className="text-left p-4">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw) => (
                    <tr key={kw.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 text-slate-200 text-sm">{kw.phrase}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${INTENT_COLORS[kw.intent] ?? 'bg-slate-500/10 text-slate-400'}`}>
                          {kw.intent}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[kw.status] ?? 'bg-slate-500/10 text-slate-400'}`}>
                          {kw.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Articles Tab */}
        {activeTab === 'articles' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="font-semibold text-white">Makaleler</h2>
              <Link href={`/content/generate?projectId=${project.id}`} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                <Plus className="w-4 h-4" /> Yeni Makale
              </Link>
            </div>
            {articles.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Henüz makale yok</p>
                <Link href={`/content/generate?projectId=${project.id}`} className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
                  İlk makaleyi üret →
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-white/10">
                    <th className="text-left p-4">Başlık</th>
                    <th className="text-left p-4">Dil</th>
                    <th className="text-left p-4">SEO</th>
                    <th className="text-left p-4">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((art) => (
                    <tr key={art.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <Link href={`/content/${art.id}`} className="text-slate-200 text-sm hover:text-blue-400 transition-colors line-clamp-1">
                          {art.title}
                        </Link>
                      </td>
                      <td className="p-4 text-slate-400 text-sm">{LOCALE_LABELS[art.locale] ?? art.locale}</td>
                      <td className="p-4">
                        {art.seoScore != null && (
                          <span className={`text-sm font-medium ${art.seoScore >= 70 ? 'text-green-400' : art.seoScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {art.seoScore}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[art.status] ?? 'bg-slate-500/10 text-slate-400'}`}>
                          {art.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
