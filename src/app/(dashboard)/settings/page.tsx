'use client';

import { useState } from 'react';
import { Save, Loader2, Key, Bell, Shield, Globe } from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profil', icon: Shield },
  { id: 'notifications', label: 'Bildirimler', icon: Bell },
  { id: 'apikeys', label: 'API Anahtarları', icon: Key },
  { id: 'language', label: 'Dil', icon: Globe },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-slate-500 mt-1">Hesap ve platform ayarlarınızı yönetin</p>
      </div>

      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-0.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {tab === 'profile' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">Profil Bilgileri</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Ad Soyad', placeholder: 'Ahmet Yılmaz', type: 'text' },
                  { label: 'E-posta', placeholder: 'ahmet@email.com', type: 'email' },
                  { label: 'Organizasyon Adı', placeholder: 'Şirket Adı', type: 'text' },
                  { label: 'Organizasyon Slug', placeholder: 'sirket-adi', type: 'text' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">Bildirim Tercihleri</h2>
              {[
                { label: 'Makale oluşturulduğunda', desc: 'AI bir makale oluşturmayı tamamladığında e-posta al' },
                { label: 'Makale yayınlandığında', desc: 'İçerik başarıyla yayınlandığında bildirim al' },
                { label: 'Yayınlama hatası', desc: 'Yayınlama başarısız olduğunda uyar' },
                { label: 'Haftalık özet', desc: 'Her hafta performans özeti e-postası al' },
                { label: 'Kota %80 dolduğunda', desc: 'Aylık kota limitine yaklaşıldığında uyar' },
              ].map(n => (
                <div key={n.label} className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{n.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{n.desc}</div>
                  </div>
                  <label className="relative flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {tab === 'apikeys' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">API Anahtarları</h2>
              <p className="text-sm text-slate-500">Üçüncü taraf uygulamalar için API anahtarı oluşturun</p>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="font-mono text-sm text-slate-700 break-all">wrf_••••••••••••••••••••••••••••••••••••••••</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-slate-500">Oluşturuldu: 1 Ocak 2024</div>
                  <div className="flex gap-2">
                    <button className="text-xs text-blue-600 hover:underline">Kopyala</button>
                    <button className="text-xs text-red-600 hover:underline">İptal Et</button>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition-colors">
                <Key className="w-4 h-4" /> Yeni API Anahtarı Oluştur
              </button>
            </div>
          )}

          {tab === 'language' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">Dil Tercihleri</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Arayüz Dili</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
                    { code: 'en', label: 'English', flag: '🇺🇸' },
                    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
                    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
                  ].map(l => (
                    <button key={l.code} className={`p-3 rounded-xl border-2 text-sm font-medium flex items-center gap-2 transition-all ${l.code === 'tr' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                      <span className="text-lg">{l.flag}</span> {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
