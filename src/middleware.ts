import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/api/webhooks(.*)',
  '/api/cron(.*)',
]);

const isOnboardingRoute = createRouteMatcher([
  '/welcome(.*)',
  '/assessment(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return;
  }

  const { userId, sessionClaims } = await auth.protect();

  const onboardingComplete =
    (sessionClaims?.metadata as Record<string, unknown>)?.onboardingComplete === true;

  if (!onboardingComplete && !isOnboardingRoute(req)) {
    const onboardingUrl = new URL('/welcome', req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  if (onboardingComplete && isOnboardingRoute(req)) {
    const dashboardUrl = new URL('/', req.url);
    return NextResponse.redirect(dashboardUrl);
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
