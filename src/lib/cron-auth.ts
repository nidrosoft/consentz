import { NextRequest } from 'next/server';
import { ApiErrors } from '@/lib/api-response';

/**
 * Verify the CRON_SECRET bearer token on incoming cron requests.
 * Returns an error response if verification fails, or null if the request is authorized.
 */
export function verifyCronSecret(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[CRON_AUTH] CRON_SECRET is not configured');
    return ApiErrors.internal('Cron secret not configured');
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return ApiErrors.unauthorized('Invalid cron authorization');
  }

  return null;
}
