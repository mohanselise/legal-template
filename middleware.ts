import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest } from 'next/server';

// German language codes (ISO 639-1)
const GERMAN_LANGUAGE_CODES = ['de', 'de-de', 'de-at', 'de-ch', 'de-li', 'de-be', 'de-lu'];

// Define protected routes (admin dashboard and its subroutes)
const isProtectedRoute = createRouteMatcher([
  '/:locale/admin(.*)',
]);

function detectLocale(request: NextRequest): string | undefined {
  // 1. Check cookie preference first (highest priority)
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && routing.locales.includes(cookieLocale as any)) {
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

  // 3. Default to English (will use defaultLocale from routing)
  return undefined;
}

// Create the base next-intl middleware
const intlMiddleware = createMiddleware(routing);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Protect admin routes
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Handle i18n routing
  const pathname = request.nextUrl.pathname;
  const pathnameHasLocale = routing.locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale in path and not an API/static route, detect and redirect
  if (!pathnameHasLocale && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.startsWith('/_vercel') && !pathname.startsWith('/sign-in')) {
    const detectedLocale = detectLocale(request) || routing.defaultLocale;
    const newUrl = new URL(`/${detectedLocale}${pathname}`, request.url);
    // Preserve query parameters
    newUrl.search = request.nextUrl.search;
    return Response.redirect(newUrl);
  }

  // Use the next-intl middleware for everything else
  // Important: Return the response directly without trying to modify it
  const response = intlMiddleware(request);
  return response;
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Optional: only run on root (/) URL
    '/',
    // Include sign-in route
    '/sign-in(.*)',
  ],
};

