import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const SESSION_COOKIE_NAME = 'lt_session_id';
const SESSION_DURATION_DAYS = 365 * 10; // Effectively indefinite (10 years)

/**
 * Retrieves the current anonymous session ID from cookies.
 * If no session exists, generates a new one.
 * 
 * Note: When using this in a Server Component or Route Handler, 
 * you might need to set the cookie in the response if it's a new session.
 * However, since we can't easily set cookies in Server Components,
 * we rely on the client-side or middleware to persist it, 
 * or we accept that for the *very first* request it might be generated fresh each time 
 * until the client stores it.
 * 
 * Ideally, this should be handled in Middleware, but for now we'll generate it on demand.
 */
export async function getSessionId(): Promise<string> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (sessionCookie?.value) {
        return sessionCookie.value;
    }

    return uuidv4();
}

/**
 * Helper to set the session cookie on a response object.
 * Use this in Route Handlers.
 */
export function setSessionCookie(response: Response, sessionId: string) {
    // Calculate expiration date
    const expires = new Date();
    expires.setDate(expires.getDate() + SESSION_DURATION_DAYS);

    // Append Set-Cookie header
    // Note: This is a simple implementation. In Next.js Route Handlers, 
    // you usually use cookies().set() if you are in a Server Action, 
    // or response.cookies.set() if using NextResponse.

    // For NextResponse (which most API routes use):
    if ((response as any).cookies) {
        (response as any).cookies.set({
            name: SESSION_COOKIE_NAME,
            value: sessionId,
            expires,
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
        });
    }
}
