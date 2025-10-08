import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";

const isProtectedRoute = createRouteMatcher([
  "/workspace(.*)",
  "/test(.*)",
  "/play(.*)",
  "/chat(.*)",
]);

const isCorsRoute = (path: string) => path.startsWith("/api/obsidian/");

const ALLOWED_ORIGINS = [
  "https://www.idealite.xyz",
  "http://localhost:3000",
  "https://www.idealight.xyz",
  "http://www.idealight.xyz",
  "app://obsidian.md",
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

// Simple hash function for consistent variant assignment
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// A/B test variant assignment
async function getVariant(req: NextRequest): Promise<string> {
  try {
    // Check if user already has a variant assigned
    const existingVariant = req.cookies.get("landing_variant")?.value;
    if (existingVariant) {
      return existingVariant;
    }

    // Get experiment config from Edge Config
    const config = await get<{
      enabled: boolean;
      variants: Record<string, number>;
    }>("landing_test");

    // If experiment is disabled, return control
    if (!config || !config.enabled) {
      return "control";
    }

    // Generate a consistent ID for this user (using IP + User-Agent)
    const ip = req.ip || req.headers.get("x-forwarded-for") || "anonymous";
    const userAgent = req.headers.get("user-agent") || "";
    const userId = `${ip}-${userAgent}`;

    // Hash the userId to get a consistent number
    const hash = hashString(userId);
    const percentage = hash % 100;

    // Assign variant based on percentage thresholds
    const variants = Object.entries(config.variants);
    let cumulativePercentage = 0;

    for (const [variant, weight] of variants) {
      cumulativePercentage += weight;
      if (percentage < cumulativePercentage) {
        return variant;
      }
    }

    // Fallback to control
    return "control";
  } catch (error) {
    console.error("Error getting variant:", error);
    return "control";
  }
}

export default clerkMiddleware(
  async (auth, req: NextRequest) => {
    const { pathname } = req.nextUrl;
    const origin = req.headers.get("origin");

    /* ---------- 1. Handle ALL OPTIONS requests for CORS routes FIRST ----------- */
    if (req.method === "OPTIONS" && isCorsRoute(pathname)) {
      const response = new NextResponse(null, { status: 200 });
      return applyCors(response, origin);
    }

    /* ---------- 2. Skip Clerk auth entirely for Obsidian API routes ------------ */
    if (isCorsRoute(pathname)) {
      const res = NextResponse.next();
      return applyCors(res, origin);
    }

    /* ---------- 3. A/B Testing for landing page -------------------------------- */
    if (pathname === "/") {
      const variant = await getVariant(req);

      // Create response with rewrite to variant path
      const url = req.nextUrl.clone();
      url.pathname = `/landing/${variant}`;
      const response = NextResponse.rewrite(url);

      // Set cookie to persist variant (30 days)
      response.cookies.set("landing_variant", variant, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
      });

      return response;
    }

    /* ---------- 4. Handle protected Clerk routes ------------------------------- */
    const { userId } = await auth();
    if (isProtectedRoute(req) && !userId) {
      return NextResponse.redirect(new URL("/profile", req.url));
    }

    /* ---------- 5. Default pass-through ---------------------------------------- */
    return NextResponse.next();
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
