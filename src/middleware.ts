import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Simple in-memory rate limit store for Edge (Note: resets per Vercel edge isolate, but fine for single instance / development)
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();

export default withAuth(
  function middleware(req) {
    // Apply rate limiting for sensitive/heavy public endpoints like login or markers
    const path = req.nextUrl.pathname;
    
    if (path.startsWith("/login") || path.startsWith("/api/markers") || path.startsWith("/register")) {
      const ip = req.headers.get("x-forwarded-for") || (req as any).ip || "127.0.0.1";
      const limit = 50; // 50 requests per minute
      const windowMs = 60 * 1000;
      
      const now = Date.now();
      const current = rateLimitMap.get(ip);
      
      if (!current || current.resetAt < now) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      } else {
        if (current.count >= limit) {
          return NextResponse.json(
            { success: false, message: "Too many requests" }, 
            { status: 429 }
          );
        }
        current.count += 1;
        rateLimitMap.set(ip, current);
      }
    }
    
    // Add correlation ID header for logging observability
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-correlation-id', crypto.randomUUID());

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect /dashboard and its sub-routes
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token; // Only allow if token exists (logged in)
        }
        return true; // Allow other routes (public)
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (logo.png, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
