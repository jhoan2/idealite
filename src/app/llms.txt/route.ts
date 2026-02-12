import { getPublishedBlogPosts } from "~/server/queries/blog";

/**
 * GET /llms.txt
 * 
 * Serves an AI-friendly index of the Idealite blog.
 * Follows the standard at https://llmstxt.org/
 */
export async function GET() {
  // 1. Fetch page 1 to discover total pages.
  const firstPage = await getPublishedBlogPosts({
    page: 1,
    pageSize: 100,
  });
  const posts = [...firstPage.data];

  // Fetch remaining pages so llms.txt includes all published posts.
  if (firstPage.totalPages > 1) {
    const pageNumbers = Array.from(
      { length: firstPage.totalPages - 1 },
      (_, idx) => idx + 2,
    );
    const remainingPages = await Promise.all(
      pageNumbers.map((page) => getPublishedBlogPosts({ page, pageSize: 100 })),
    );
    posts.push(...remainingPages.flatMap((page) => page.data));
  }

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
  const uniquePosts = Array.from(
    new Map(allPosts.map((post) => [post.slug, post])).values(),
  );
  const siteUrl = "https://idealite.xyz";

  // 2. Build the llms.txt content
  let output = `# Idealite

> Idealite is a platform for self-directed learners and autodidacts to escape the tutorial loop and build unique skill trees.

## Blog Posts

`;

  for (const post of uniquePosts) {
    const postUrl = `${siteUrl}/blog/${post.slug}`;
    const dateStr = post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
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
