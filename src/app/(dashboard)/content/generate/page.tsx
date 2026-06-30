'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Wand2, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';

interface Project { id: string; name: string; domain: string; locale: string; targetLocales: string[] }
interface Keyword { id: string; phrase: string; intent: string }

const LOCALES = [
  { code: 'tr', label: 'Türkçe 🇹🇷' },
  { code: 'en', label: 'English 🇺🇸' },
  { code: 'ru', label: 'Русский 🇷🇺' },
  { code: 'ar', label: 'العربية 🇸🇦' },
];

export default function GenerateContentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [form, setForm] = useState({ projectId: searchParams.get('project') ?? '', keywordId: searchParams.get('keyword') ?? '', locale: 'tr' });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; articleId?: string; error?: string } | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => {
      setProjects(d.projects ?? []);
      if (!form.projectId && d.projects?.[0]) setForm(f => ({ ...f, projectId: d.projects[0].id }));
    });
  }, []);

  useEffect(() => {
    if (!form.projectId) return;
    fetch(`/api/keywords?projectId=${form.projectId}&status=APPROVED`).then(r => r.json()).then(d => setKeywords(d.keywords ?? []));
  }, [form.projectId]);

  async function generate() {
    setGenerating(true);
    setResult(null);
    setLog(['🚀 İçerik oluşturma başlatıldı...', '🔍 Anahtar kelime analiz ediliyor...']);

    try {
      const res = await fetch('/api/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setLog(prev => [...prev, '✏️ İçerik yazılıyor...', '🔬 Kalite kontrolü yapılıyor...', '✅ Makale başarıyla oluşturuldu!']);
        setResult({ success: true, articleId: data.articleId });
      } else {
        setLog(prev => [...prev, `❌ Hata: ${data.error}`]);
        setResult({ success: false, error: data.error });
      }
    } catch (e: any) {
      setLog(prev => [...prev, `❌ Bağlantı hatası: ${e.message}`]);
      setResult({ success: false, error: e.message });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI İçerik Oluştur</h1>
        <p className="text-slate-500 mt-1">GPT-4o ile SEO optimize, özgün makale oluşturun</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Proje *</label>
          <div className="relative">
            <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
              <option value="">Proje seçin</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.domain})</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Anahtar Kelime</label>
          <div className="relative">
            <select value={form.keywordId} onChange={e => setForm(f => ({ ...f, keywordId: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
              <option value="">Anahtar kelime seçin (veya otomatik seç)</option>
              {keywords.map(k => <option key={k.id} value={k.id}>{k.phrase} ({k.intent})</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">İçerik Dili</label>
          <div className="grid grid-cols-2 gap-2">
            {LOCALES.map(l => (
              <button key={l.code} onClick={() => setForm(f => ({ ...f, locale: l.code }))} className={`p-2.5 rounded-xl border-2 text-sm font-medium transition-all ${form.locale === l.code ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
          <div className="font-medium text-slate-900 mb-2">Oluşturulacak İçerik:</div>
          <ul className="space-y-1">
            {['SEO optimize başlık, slug, meta title/description', 'H1-H6 başlık hiyerarşisi ile 1500+ kelimelik makale', 'FAQ bölümü ve Schema.org yapılandırılmış veri', 'İç ve dış link önerileri', 'Resim alt metinleri ve Open Graph meta verileri', 'Otomatik kalite kontrolü (QA pipeline)'].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={generate}
          disabled={generating || !form.projectId}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 shadow-sm"
        >
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
          {generating ? 'Oluşturuluyor...' : 'Makale Oluştur'}
        </button>
      </div>

      {(generating || log.length > 0) && (
        <div className="bg-slate-900 rounded-2xl p-5 text-sm font-mono">
          <div className="text-slate-400 text-xs mb-3">İşlem Günlüğü</div>
          {log.map((l, i) => (
            <div key={i} className="text-green-400 py-0.5">{l}</div>
          ))}
          {generating && <div className="text-blue-400 animate-pulse">⏳ İşleniyor...</div>}
        </div>
      )}

      {result && (
        <div className={`rounded-2xl p-5 flex items-start gap-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.success ? <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />}
          <div>
            <div className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
              {result.success ? 'Makale başarıyla oluşturuldu!' : 'Hata oluştu'}
            </div>
            {result.success ? (
              <button onClick={() => router.push(`/content/${result.articleId}`)} className="mt-2 text-sm text-green-700 hover:underline">
                Makaleyi görüntüle →
              </button>
            ) : (
              <p className="text-sm text-red-700 mt-1">{result.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
