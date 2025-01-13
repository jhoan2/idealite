import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanUrl(urlString: string): string {
  try {
    // Handle cases where protocol is missing
    if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
      urlString = "https://" + urlString;
    }

    const url = new URL(urlString);

    // Remove www. if present
    let hostname = url.hostname.replace(/^www\./, "");

    // Remove common tracking parameters
    const cleanSearch = new URLSearchParams();
    const searchParams = new URLSearchParams(url.search);

    // List of parameters to keep (add more as needed)
    const validParams = new Set([
      "id",
      "v", // YouTube video ID
      "p", // Page number
      "q", // Query
    ]);

    for (const [key, value] of searchParams) {
      if (validParams.has(key)) {
        cleanSearch.append(key, value);
      }
    }

    // Construct clean URL
    let cleanPath = url.pathname;

    // Remove trailing slash
    if (cleanPath.endsWith("/") && cleanPath !== "/") {
      cleanPath = cleanPath.slice(0, -1);
    }

    // Remove index.html and similar endings
    cleanPath = cleanPath.replace(
      /\/(index|default)\.(html|htm|php|asp)$/,
      "/",
    );

    // Construct final URL
    let cleanUrl = hostname + cleanPath;

    // Add clean search parameters if they exist
    const cleanSearchString = cleanSearch.toString();
    if (cleanSearchString) {
      cleanUrl += "?" + cleanSearchString;
    }

    // Remove hash/fragment unless it's a specific case we want to keep
    // For example, keep GitHub file line numbers or YouTube timestamps
    if (url.hash && !url.hash.match(/(^#L\d+$)|(^#t=\d+s$)/)) {
      cleanUrl = cleanUrl.split("#")[0] || "";
    }

    return cleanUrl.toLowerCase();
  } catch (error) {
    console.error("Error cleaning URL:", error);
    return urlString;
  }
}
