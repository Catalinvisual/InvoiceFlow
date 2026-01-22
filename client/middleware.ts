import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Protect Dashboard Routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/portal')) {
    if (!token) {
      const url = new URL('/login', req.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Role-based Access Control
  if (token) {
    const role = token.role as string;

    // Admin Routes
    if (pathname.startsWith('/admin') && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Vendor Routes (Standard Dashboard)
    // Vendors can see /dashboard. Customers should go to /portal.
    if (pathname.startsWith('/dashboard') && role === 'CUSTOMER') {
      return NextResponse.redirect(new URL('/portal', req.url));
    }
    
    // Portal Routes (Customers only, or maybe Vendors to preview)
    if (pathname.startsWith('/portal') && role !== 'CUSTOMER' && role !== 'SUPER_ADMIN') {
        // Optional: Allow vendors to see portal? For now strict separation.
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Redirect root to appropriate dashboard
    // REMOVED: Allow logged-in users to see the landing page
    // if (pathname === '/') {
    //     if (role === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/admin', req.url));
    //     if (role === 'CUSTOMER') return NextResponse.redirect(new URL('/portal', req.url));
    //     if (role === 'VENDOR') return NextResponse.redirect(new URL('/dashboard', req.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/portal/:path*', '/'],
};
