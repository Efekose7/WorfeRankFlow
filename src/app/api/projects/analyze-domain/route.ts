import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzeDomain } from '@/lib/ai/openai';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { domain } = await req.json();
    if (!domain) return NextResponse.json({ error: 'Domain required' }, { status: 400 });

    const result = await analyzeDomain(domain);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
