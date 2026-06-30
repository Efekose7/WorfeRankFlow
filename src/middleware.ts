import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/auth', '/api/auth', '/api/billing/webhook'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Protect dashboard and API routes
  const session = await auth();
  if (!session?.user && (pathname.startsWith('/dashboard') || pathname.startsWith('/projects') || pathname.startsWith('/keywords') || pathname.startsWith('/content') || pathname.startsWith('/analytics') || pathname.startsWith('/integrations') || pathname.startsWith('/billing') || pathname.startsWith('/settings') || pathname.startsWith('/team'))) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // API auth check
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/billing/webhook')) {
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
