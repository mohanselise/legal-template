import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

// German language codes (ISO 639-1)
const GERMAN_LANGUAGE_CODES = ['de', 'de-de', 'de-at', 'de-ch', 'de-li', 'de-be', 'de-lu'];

// Define protected routes (admin dashboard and API routes)
const isProtectedRoute = createRouteMatcher([
  '/:locale/admin(.*)',
  '/api/admin(.*)',
]);

function detectLocale(request: NextRequest): string {
  // 1. Check cookie preference first (highest priority)
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && routing.locales.some((locale) => locale === cookieLocale)) {
    return cookieLocale;
  }

  // 2. Check Accept-Language header for German-speaking regions
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "de-DE,de;q=0.9,en;q=0.8")
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, q = 'q=1'] = lang.trim().split(';');
        const quality = parseFloat(q.replace('q=', ''));
        return { code: code.trim().toLowerCase(), quality };
      })
      .sort((a, b) => b.quality - a.quality);

    // Check if any German variant is preferred
    for (const lang of languages) {
      if (GERMAN_LANGUAGE_CODES.some(germanCode => lang.code.startsWith(germanCode))) {
        return 'de';
      }
      // If English is explicitly preferred, use it
      if (lang.code.startsWith('en') && lang.quality >= 0.5) {
        return 'en';
      }
    }
  }

  // 3. Default to English
  return routing.defaultLocale;
}

function getLocalePrefixedSignInTarget(pathname: string): string | null {
  for (const locale of routing.locales) {
    const localizedBase = `/${locale}/sign-in`;
    if (pathname === localizedBase || pathname.startsWith(`${localizedBase}/`)) {
      const remainder = pathname.slice(localizedBase.length);
      return `/sign-in${remainder}`;
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

    const localeSignInTarget = getLocalePrefixedSignInTarget(pathname);
    if (localeSignInTarget) {
      const target = new URL(localeSignInTarget + request.nextUrl.search, request.url);
      return NextResponse.redirect(target);
    }

    // Build absolute sign-in URL (required by Next.js middleware)
    const signInUrl = new URL('/sign-in', request.url).toString();

    // Handle admin API routes - check auth and return early
    if (pathname.startsWith('/api/admin')) {
      if (isProtectedRoute(request)) {
        await auth.protect({
          unauthenticatedUrl: signInUrl,
        });
      }
      return NextResponse.next();
    }

    // Check if path has locale
    const pathnameHasLocale = routing.locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // Redirect root or non-localized paths
    if (!pathnameHasLocale && !pathname.startsWith('/sign-in')) {
      const locale = detectLocale(request);
      const newPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
      return NextResponse.redirect(new URL(newPath + request.nextUrl.search, request.url));
    }

    // Protect admin routes - Clerk will redirect to /sign-in (not /en/sign-in)
    if (isProtectedRoute(request)) {
      await auth.protect({
        unauthenticatedUrl: signInUrl,
      });
    }

    if (pathname.startsWith('/sign-in')) {
      return NextResponse.next();
    }

    // Apply intl middleware for localized routes
    return intlMiddleware(request);
  },
  {
    signInUrl: '/sign-in',
    signUpUrl: '/sign-in',
  }
);

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api` (except /api/admin), `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api(?!/admin)|_next|_vercel|.*\\..*).*)',
    // Optional: only run on root (/) URL
    '/',
    // Include sign-in route
    '/sign-in(.*)',
    // Include admin API routes for authentication
    '/api/admin(.*)',
  ],
};
