import { NextResponse } from "next/headers";
import { getPublishedBlogPosts } from "~/server/queries/blog";
import { createIdealiteTurndown } from "~/lib/markdown/turndown-rules";

/**
 * GET /llms.txt
 * 
 * Serves an AI-friendly index of the Idealite blog.
 * Follows the standard at https://llmstxt.org/
 */
export async function GET() {
  const turndown = createIdealiteTurndown();
  
  // 1. Fetch data
  const { data: posts } = await getPublishedBlogPosts({
    page: 1,
    pageSize: 100, // Get all recent posts for the index
  });

  // Featured static blog post (matching src/app/blog/page.tsx)
  const featuredPosts = [
    {
      id: "introducing-idealite",
      slug: "introducing-idealite",
      title: "Introducing Idealite",
      excerpt: "Fundamentally, idealite's mission is to provide a different path",
      publishedAt: new Date("2025-11-23"),
    },
  ];

  const allPosts = [...featuredPosts, ...posts];
  const siteUrl = "https://idealite.xyz";

  // 2. Build the llms.txt content
  let output = "# Idealite

";
  output += "> Idealite is a platform for self-directed learners and autodidacts to escape the tutorial loop and build unique skill trees.

";
  
  output += "## Blog Posts

";

  for (const post of allPosts) {
    const postUrl = `${siteUrl}/blog/${post.slug}`;
    const dateStr = post.publishedAt 
      ? new Date(post.publishedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
      : "";
    
    output += `### [${post.title}](${postUrl})
`;
    if (dateStr) output += `*Published on ${dateStr}*

`;
    
    // Use excerpt if available, otherwise we could try to generate one
    const description = post.excerpt || "Read this article on Idealite.";
    output += `${description}

`;
  }

  // 3. Return as plain text
  return new Response(output, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
