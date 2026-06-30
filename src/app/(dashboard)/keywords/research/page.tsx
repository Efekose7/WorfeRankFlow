'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Wand2, Loader2, Check, Plus, TrendingUp } from 'lucide-react';

interface KWResult {
  phrase: string;
  intent: string;
  estimatedVolume: string;
  difficulty: string;
  selected?: boolean;
}

const intentColors: Record<string, string> = {
  INFORMATIONAL: 'bg-blue-100 text-blue-700',
  COMMERCIAL: 'bg-green-100 text-green-700',
  TRANSACTIONAL: 'bg-purple-100 text-purple-700',
  NAVIGATIONAL: 'bg-orange-100 text-orange-700',
  COMPARISON: 'bg-pink-100 text-pink-700',
};

export default function KeywordResearchPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project') ?? '';
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<KWResult[]>([]);
  const [saved, setSaved] = useState(false);

  async function research() {
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch('/api/keywords/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.keywords.map((k: KWResult) => ({ ...k, selected: true })));
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveSelected() {
    setSaving(true);
    try {
      const selected = results.filter(r => r.selected);
      const res = await fetch('/api/keywords/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, keywords: selected }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const toggle = (i: number) => setResults(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  const selectedCount = results.filter(r => r.selected).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Anahtar Kelime Araştırması</h1>
        <p className="text-slate-500 mt-1">Yapay zeka ile yüksek hacimli, düşük rekabetli anahtar kelimeler bulun</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-sm text-slate-600 mb-4">
          AI, projenizin nişi ve alan adını analiz ederek en uygun anahtar kelimeleri önerecek.
          Türkçe, İngilizce, Rusça ve Arapça için ayrı ayrı araştırma yapılabilir.
        </p>
        <button
          onClick={research}
          disabled={loading || !projectId}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
          {loading ? 'Araştırılıyor...' : 'AI Araştırma Başlat'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-slate-900">{results.length} Anahtar Kelime Bulundu</h2>
              <span className="text-sm text-slate-500">({selectedCount} seçili)</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setResults(r => r.map(kw => ({ ...kw, selected: true })))} className="text-sm text-blue-600 hover:underline">Tümünü Seç</button>
              <button
                onClick={saveSelected}
                disabled={saving || selectedCount === 0 || saved}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saved ? <Check className="w-4 h-4" /> : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saved ? 'Kaydedildi!' : `${selectedCount} Kelimeyi Kaydet`}
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {results.map((kw, i) => (
              <div key={i} onClick={() => toggle(i)} className={`flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-slate-50 ${kw.selected ? 'bg-blue-50/30' : ''}`}>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${kw.selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                  {kw.selected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900">{kw.phrase}</div>
                </div>
                <div className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${intentColors[kw.intent] ?? 'bg-slate-100 text-slate-600'}`}>
                  {kw.intent}
                </div>
                <div className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${kw.estimatedVolume === 'high' ? 'bg-green-100 text-green-700' : kw.estimatedVolume === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                  {kw.estimatedVolume === 'high' ? 'Yüksek Hacim' : kw.estimatedVolume === 'medium' ? 'Orta Hacim' : 'Düşük Hacim'}
                </div>
                <div className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${kw.difficulty === 'low' ? 'bg-green-100 text-green-700' : kw.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {kw.difficulty === 'low' ? 'Kolay' : kw.difficulty === 'medium' ? 'Orta' : 'Zor'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
