import Stripe from 'stripe';
import { getDb } from '@/lib/db';
import { handleSubscriptionActivated, handleSubscriptionCancelled } from '@/lib/email/triggers/billing-triggers';

let _stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export class StripeService {
  static async getPlans() {
    const dbClient = await getDb();
    const { data } = await dbClient
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });
    return data ?? [];
  }

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

        // Resolve the plan from the Stripe price
        let planId: string | null = null;
        if (subscriptionId) {
          const stripe = getStripe();
          if (stripe) {
            const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = stripeSub.items.data[0]?.price?.id;
            if (priceId) {
              const { data: plan } = await dbClient.from('subscription_plans')
                .select('id')
                .eq('stripe_price_id', priceId)
                .maybeSingle();
              planId = plan?.id ?? null;
            }
          }
        }

        await dbClient.from('subscriptions').upsert({
          organization_id: orgId,
          plan_id: planId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id' });

        // Send subscription activated email
        if (subscriptionId) {
          const stripe = getStripe();
          if (stripe) {
            try {
              const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
              const priceId = stripeSub.items.data[0]?.price?.id;
              const { data: plan } = await dbClient.from('subscription_plans')
                .select('name, price_monthly')
                .eq('stripe_price_id', priceId ?? '')
                .maybeSingle();
              const periodEnd = stripeSub.items.data[0]?.current_period_end;
              const nextBilling = periodEnd
                ? new Date(periodEnd * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'N/A';
              handleSubscriptionActivated(
                orgId,
                plan?.name ?? 'Professional',
                plan?.price_monthly ? `£${(plan.price_monthly / 100).toFixed(0)}` : '£0',
                nextBilling,
              ).catch(e => console.error('[STRIPE] Email trigger error:', e));
            } catch {
              // Don't block webhook on email failure
            }
          }
        }

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
          const priceId = subscription.items?.data?.[0]?.price?.id;
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

          if (priceId) {
            const { data: plan } = await dbClient.from('subscription_plans')
              .select('id')
              .eq('stripe_price_id', priceId)
              .maybeSingle();
            if (plan) updateFields.plan_id = plan.id;
          }

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
        const { data: cancelledSub } = await dbClient.from('subscriptions')
          .select('organization_id, current_period_end')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();

        await dbClient.from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id);

        if (cancelledSub?.organization_id) {
          const accessUntil = cancelledSub.current_period_end
            ? new Date(cancelledSub.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Immediately';
          handleSubscriptionCancelled(cancelledSub.organization_id, accessUntil)
            .catch(e => console.error('[STRIPE] Cancellation email error:', e));
        }
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
