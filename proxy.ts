import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

// German language codes (ISO 639-1)
const GERMAN_LANGUAGE_CODES = ['de', 'de-de', 'de-at', 'de-ch', 'de-li', 'de-be', 'de-lu'];

// Define protected routes (admin dashboard, org dashboard, and API routes)
const isProtectedRoute = createRouteMatcher([
  '/:locale/admin(.*)',
  '/:locale/org(.*)',
  '/api/admin(.*)',
  '/api/org(.*)',
]);

function detectLocale(request: NextRequest): string {
  // Force English locale for all visitors (German coming soon)
  // Always return 'en' regardless of preferences
  return 'en';
}

function getLocalePrefixedAuthTarget(pathname: string): string | null {
  for (const locale of routing.locales) {
    // Handle /en/sign-in → /sign-in
    const signInBase = `/${locale}/sign-in`;
    if (pathname === signInBase || pathname.startsWith(`${signInBase}/`)) {
      const remainder = pathname.slice(signInBase.length);
      return `/sign-in${remainder}`;
    }
    // Handle /en/sign-up → /sign-up
    const signUpBase = `/${locale}/sign-up`;
    if (pathname === signUpBase || pathname.startsWith(`${signUpBase}/`)) {
      const remainder = pathname.slice(signUpBase.length);
      return `/sign-up${remainder}`;
    }
  }
  return null;
}

// Create the next-intl middleware
const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware(
  async (auth, request: NextRequest) => {
    const pathname = request.nextUrl.pathname;

    // Skip static files and special Next.js routes
    // Note: /api/admin routes are handled below for authentication
    if (
      pathname.startsWith('/_next') ||
      (pathname.startsWith('/api') && !pathname.startsWith('/api/admin')) ||
      pathname.startsWith('/_vercel') ||
      pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
    ) {
      return NextResponse.next();
    }

    const authTarget = getLocalePrefixedAuthTarget(pathname);
    if (authTarget) {
      const target = new URL(authTarget + request.nextUrl.search, request.url);
      return NextResponse.redirect(target);
    }

    // Build absolute sign-in URL (required by Next.js middleware)
    const signInUrl = new URL('/sign-in', request.url).toString();

    // Handle admin API routes - check auth and return early
    // Role-based authorization is handled in the API route handlers
    if (pathname.startsWith('/api/admin')) {
      if (isProtectedRoute(request)) {
        await auth.protect({
          unauthenticatedUrl: signInUrl,
        });
      }
      return NextResponse.next();
    }

    // Handle org API routes - check auth and return early
    // Org membership authorization is handled in the API route handlers
    if (pathname.startsWith('/api/org')) {
      if (isProtectedRoute(request)) {
        await auth.protect({
          unauthenticatedUrl: signInUrl,
        });
      }
      return NextResponse.next();
    }

    // Handle onboarding API routes - check auth and return early
    if (pathname.startsWith('/api/onboarding')) {
      await auth.protect({
        unauthenticatedUrl: signInUrl,
      });
      return NextResponse.next();
    }

    // Check if path has locale
    const pathnameHasLocale = routing.locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // Redirect German URLs to English (German coming soon)
    if (pathname.startsWith('/de/') || pathname === '/de') {
      const newPath = pathname.replace(/^\/de/, '/en');
      return NextResponse.redirect(new URL(newPath + request.nextUrl.search, request.url));
    }

    // Redirect root or non-localized paths to English
    // Exclude auth routes from locale prefixing
    if (!pathnameHasLocale && !pathname.startsWith('/sign-in') && !pathname.startsWith('/sign-up')) {
      const locale = detectLocale(request); // Always returns 'en'
      const newPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
      return NextResponse.redirect(new URL(newPath + request.nextUrl.search, request.url));
    }

    // Protect admin routes - Clerk will redirect to /sign-in (not /en/sign-in)
    // Role-based authorization is handled in the layout component
    if (isProtectedRoute(request)) {
      await auth.protect({
        unauthenticatedUrl: signInUrl,
      });
    }

    if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
      return NextResponse.next();
    }

    // Apply intl middleware for localized routes
    return intlMiddleware(request);
  },
  {
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
  }
);

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api` (except /api/admin, /api/org, /api/onboarding), `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api(?!/admin|/org|/onboarding)|_next|_vercel|.*\\..*).*)',
    // Optional: only run on root (/) URL
    '/',
    // Include sign-in route
    '/sign-in(.*)',
    // Include sign-up route
    '/sign-up(.*)',
    // Include admin API routes for authentication
    '/api/admin(.*)',
    // Include org API routes for authentication
    '/api/org(.*)',
    // Include onboarding API routes for authentication
    '/api/onboarding(.*)',
  ],
};
