import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db as prisma } from '@/lib/db';

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string; id: string }>;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
    primary_email_address_id?: string;
    deleted?: boolean;
  };
};

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[CLERK_WEBHOOK] CLERK_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: ClerkWebhookEvent;
  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    console.error('[CLERK_WEBHOOK] Signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const { type, data } = event;

  try {
    switch (type) {
      case 'user.created':
      case 'user.updated': {
        const primaryEmail = data.email_addresses?.find(
          (e) => e.id === data.primary_email_address_id
        );
        const email = primaryEmail?.email_address ?? data.email_addresses?.[0]?.email_address ?? '';

        await prisma.user.upsert({
          where: { clerkId: data.id },
          create: {
            clerkId: data.id,
            email,
            firstName: data.first_name ?? null,
            lastName: data.last_name ?? null,
            avatarUrl: data.image_url ?? null,
          },
          update: {
            email,
            firstName: data.first_name ?? null,
            lastName: data.last_name ?? null,
            avatarUrl: data.image_url ?? null,
          },
        });
        break;
      }

      case 'user.deleted': {
        if (data.deleted) {
          await prisma.user.update({
            where: { clerkId: data.id },
            data: { deletedAt: new Date() },
          }).catch(() => {
            // User may not exist in DB
          });
        }
        break;
      }
    }
  } catch (error) {
    console.error('[CLERK_WEBHOOK] Error processing event:', type, error);
    return NextResponse.json({ error: 'Error processing event' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
