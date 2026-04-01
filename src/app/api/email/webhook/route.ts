import { NextRequest, NextResponse } from 'next/server';
import { handleUserCreated } from '@/lib/email/triggers/auth-triggers';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { type, record } = payload;

    switch (type) {
      case 'INSERT': {
        if (record?.id && record?.email) {
          await handleUserCreated(record.id, record.email);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[EMAIL_WEBHOOK] Error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
