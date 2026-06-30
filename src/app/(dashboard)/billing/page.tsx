import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CreditCard, CheckCircle2, Zap, Crown, Building2 } from 'lucide-react';
import { planLimits } from '@/lib/utils';

export const metadata = { title: 'Faturalandırma' };

const PLANS = [
  {
    id: 'STARTER',
    name: 'Başlangıç',
    price: '$29',
    period: '/ay',
    icon: Zap,
    color: 'border-blue-200 bg-blue-50',
    features: ['50 makale/ay', '500 anahtar kelime', '3 proje', '3 ekip üyesi', '4 dil desteği', 'Tüm entegrasyonlar', 'E-posta desteği'],
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
  },
  {
    id: 'PRO',
    name: 'Profesyonel',
    price: '$79',
    period: '/ay',
    icon: Crown,
    color: 'border-purple-400 bg-purple-50',
    featured: true,
    features: ['200 makale/ay', '2.000 anahtar kelime', '10 proje', '10 ekip üyesi', '4 dil desteği', 'Tüm entegrasyonlar', 'Öncelikli destek', 'Özel AI talimatları', 'Gelişmiş analitik'],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  {
    id: 'ENTERPRISE',
    name: 'Kurumsal',
    price: 'Özel',
    period: '',
    icon: Building2,
    color: 'border-slate-300 bg-slate-50',
    features: ['Sınırsız makale', 'Sınırsız anahtar kelime', 'Sınırsız proje', 'Sınırsız üye', '7/24 destek', 'Özel AI model', 'SLA garantisi', 'SSO desteği'],
  },
];

export default async function BillingPage() {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!orgId) return null;

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return null;

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const limits = planLimits(org.plan);
  const articlePct = limits.articles > 0 ? Math.round((org.usageArticles / limits.articles) * 100) : 0;
  const kwPct = limits.keywords > 0 ? Math.round((org.usageKeywords / limits.keywords) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Faturalandırma</h1>
        <p className="text-slate-500 mt-1">Plan ve abonelik yönetimi</p>
      </div>

      {/* Current plan */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mevcut Plan</div>
            <div className="text-2xl font-bold text-slate-900">{org.plan}</div>
            {org.planExpires && (
              <div className="text-sm text-slate-500 mt-1">
                Yenileme: {new Date(org.planExpires).toLocaleDateString('tr-TR')}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> Aktif
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {[
            { label: 'Makale Kullanımı', used: org.usageArticles, limit: limits.articles, pct: articlePct },
            { label: 'Anahtar Kelime', used: org.usageKeywords, limit: limits.keywords, pct: kwPct },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="text-slate-600">{item.used} / {item.limit < 0 ? '∞' : item.limit}</span>
              </div>
              <div className="bg-slate-200 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${item.pct >= 90 ? 'bg-red-500' : item.pct >= 70 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, item.limit < 0 ? 10 : item.pct)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Planlar</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const isCurrentPlan = org.plan === plan.id;
            return (
              <div key={plan.id} className={`bg-white rounded-2xl border-2 p-6 shadow-sm relative ${plan.featured ? 'border-purple-400' : 'border-slate-200'}`}>
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium">En Popüler</div>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.color}`}>
                  <plan.icon className="w-5 h-5 text-slate-700" />
                </div>
                <div className="font-semibold text-slate-900 mb-0.5">{plan.name}</div>
                <div className="text-2xl font-bold text-slate-900 mb-4">{plan.price}<span className="text-sm font-normal text-slate-500">{plan.period}</span></div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <div className="text-center py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium">Mevcut Plan</div>
                ) : plan.id === 'ENTERPRISE' ? (
                  <a href="mailto:enterprise@worferankflow.com" className="block text-center py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors">
                    İletişime Geç
                  </a>
                ) : (
                  <form action="/api/billing/checkout" method="POST">
                    <input type="hidden" name="priceId" value={plan.stripePriceId ?? ''} />
                    <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
                      {org.plan === 'FREE' ? 'Başla' : 'Geç'}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-500" />
            <h2 className="font-semibold text-slate-900">Faturalar</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-slate-900 text-sm">{new Date(inv.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}</div>
                  <div className="text-xs text-slate-500">{inv.stripeInvoiceId}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-semibold text-slate-900">${(inv.amount / 100).toFixed(2)}</div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {inv.status === 'PAID' ? 'Ödendi' : 'Bekliyor'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
