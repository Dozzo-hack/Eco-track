import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Blocage ADMIN
    if (path.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/auth/admin", req.url));
    }
    // Blocage FLEET (TRUCK)
    if (path.startsWith("/truck") && token?.role !== "videur") {
      return NextResponse.redirect(new URL("/auth/truck", req.url));
    }
    // Blocage USER (DASHBOARD)
    if (path.startsWith("/dashboard") && token?.role !== "user") {
      return NextResponse.redirect(new URL("/auth/user", req.url));
    }
  },
  
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = { matcher: ["/admin/:path*", "/truck/:path*", "/dashboard/:path*"] };