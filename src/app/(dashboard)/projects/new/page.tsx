'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Loader2, ArrowRight, ArrowLeft, Wand2 } from 'lucide-react';

const LOCALES = [
  { code: 'tr', label: 'Türkçe 🇹🇷' },
  { code: 'en', label: 'English 🇺🇸' },
  { code: 'ru', label: 'Русский 🇷🇺' },
  { code: 'ar', label: 'العربية 🇸🇦' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    domain: '',
    niche: '',
    description: '',
    locale: 'tr',
    targetLocales: ['tr'],
    brandVoice: '',
    targetAudience: '',
    writingGuidelines: '',
    customInstructions: '',
    prohibitedWords: '',
  });

  const update = (key: string, value: string | string[]) =>
    setForm(f => ({ ...f, [key]: value }));

  async function analyzeDomain() {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/projects/analyze-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: form.domain }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm(f => ({
          ...f,
          niche: data.niche ?? f.niche,
          description: data.description ?? f.description,
          targetAudience: data.targetAudience ?? f.targetAudience,
          brandVoice: data.brandVoice ?? f.brandVoice,
        }));
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          prohibitedWords: form.prohibitedWords.split(',').map(w => w.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        const { id } = await res.json();
        router.push(`/projects/${id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yeni Proje</h1>
          <p className="text-slate-500 text-sm">Adım {step}/3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Web Sitesi Bilgileri</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Proje Adı *</label>
              <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Benim Bloğum" className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Alan Adı *</label>
              <div className="flex gap-2">
                <input value={form.domain} onChange={e => update('domain', e.target.value)} placeholder="example.com" className="input flex-1" />
                <button onClick={analyzeDomain} disabled={!form.domain || analyzing} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors whitespace-nowrap">
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  AI Analiz
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Alan adınızı girerek AI&apos;nin otomatik analiz etmesini sağlayın</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sektör / Niş</label>
              <input value={form.niche} onChange={e => update('niche', e.target.value)} placeholder="E-ticaret, Sağlık, Teknoloji..." className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Kısa Açıklama</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Web siteniz hakkında kısa açıklama..." rows={3} className="input resize-none" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Dil ve Hedef Kitle</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Birincil Dil</label>
              <div className="grid grid-cols-2 gap-2">
                {LOCALES.map(l => (
                  <button key={l.code} onClick={() => update('locale', l.code)} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.locale === l.code ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Hedef Diller (çoklu seçim)</label>
              <div className="grid grid-cols-2 gap-2">
                {LOCALES.map(l => (
                  <button key={l.code} onClick={() => {
                    const current = form.targetLocales;
                    update('targetLocales', current.includes(l.code) ? current.filter(x => x !== l.code) : [...current, l.code]);
                  }} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.targetLocales.includes(l.code) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}>
                    {l.label} {form.targetLocales.includes(l.code) ? '✓' : ''}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hedef Kitle</label>
              <textarea value={form.targetAudience} onChange={e => update('targetAudience', e.target.value)} placeholder="25-45 yaş arası profesyoneller, e-ticaret satıcıları..." rows={3} className="input resize-none" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Marka Sesi ve İçerik Kılavuzu</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Marka Sesi</label>
              <div className="grid grid-cols-2 gap-2">
                {['Profesyonel', 'Samimi', 'Otoriter', 'Konuşkan'].map(v => (
                  <button key={v} onClick={() => update('brandVoice', v)} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.brandVoice === v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Yazım Kılavuzu</label>
              <textarea value={form.writingGuidelines} onChange={e => update('writingGuidelines', e.target.value)} placeholder="Kısa cümleler kullanın, teknik jargondan kaçının..." rows={3} className="input resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Yasaklı Kelimeler</label>
              <input value={form.prohibitedWords} onChange={e => update('prohibitedWords', e.target.value)} placeholder="kelime1, kelime2, kelime3 (virgülle ayırın)" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Özel Talimatlar</label>
              <textarea value={form.customInstructions} onChange={e => update('customInstructions', e.target.value)} placeholder="İçerik oluştururken AI'ya özel talimatlar..." rows={3} className="input resize-none" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Geri
            </button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!form.name || !form.domain} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
              İleri <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              Proje Oluştur
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
}
