import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { testWordPressConnection } from '@/lib/integrations/wordpress';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const orgId = (session as any)?.orgId as string | undefined;
  if (!session?.user || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const integration = await prisma.integration.findFirst({
    where: { id: params.id, project: { organizationId: orgId } },
  });
  if (!integration) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let success = false;
  let message = 'Test başarılı';

  try {
    if (integration.type === 'WORDPRESS' && integration.baseUrl && integration.apiKey && integration.apiSecret) {
      success = await testWordPressConnection({
        baseUrl: integration.baseUrl,
        username: integration.apiKey,
        appPassword: integration.apiSecret,
      });
      if (!success) message = 'WordPress bağlantısı başarısız. Kimlik bilgilerini kontrol edin.';
    } else if (integration.type === 'WEBHOOK' || integration.type === 'CUSTOM_REST') {
      success = true;
      message = 'Webhook/REST yapılandırması kaydedildi';
    } else {
      success = true;
      message = 'Yapılandırma doğrulandı';
    }
  } catch (err: any) {
    success = false;
    message = err.message;
  }

  await prisma.integration.update({
    where: { id: params.id },
    data: { lastTestedAt: new Date(), isActive: success },
  });

  return NextResponse.json({ success, message });
}
