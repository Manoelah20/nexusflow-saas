import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export default auth((request) => {
    const isAuthenticated = Boolean(request.auth?.user?.id);
    const { pathname } = request.nextUrl;

    const isProtectedRoute = pathname.startsWith('/dashboard');
    const isAuthRoute = pathname === '/login';

    if (isProtectedRoute && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isAuthRoute && isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/dashboard/:path*', '/login'],
};