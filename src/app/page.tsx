import Link from 'next/link';
import { ArrowRight, BarChart3, Bot, Globe, Layers, Rocket, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">WR</div>
            <span className="font-bold text-lg">Worfe RankFlow</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Özellikler</a>
            <a href="#pricing" className="hover:text-white transition-colors">Fiyatlandırma</a>
            <a href="#integrations" className="hover:text-white transition-colors">Entegrasyonlar</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin" className="text-sm text-slate-300 hover:text-white transition-colors">
              Giriş Yap
            </Link>
            <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-300 text-sm mb-6">
          <Zap className="w-3.5 h-3.5" />
          Yapay Zeka Destekli SEO İçerik Otomasyonu
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          SEO İçeriğinizi{' '}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Otomatikleştirin
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Yapay zeka ile anahtar kelime araştırması, SEO optimize içerik üretimi ve WordPress, Shopify, Webflow üzerinde otomatik yayınlama. Türkçe, İngilizce, Rusça ve Arapça desteğiyle.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors flex items-center gap-2">
            Ücretsiz Başla <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="#demo" className="border border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors">
            Demo İzle
          </Link>
        </div>
        <p className="mt-4 text-slate-500 text-sm">Kredi kartı gerekmez • 5 makale ücretsiz</p>
      </section>

      {/* Stats */}
      <section className="container mx-auto py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Oluşturulan Makale', value: '50,000+' },
            { label: 'Aktif Proje', value: '2,500+' },
            { label: 'Desteklenen Dil', value: '4' },
            { label: 'Entegrasyon', value: '6+' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-slate-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Tüm SEO İhtiyaçlarınız Tek Platformda</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Anahtar kelime araştırmasından içerik üretimine, kalite kontrolünden otomatik yayınlamaya kadar her şey.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Bot, title: 'AI İçerik Üretimi', desc: 'GPT-4o ile SEO optimize, özgün ve E-E-A-T uyumlu makaleler oluşturun. Marka sesinize uygun içerikler.' },
            { icon: BarChart3, title: 'Anahtar Kelime Araştırması', desc: 'Yüksek hacimli, düşük rekabetli anahtar kelimeleri otomatik keşfedin. Intent bazlı kümeleme ile konu otoritesi oluşturun.' },
            { icon: Layers, title: 'Konu Kümeleri', desc: 'Pillar-cluster mimarisi ile içerik siloları oluşturun. İç linkleme önerileri ve içerik boşluğu analizi.' },
            { icon: Shield, title: 'Kalite Kontrol', desc: 'Otomatik QA pipeline: çift içerik kontrolü, okunabilirlik, E-E-A-T uyumluluğu, semantik SEO analizi.' },
            { icon: Globe, title: 'Çok Dilli SEO', desc: 'TR, EN, RU, AR dillerinde lokalize içerik. Hreflang etiketleri, bölgesel anahtar kelime araştırması.' },
            { icon: Rocket, title: 'Otomatik Yayınlama', desc: 'WordPress, Shopify, Webflow, Wix entegrasyonları. Zamanlanmış yayınlama, başarısız denemelerin otomatik yeniden denenmesi.' },
          ].map((feature) => (
            <div key={feature.title} className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-colors">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="container mx-auto py-24 text-center">
        <h2 className="text-4xl font-bold mb-4">Favori Platformlarınızla Entegre</h2>
        <p className="text-slate-400 mb-12">WordPress, Shopify, Webflow, Wix ve özel REST API desteği</p>
        <div className="flex flex-wrap justify-center gap-4">
          {['WordPress', 'Shopify', 'Webflow', 'Wix', 'REST API', 'Webhook'].map((p) => (
            <div key={p} className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm font-medium">
              {p}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Şeffaf Fiyatlandırma</h2>
          <p className="text-slate-400">Her ölçekteki işletme için uygun plan</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { name: 'Başlangıç', price: '$29', period: '/ay', articles: '50 makale', keywords: '500 anahtar kelime', projects: '3 proje', cta: 'Başla', featured: false },
            { name: 'Profesyonel', price: '$79', period: '/ay', articles: '200 makale', keywords: '2.000 anahtar kelime', projects: '10 proje', cta: 'En Popüler', featured: true },
            { name: 'Kurumsal', price: 'Özel', period: '', articles: 'Sınırsız', keywords: 'Sınırsız', projects: 'Sınırsız', cta: 'İletişime Geç', featured: false },
          ].map((plan) => (
            <div key={plan.name} className={`p-8 rounded-2xl border ${plan.featured ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/10'}`}>
              <div className="font-semibold text-lg mb-1">{plan.name}</div>
              <div className="text-4xl font-bold mb-1">{plan.price}<span className="text-sm font-normal opacity-70">{plan.period}</span></div>
              <div className="border-t border-white/20 my-6" />
              <ul className="space-y-3 text-sm mb-8">
                <li>✓ {plan.articles}</li>
                <li>✓ {plan.keywords}</li>
                <li>✓ {plan.projects}</li>
                <li>✓ 4 dil desteği</li>
                <li>✓ Tüm entegrasyonlar</li>
              </ul>
              <Link href="/auth/signup" className={`block text-center py-3 rounded-xl font-semibold transition-colors ${plan.featured ? 'bg-white text-blue-600 hover:bg-slate-100' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto text-center text-slate-500 text-sm">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center font-bold text-xs">WR</div>
            <span className="font-semibold text-slate-300">Worfe RankFlow</span>
          </div>
          <p>© 2024 Worfe RankFlow. Tüm hakları saklıdır.</p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/privacy" className="hover:text-slate-300">Gizlilik</Link>
            <Link href="/terms" className="hover:text-slate-300">Kullanım Şartları</Link>
            <Link href="/contact" className="hover:text-slate-300">İletişim</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
