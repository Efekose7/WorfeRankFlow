'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FolderOpen, Hash, FileText,
  BarChart3, Plug, Users, CreditCard, Settings, Bot, ChevronRight
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Gösterge Paneli', labelEn: 'Dashboard' },
  { href: '/projects', icon: FolderOpen, label: 'Projeler', labelEn: 'Projects' },
  { href: '/keywords', icon: Hash, label: 'Anahtar Kelimeler', labelEn: 'Keywords' },
  { href: '/content', icon: FileText, label: 'İçerik', labelEn: 'Content' },
  { href: '/analytics', icon: BarChart3, label: 'Analitik', labelEn: 'Analytics' },
  { href: '/integrations', icon: Plug, label: 'Entegrasyonlar', labelEn: 'Integrations' },
  { href: '/team', icon: Users, label: 'Ekip', labelEn: 'Team' },
  { href: '/billing', icon: CreditCard, label: 'Faturalandırma', labelEn: 'Billing' },
  { href: '/settings', icon: Settings, label: 'Ayarlar', labelEn: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">Worfe</div>
            <div className="font-bold text-sm leading-tight text-blue-400">RankFlow</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="bg-blue-600/20 rounded-xl p-4">
          <div className="text-xs font-semibold text-blue-300 mb-1">Başlangıç Planı</div>
          <div className="text-xs text-slate-400 mb-2">10/50 makale kullanıldı</div>
          <div className="bg-white/10 rounded-full h-1.5">
            <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: '20%' }} />
          </div>
          <Link href="/billing" className="mt-3 block text-center text-xs bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded-lg transition-colors">
            Yükselt
          </Link>
        </div>
      </div>
    </aside>
  );
}
