import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/workspace(.*)",
  "/test(.*)",
  "/play(.*)",
  "/chat(.*)",
]);

const isCorsRoute = (path: string) => path.startsWith("/api/obsidian/");

// Define allowed origins - include the Obsidian app origin
const ALLOWED_ORIGINS = [
  "https://www.idealite.xyz",
  "http://localhost:3000",
  "https://www.idealight.xyz",
  "http://www.idealight.xyz",
  "app://obsidian.md", // Add Obsidian origin
];

function applyCors(res: NextResponse, origin: string | null) {
  // Handle Obsidian's non-standard origin or allow all for Obsidian API
  if (
    origin === "app://obsidian.md" ||
    ALLOWED_ORIGINS.includes(origin || "")
  ) {
    res.headers.set("Access-Control-Allow-Origin", origin || "*");
  } else {
    // For obsidian routes, be more permissive since they're authenticated via API token
    res.headers.set("Access-Control-Allow-Origin", "*");
  }

  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS",
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  res.headers.set("Access-Control-Max-Age", "86400");
  res.headers.set(
    "Access-Control-Expose-Headers",
    "Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Daily-Remaining, X-RateLimit-Minute-Remaining",
  );
  res.headers.set("Access-Control-Allow-Credentials", "false");

  return res;
}

export default clerkMiddleware(
  async (auth, req: NextRequest) => {
    const { pathname } = req.nextUrl;
    const origin = req.headers.get("origin");

    /* ---------- 1. CORS pre-flight early exit --------------------------- */
    if (req.method === "OPTIONS" && isCorsRoute(pathname)) {
      const response = new NextResponse(null, { status: 200 });
      return applyCors(response, origin);
    }

    /* ---------- 2. Protected Clerk routes ------------------------------- */
    const { userId } = await auth();
    if (isProtectedRoute(req) && !userId) {
      return NextResponse.redirect(new URL("/profile", req.url));
    }

    /* ---------- 3. Pass-through, but attach CORS to response ------------ */
    const res = NextResponse.next();
    if (isCorsRoute(pathname)) {
      applyCors(res, origin);
    }
    return res;
  },
  {
    authorizedParties: [
      "https://www.idealite.xyz",
      "http://localhost:3000",
      "https://www.idealight.xyz",
      "http://www.idealight.xyz",
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
