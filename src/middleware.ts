import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/workspace(.*)",
  "/test(.*),",
  "/play(.*)",
  "/chat(.*)",
]);

export default clerkMiddleware(
  async (auth, req) => {
    // Protect all routes starting with `/admin`
    const { userId } = await auth();

    if (isProtectedRoute(req) && !userId) {
      const url = new URL("/profile", req.url);
      return NextResponse.redirect(url);
    }
  },
  {
    authorizedParties: ["https://idealite.xyz", "http://localhost:3000"],
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
