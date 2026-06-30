import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Send, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({ where: { id: params.id }, select: { title: true } });
  return { title: article?.title ?? 'Makale' };
}

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!session?.user || !orgId) return notFound();

  const article = await prisma.article.findFirst({
    where: { id: params.id, project: { organizationId: orgId } },
    include: {
      keyword: { select: { phrase: true, intent: true } },
      cluster: { select: { name: true } },
      qaResults: true,
      publishHistory: { include: { integration: { select: { name: true, type: true } } }, orderBy: { createdAt: 'desc' }, take: 5 },
      project: { select: { name: true, domain: true } },
    },
  });

  if (!article) return notFound();

  const faq = Array.isArray(article.faqSection) ? article.faqSection as Array<{ question: string; answer: string }> : [];
  const internalLinks = Array.isArray(article.internalLinks) ? article.internalLinks as Array<{ anchor: string; suggestion: string }> : [];
  const externalLinks = Array.isArray(article.externalLinks) ? article.externalLinks as Array<{ anchor: string; url: string }> : [];
  const schema = article.schemaMarkup ? JSON.stringify(article.schemaMarkup, null, 2) : null;

  const statusLabels: Record<string, string> = {
    DRAFT: 'Taslak', GENERATING: 'Oluşturuluyor', QA_PENDING: 'Kalite Kontrolü', QA_FAILED: 'QA Hatası',
    APPROVED: 'Onaylandı', SCHEDULED: 'Zamanlandı', PUBLISHING: 'Yayınlanıyor', PUBLISHED: 'Yayınlandı',
    FAILED: 'Başarısız', ARCHIVED: 'Arşivlendi',
  };

  const statusColor: Record<string, string> = {
    PUBLISHED: 'bg-green-100 text-green-700', APPROVED: 'bg-emerald-100 text-emerald-700',
    DRAFT: 'bg-slate-100 text-slate-600', QA_FAILED: 'bg-red-100 text-red-600',
    GENERATING: 'bg-blue-100 text-blue-700', FAILED: 'bg-red-100 text-red-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/content" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 leading-tight">{article.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-slate-500">{article.project.name}</span>
            <span className="text-slate-300">•</span>
            <span className="text-sm text-slate-500">{formatDate(article.createdAt)}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[article.status] ?? 'bg-slate-100 text-slate-600'}`}>
              {statusLabels[article.status] ?? article.status}
            </span>
          </div>
        </div>
        {article.status === 'APPROVED' && (
          <form action={`/api/articles/${article.id}/publish`} method="POST">
            <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <Send className="w-4 h-4" /> Yayınla
            </button>
          </form>
        )}
        {article.externalUrl && (
          <a href={article.externalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-slate-200 px-4 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            <ExternalLink className="w-4 h-4" /> Görüntüle
          </a>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* SEO Meta */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-semibold text-slate-900">SEO Metadata</h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500 mb-0.5">Meta Başlık ({article.metaTitle?.length ?? 0}/60)</div>
                <div className="text-sm font-medium text-slate-900 bg-slate-50 rounded-lg p-2">{article.metaTitle ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-0.5">Meta Açıklama ({article.metaDescription?.length ?? 0}/160)</div>
                <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2">{article.metaDescription ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-0.5">H1</div>
                <div className="text-sm font-medium text-slate-900 bg-slate-50 rounded-lg p-2">{article.h1 ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-0.5">URL Slug</div>
                <div className="text-sm font-mono text-blue-600 bg-slate-50 rounded-lg p-2">/{article.slug}</div>
              </div>
              {article.canonicalUrl && (
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">Canonical URL</div>
                  <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2">{article.canonicalUrl}</div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">İçerik</h2>
            {article.content ? (
              <div className="prose prose-slate max-w-none text-sm">
                <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">{article.content.slice(0, 2000)}{article.content.length > 2000 ? '...' : ''}</pre>
              </div>
            ) : (
              <div className="text-slate-400 text-sm">İçerik henüz oluşturulmamış</div>
            )}
          </div>

          {/* FAQ */}
          {faq.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Sıkça Sorulan Sorular</h2>
              <div className="space-y-4">
                {faq.map((item, i) => (
                  <div key={i} className="border-l-2 border-blue-200 pl-4">
                    <div className="font-medium text-slate-900 text-sm mb-1">{item.question}</div>
                    <div className="text-slate-600 text-sm">{item.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schema Markup */}
          {schema && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Schema.org Yapılandırılmış Veri</h2>
              <pre className="text-xs font-mono bg-slate-900 text-green-400 p-4 rounded-xl overflow-auto max-h-64">{schema}</pre>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Scores */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Kalite Puanları</h2>
            <div className="space-y-2.5">
              {[
                { label: 'SEO Skoru', value: article.seoScore },
                { label: 'Okunabilirlik', value: article.readabilityScore },
                { label: 'Özgünlük', value: article.originalityScore },
                { label: 'E-E-A-T', value: article.eeatScore },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">{s.label}</span>
                    <span className={`font-bold ${(s.value ?? 0) >= 80 ? 'text-green-600' : (s.value ?? 0) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{s.value ?? '—'}</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${(s.value ?? 0) >= 80 ? 'bg-green-500' : (s.value ?? 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${s.value ?? 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-3">İçerik Bilgileri</h2>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Dil', value: article.locale.toUpperCase() },
                { label: 'Kelime Sayısı', value: article.wordCount?.toLocaleString() ?? '—' },
                { label: 'Okuma Süresi', value: article.readingTime ? `${article.readingTime} dk` : '—' },
                { label: 'AI Modeli', value: article.aiModel ?? '—' },
                { label: 'Token Kullanımı', value: article.tokensUsed?.toLocaleString() ?? '—' },
                { label: 'Anahtar Kelime', value: article.keyword?.phrase ?? '—' },
                { label: 'Konu Kümesi', value: article.cluster?.name ?? '—' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-medium text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* QA Results */}
          {article.qaResults.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Kalite Kontrol</h2>
              <div className="space-y-1.5">
                {article.qaResults.map(qa => (
                  <div key={qa.id} className="flex items-center gap-2 text-sm">
                    {qa.passed ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    <span className={qa.passed ? 'text-slate-700' : 'text-red-700'}>{qa.checkType.replace(/_/g, ' ')}</span>
                    {qa.score != null && <span className="ml-auto text-xs text-slate-500">{qa.score}</span>}
                  </div>
                ))}
              </div>
              {!article.qualityPassed && (
                <div className="mt-3 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Kalite kontrol başarısız. Yeniden oluşturun veya manuel olarak düzenleyin.
                </div>
              )}
            </div>
          )}

          {/* Internal Links */}
          {internalLinks.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-3">İç Link Önerileri</h2>
              <div className="space-y-2">
                {internalLinks.map((link, i) => (
                  <div key={i} className="text-xs bg-slate-50 rounded-lg p-2">
                    <div className="font-medium text-blue-700">{link.anchor}</div>
                    <div className="text-slate-500 mt-0.5">{link.suggestion}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publish History */}
          {article.publishHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Yayın Geçmişi</h2>
              <div className="space-y-2">
                {article.publishHistory.map(h => (
                  <div key={h.id} className="flex items-center gap-2 text-xs">
                    {h.status === 'SUCCESS' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : h.status === 'FAILED' ? <XCircle className="w-3.5 h-3.5 text-red-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
                    <span className="text-slate-700">{h.integration.name}</span>
                    {h.externalUrl && (
                      <a href={h.externalUrl} target="_blank" className="ml-auto text-blue-600">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
