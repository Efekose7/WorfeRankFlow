import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';

// Lazily import adapter to avoid crash when Prisma is not generated
let _adapter: any = null;
function getAdapter() {
  if (!_adapter) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaAdapter } = require('@auth/prisma-adapter');
      _adapter = PrismaAdapter(prisma);
    } catch {
      _adapter = undefined;
    }
  }
  return _adapter;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: getAdapter(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        return user ?? null;
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        const membership = await prisma.orgMember.findFirst({
          where: { userId: user.id },
          include: { organization: true },
          orderBy: { joinedAt: 'asc' },
        });
        if (membership) {
          (session as any).orgId = membership.organizationId;
          (session as any).orgRole = membership.role;
          (session as any).org = membership.organization;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: { strategy: 'database' },
});
