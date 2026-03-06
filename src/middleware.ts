import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/api/auth'];
const STATIC_ROUTES = ['/_next', '/favicon', '/images', '/fonts'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow static files and next internals
    if (STATIC_ROUTES.some(r => pathname.startsWith(r))) {
        return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                }
            }
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // If user is logged in and hits /login, redirect to dashboard
    if (user && pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If user is not logged in and not on a public route, redirect to login
    if (!user && !PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect root to dashboard
    if (pathname === '/') {
        if (user) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
    ]
};
