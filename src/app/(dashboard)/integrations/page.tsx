'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plug, CheckCircle2, XCircle, Plus, Loader2, Settings, Trash2, TestTube } from 'lucide-react';

interface Integration {
  id: string;
  type: string;
  name: string;
  baseUrl?: string;
  isActive: boolean;
  lastTestedAt?: string;
}

const INTEGRATION_TYPES = [
  { type: 'WORDPRESS', label: 'WordPress', icon: '🟦', desc: 'WordPress REST API ile entegre olun' },
  { type: 'SHOPIFY', label: 'Shopify', icon: '🟩', desc: 'Shopify mağazanıza makale yayınlayın' },
  { type: 'WEBFLOW', label: 'Webflow', icon: '🔷', desc: "Webflow CMS'e içerik gönderin" },
  { type: 'WIX', label: 'Wix', icon: '⚫', desc: 'Wix blogunuza yayın yapın' },
  { type: 'CUSTOM_REST', label: 'Özel REST API', icon: '🔌', desc: 'Kendi API endpoint\'inizi yapılandırın' },
  { type: 'WEBHOOK', label: 'Webhook', icon: '🔗', desc: "Yayın olaylarında webhook'unuza bildirim gönderin" },
];

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project') ?? '';
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [form, setForm] = useState({ name: '', baseUrl: '', apiKey: '', apiSecret: '' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, [projectId]);

  async function fetchIntegrations() {
    setLoading(true);
    const res = await fetch(`/api/integrations?projectId=${projectId}`);
    if (res.ok) {
      const data = await res.json();
      setIntegrations(data.integrations ?? []);
    }
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    const res = await fetch('/api/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, type: selectedType, ...form }),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: '', baseUrl: '', apiKey: '', apiSecret: '' });
      fetchIntegrations();
    }
    setSaving(false);
  }

  async function testConnection(id: string) {
    setTesting(id);
    const res = await fetch(`/api/integrations/${id}/test`, { method: 'POST' });
    await fetchIntegrations();
    setTesting(null);
  }

  async function deleteIntegration(id: string) {
    if (!confirm('Bu entegrasyonu silmek istediğinizden emin misiniz?')) return;
    await fetch(`/api/integrations/${id}`, { method: 'DELETE' });
    fetchIntegrations();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Entegrasyonlar</h1>
          <p className="text-slate-500 mt-1">CMS platformlarınıza bağlanın ve otomatik yayın yapın</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Entegrasyon Ekle
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Platform Seçin</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {INTEGRATION_TYPES.map(t => (
              <button key={t.type} onClick={() => setSelectedType(t.type)} className={`p-4 rounded-xl border-2 text-left transition-all ${selectedType === t.type ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="text-2xl mb-2">{t.icon}</div>
                <div className="font-medium text-slate-900 text-sm">{t.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>

          {selectedType && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <h3 className="font-medium text-slate-900">{INTEGRATION_TYPES.find(t => t.type === selectedType)?.label} Yapılandırması</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İsim</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Örn: Ana Blog WordPress" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {(selectedType === 'WORDPRESS' || selectedType === 'CUSTOM_REST' || selectedType === 'WEBFLOW' || selectedType === 'WIX') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Site URL</label>
                  <input value={form.baseUrl} onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))} placeholder="https://siteniz.com" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {selectedType === 'WORDPRESS' ? 'Kullanıcı Adı' : 'API Key'}
                </label>
                <input value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} type="text" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {selectedType === 'WORDPRESS' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Uygulama Şifresi</label>
                  <input value={form.apiSecret} onChange={e => setForm(f => ({ ...f, apiSecret: e.target.value }))} type="password" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-xs text-slate-500 mt-1">WordPress → Kullanıcılar → Profiliniz → Uygulama Şifreleri</p>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50">İptal</button>
                <button onClick={save} disabled={saving || !form.name} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Kaydet
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : integrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <Plug className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700 mb-2">Henüz entegrasyon yok</h3>
          <p className="text-slate-400 text-sm">WordPress, Shopify veya diğer platformlarla bağlantı kurun</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {integrations.map(intg => {
            const typeInfo = INTEGRATION_TYPES.find(t => t.type === intg.type);
            return (
              <div key={intg.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{typeInfo?.icon ?? '🔌'}</span>
                    <div>
                      <div className="font-medium text-slate-900">{intg.name}</div>
                      <div className="text-xs text-slate-500">{typeInfo?.label} {intg.baseUrl ? `• ${intg.baseUrl}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {intg.isActive ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                </div>
                {intg.lastTestedAt && (
                  <div className="text-xs text-slate-500 mb-3">
                    Son test: {new Date(intg.lastTestedAt).toLocaleString('tr-TR')}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button onClick={() => testConnection(intg.id)} disabled={testing === intg.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                    {testing === intg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TestTube className="w-3.5 h-3.5" />}
                    Test Et
                  </button>
                  <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                    <Settings className="w-3.5 h-3.5" /> Düzenle
                  </button>
                  <button onClick={() => deleteIntegration(intg.id)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors ml-auto">
                    <Trash2 className="w-3.5 h-3.5" /> Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
