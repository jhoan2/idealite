// app/api/test-manifest/route.ts
import { NextRequest } from "next/server";

// Import your manifest configurations
import { manifestConfigs } from "../../.well-known/farcaster.json/route";

export async function GET(request: NextRequest) {
  // Create a URL object from the request URL
  // For example, if the request is to "http://localhost:3000/api/test-manifest?domain=idealite.xyz"
  const url = new URL(request.url);

  // Extract the 'domain' parameter from the URL query string
  // If URL is "http://localhost:3000/api/test-manifest?domain=idealite.xyz"
  // testDomain will be "idealite.xyz"
  const testDomain = url.searchParams.get("domain");

  // If no domain parameter was provided in the URL
  // Return a 400 Bad Request error
  if (!testDomain) {
    return Response.json(
      {
        error: "Domain parameter required",
        usage: {
          example: "/api/test-manifest?domain=idealite.xyz",
          availableDomains: Object.keys(manifestConfigs),
        },
      },
      { status: 400 },
    );
  }

  // Look up the manifest for the requested domain
  const manifest = manifestConfigs[testDomain];

  // If no manifest exists for the requested domain
  // Return a 404 Not Found error
  if (!manifest) {
    return Response.json(
      {
        error: "Manifest not found",
        availableDomains: Object.keys(manifestConfigs),
      },
      { status: 404 },
    );
  }

  // If we found a manifest, return it
  return Response.json(manifest);
}

// Usage examples:
// 1. Test with a valid domain:
//    GET http://localhost:3000/api/test-manifest?domain=idealite.xyz
//    Returns the manifest for idealite.xyz
//
// 2. Test with no domain parameter:
//    GET http://localhost:3000/api/test-manifest
//    Returns: { "error": "Domain parameter required", "usage": {...} }
//
// 3. Test with invalid domain:
//    GET http://localhost:3000/api/test-manifest?domain=invalid.com
//    Returns: { "error": "Manifest not found", "availableDomains": [...] }
