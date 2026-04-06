import { NextRequest, NextResponse } from 'next/server';

import { withAuth } from '@/lib/api-handler';
import { apiSuccess, ApiErrors } from '@/lib/api-response';

const CONSENTZ_BASE_URL = process.env.CONSENTZ_API_URL || 'https://staging.consentz.com';

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return ApiErrors.badRequest('Email and password are required');
  }

  const response = await fetch(`${CONSENTZ_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-APPLICATION-ID': 'laptop',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    console.error('[CONSENTZ_AUTH] Login failed:', response.status);
    return ApiErrors.badRequest('Consentz authentication failed. Please check your credentials.');
  }

  const data = await response.json();
  return apiSuccess(data);
});
