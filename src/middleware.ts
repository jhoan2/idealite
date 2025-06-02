import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/workspace(.*)",
  "/test(.*)",
  "/play(.*)",
  "/chat(.*)",
]);

const isCorsRoute = (req: NextRequest) => {
  return req.nextUrl.pathname.startsWith("/api/obsidian/");
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "false",
};

export default clerkMiddleware(
  async (auth, req: NextRequest) => {
    // Handle CORS for Obsidian API routes
    if (isCorsRoute(req)) {
      if (req.method === "OPTIONS") {
        return new NextResponse(null, {
          status: 200,
          headers: corsHeaders,
        });
      }
    }

    // Clerk auth for protected routes
    const { userId } = await auth();
    if (isProtectedRoute(req) && !userId) {
      const url = new URL("/profile", req.url);
      return NextResponse.redirect(url);
    }

    // Add CORS headers to CORS route responses
    if (isCorsRoute(req)) {
      const response = NextResponse.next();
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

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
