import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Users, Mail, Crown, ShieldCheck, Edit3, UserPlus } from 'lucide-react';
import Image from 'next/image';

export const metadata = { title: 'Ekip Yönetimi' };

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof Crown }> = {
  OWNER: { label: 'Sahip', color: 'bg-yellow-100 text-yellow-700', icon: Crown },
  ADMIN: { label: 'Yönetici', color: 'bg-purple-100 text-purple-700', icon: ShieldCheck },
  EDITOR: { label: 'Editör', color: 'bg-blue-100 text-blue-700', icon: Edit3 },
  MEMBER: { label: 'Üye', color: 'bg-slate-100 text-slate-600', icon: Users },
};

export default async function TeamPage() {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!orgId) return null;

  const members = await prisma.orgMember.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { id: true, name: true, email: true, image: true, createdAt: true } } },
    orderBy: { joinedAt: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ekip Yönetimi</h1>
          <p className="text-slate-500 mt-1">{members.length} ekip üyesi</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <UserPlus className="w-4 h-4" /> Üye Davet Et
        </button>
      </div>

      {/* Invite form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" /> E-posta ile Davet
        </h2>
        <div className="flex gap-3">
          <input type="email" placeholder="ekip@arkadasi.com" className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="MEMBER">Üye</option>
            <option value="EDITOR">Editör</option>
            <option value="ADMIN">Yönetici</option>
          </select>
          <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition-colors">
            Davet Gönder
          </button>
        </div>
      </div>

      {/* Members list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Ekip Üyeleri</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {members.map(member => {
            const roleConfig = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.MEMBER;
            const RoleIcon = roleConfig.icon;
            return (
              <div key={member.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                {member.user.image ? (
                  <Image src={member.user.image} alt={member.user.name ?? ''} width={40} height={40} className="rounded-full" />
                ) : (
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {(member.user.name ?? member.user.email ?? 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900">{member.user.name ?? 'İsimsiz'}</div>
                  <div className="text-sm text-slate-500">{member.user.email}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${roleConfig.color}`}>
                    <RoleIcon className="w-3 h-3" /> {roleConfig.label}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0">
                  {new Date(member.joinedAt).toLocaleDateString('tr-TR')}
                </div>
                <select defaultValue={member.role} className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="MEMBER">Üye</option>
                  <option value="EDITOR">Editör</option>
                  <option value="ADMIN">Yönetici</option>
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role permissions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-4">Rol İzinleri</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 text-slate-600 font-medium">İzin</th>
                {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
                  <th key={role} className="text-center py-2 text-slate-600 font-medium">{cfg.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { perm: 'İçerik okuma', roles: ['MEMBER', 'EDITOR', 'ADMIN', 'OWNER'] },
                { perm: 'İçerik oluşturma', roles: ['EDITOR', 'ADMIN', 'OWNER'] },
                { perm: 'İçerik yayınlama', roles: ['EDITOR', 'ADMIN', 'OWNER'] },
                { perm: 'Entegrasyon yönetimi', roles: ['ADMIN', 'OWNER'] },
                { perm: 'Ekip yönetimi', roles: ['ADMIN', 'OWNER'] },
                { perm: 'Fatura yönetimi', roles: ['OWNER'] },
              ].map(row => (
                <tr key={row.perm} className="hover:bg-slate-50">
                  <td className="py-2.5 text-slate-700">{row.perm}</td>
                  {Object.keys(ROLE_CONFIG).map(role => (
                    <td key={role} className="py-2.5 text-center">
                      {row.roles.includes(role) ? '✅' : '❌'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
