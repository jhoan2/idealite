import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublishedBlogPosts } from "~/server/queries/blog";

export const metadata: Metadata = {
  title: "Blog - Idealite",
  description: "Insights, updates, and stories from the Idealite team",
  openGraph: {
    title: "Blog - Idealite",
    description: "Insights, updates, and stories from the Idealite team",
    images: ["/icon128.png"],
    type: "website",
    siteName: "Idealite",
  },
  twitter: {
    card: "summary",
    title: "Blog - Idealite",
    description: "Insights, updates, and stories from the Idealite team",
    images: ["/icon128.png"],
  },
};

export default async function BlogPage() {
  const { data: posts, totalPages } = await getPublishedBlogPosts({
    page: 1,
    pageSize: 12,
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="container mx-auto flex items-center px-4 py-6">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <Image
                src="/icon128.png"
                alt="idealite logo"
                width={48}
                height={48}
                priority
              />
              <h1 className="text-xl font-semibold text-orange-600">
                Idealite
              </h1>
            </div>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="border-b bg-gradient-to-b from-orange-50 to-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-5xl font-bold text-gray-900">Blog</h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Insights, updates, and stories from the Idealite team
          </p>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="container mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-gray-600">
              No blog posts published yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-lg"
              >
                {/* Cover Image */}
                {post.coverImage && (
                  <div className="aspect-video overflow-hidden bg-gray-100">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <h2 className="mb-2 text-xl font-semibold text-gray-900 group-hover:text-orange-600">
                    {post.title}
                  </h2>

                  {post.excerpt && (
                    <p className="mb-4 line-clamp-3 text-gray-600">
                      {post.excerpt}
                    </p>
                  )}

                  {post.publishedAt && (
                    <p className="text-sm text-gray-500">
                      {new Date(post.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}

                  <div className="mt-4 inline-flex items-center text-sm font-medium text-orange-600">
                    Read more
                    <span className="ml-1">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
