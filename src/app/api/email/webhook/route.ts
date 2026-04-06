import { NextRequest, NextResponse } from 'next/server';
import { handleUserCreated } from '@/lib/email/triggers/auth-triggers';

export async function POST(req: NextRequest) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (secret) {
    const provided = req.headers.get('x-webhook-secret') ?? req.headers.get('authorization');
    if (provided !== secret && provided !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const payload = await req.json();
    const { type, record } = payload ?? {};

    if (type === 'INSERT' && record?.id && record?.email) {
      await handleUserCreated(record.id, record.email);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[EMAIL_WEBHOOK] Error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
