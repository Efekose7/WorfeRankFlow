'use client';

import { signOut } from 'next-auth/react';
import { Bell, ChevronDown, Globe, LogOut, Settings, User } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';

const LOCALES = [
  { code: 'tr', label: 'TR', flag: '🇹🇷' },
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' },
];

interface TopBarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export function TopBar({ user }: TopBarProps) {
  const [locale, setLocale] = useState('tr');
  const [showUser, setShowUser] = useState(false);
  const [showLang, setShowLang] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <h2 className="text-slate-600 text-sm font-medium">Hoş geldiniz, <span className="text-slate-900 font-semibold">{user.name ?? user.email}</span></h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLang(!showLang)}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>{LOCALES.find(l => l.code === locale)?.flag}</span>
            <span>{locale.toUpperCase()}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showLang && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1 min-w-[120px] z-50">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLocale(l.code); setShowLang(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 ${locale === l.code ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                >
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUser(!showUser)}
            className="flex items-center gap-2 hover:bg-slate-100 rounded-xl px-2 py-1.5 transition-colors"
          >
            {user.image ? (
              <Image src={user.image} alt={user.name ?? ''} width={32} height={32} className="rounded-full" />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {(user.name ?? user.email ?? 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-slate-900 leading-tight">{user.name ?? 'Kullanıcı'}</div>
              <div className="text-xs text-slate-500 leading-tight truncate max-w-[120px]">{user.email}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>

          {showUser && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1 min-w-[180px] z-50">
              <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50">
                <User className="w-4 h-4" /> Profil
              </Link>
              <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50">
                <Settings className="w-4 h-4" /> Ayarlar
              </Link>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" /> Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
