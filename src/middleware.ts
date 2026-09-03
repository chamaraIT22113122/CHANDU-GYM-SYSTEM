import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super_secret_chandu_gym_key_change_in_production"
);

// Define allowed routes for instructors
const INSTRUCTOR_ALLOWED_ROUTES = [
  "/admin", // Dashboard
  "/admin/members",
  "/admin/schedules",
  "/admin/attendance",
  "/admin/settings", // Allowed so they can access the Security tab to change passwords
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin and /member routes for now
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/member")) {
    return NextResponse.next();
  }

  // Allow access to login pages
  if (pathname === "/admin/login" || pathname === "/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // Admin routes protection
    if (pathname.startsWith("/admin")) {
      if (role === "MEMBER") {
        return NextResponse.redirect(new URL("/member", request.url));
      }

      if (role === "INSTRUCTOR") {
        // Check if the route is exact match or subpath of allowed routes
        const isAllowed = INSTRUCTOR_ALLOWED_ROUTES.some(route => 
          pathname === route || pathname.startsWith(`${route}/`)
        );

        if (!isAllowed) {
          // Redirect to admin dashboard if not allowed
          return NextResponse.redirect(new URL("/admin", request.url));
        }
      }
    }

    // Member routes protection (optional, assuming /member exists)
    if (pathname.startsWith("/member")) {
      if (role === "ADMIN" || role === "INSTRUCTOR") {
        // Admins and instructors shouldn't use the member portal typically,
        // but if they try, redirect them to admin portal
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
}

export const config = {
  matcher: ["/admin/:path*", "/member/:path*"],
};
