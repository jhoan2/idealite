import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/workspace(.*)",
  "/test(.*)",
  "/play(.*)",
  "/chat(.*)",
]);

// Routes that need CORS (for external apps like Obsidian)
const isCorsRoute = createRouteMatcher(["/api/obsidian(.*)"]);

// CORS headers for external apps
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "false",
};

export default clerkMiddleware(
  async (auth, req: NextRequest) => {
    // Handle CORS for specific API routes BEFORE auth check
    if (isCorsRoute(req)) {
      // Handle OPTIONS preflight requests
      if (req.method === "OPTIONS") {
        return new NextResponse(null, {
          status: 200,
          headers: corsHeaders,
        });
      }

      // For non-OPTIONS requests to CORS routes, continue with auth
      // but we'll add CORS headers to the response later
    }

    // Protect all routes starting with the protected patterns
    const { userId } = await auth();

    if (isProtectedRoute(req) && !userId) {
      const url = new URL("/profile", req.url);
      return NextResponse.redirect(url);
    }

    // If this is a CORS route, we need to add CORS headers to the response
    if (isCorsRoute(req)) {
      // Continue to the API route handler, but we'll add headers
      const response = NextResponse.next();

      // Add CORS headers to the response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    // For all other routes, continue normally
    return NextResponse.next();
  },
  {
    authorizedParties: [
      "https://www.idealite.xyz",
      "http://localhost:3000",
      "www.idealight.xyz",
      "https://www.idealight.xyz",
    ],
  },
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
