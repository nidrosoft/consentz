import Stripe from 'stripe';
import { getDb } from '@/lib/db';

let _stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export class StripeService {
  static async createCheckoutSession(params: {
    organizationId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    const stripe = getStripe();
    if (!stripe) throw new Error('Stripe is not configured');

    const dbClient = await getDb();
    const { data: sub } = await dbClient.from('subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', params.organizationId)
      .maybeSingle();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { organizationId: params.organizationId },
    };

    if (sub?.stripe_customer_id) {
      sessionParams.customer = sub.stripe_customer_id;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return { sessionId: session.id, url: session.url };
  }

  static async createBillingPortalSession(params: {
    organizationId: string;
    returnUrl: string;
  }) {
    const stripe = getStripe();
    if (!stripe) throw new Error('Stripe is not configured');

    const dbClient = await getDb();
    const { data: sub } = await dbClient.from('subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', params.organizationId)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      throw new Error('No Stripe customer found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: params.returnUrl,
    });

    return { url: session.url };
  }

  static async handleWebhookEvent(event: Stripe.Event) {
    const dbClient = await getDb();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organizationId;
        if (!orgId) break;

        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : (session.subscription as Stripe.Subscription)?.id;
        const customerId = typeof session.customer === 'string'
          ? session.customer
          : (session.customer as Stripe.Customer)?.id;

        await dbClient.from('subscriptions').upsert({
          organization_id: orgId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id' });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_start?: number;
          current_period_end?: number;
        };
        const { data: sub } = await dbClient.from('subscriptions')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();

        if (sub) {
          const updateFields: Record<string, unknown> = {
            status: subscription.status === 'active' ? 'active'
              : subscription.status === 'past_due' ? 'past_due'
              : subscription.status === 'canceled' ? 'cancelled'
              : sub.status,
            cancel_at: subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          };
          if (subscription.current_period_start) {
            updateFields.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
          }
          if (subscription.current_period_end) {
            updateFields.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
          }
          await dbClient.from('subscriptions')
            .update(updateFields)
            .eq('id', sub.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await dbClient.from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
    }
  }

  static async getSubscription(organizationId: string) {
    const dbClient = await getDb();
    const { data: sub } = await dbClient.from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('organization_id', organizationId)
      .maybeSingle();
    return sub;
  }
}
