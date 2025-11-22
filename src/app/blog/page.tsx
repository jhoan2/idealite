import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublishedBlogPosts } from "~/server/queries/blog";
import { lora } from "~/app/ui/fonts";

export const metadata: Metadata = {
  title: "Blog - Idealite",
  description: "A curated collection of thoughts",
  openGraph: {
    title: "Blog - Idealite",
    description: "A curated collection of thoughts",
    images: ["/icon128.png"],
    type: "website",
    siteName: "Idealite",
  },
  twitter: {
    card: "summary",
    title: "Blog - Idealite",
    description: "A curated collection of thoughts",
    images: ["/icon128.png"],
  },
};

export default async function BlogPage() {
  const { data: posts, totalPages } = await getPublishedBlogPosts({
    page: 1,
    pageSize: 12,
  });

  return (
    <div
      className={`min-h-screen bg-near-black text-off-white antialiased ${lora.variable}`}
    >
      {/* Navigation */}
      <nav className="w-full border-b border-muted-yellow/20 py-6 md:py-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <div className="group flex items-center space-x-3">
              <Image
                src="/icon128.png"
                alt="idealite logo"
                width={40}
                height={40}
                className="opacity-70 transition duration-300 group-hover:opacity-100"
              />
              <h1 className="font-serif text-xl uppercase tracking-widest text-off-white transition duration-300 hover:text-primary-yellow md:text-2xl">
                Idealite.
              </h1>
            </div>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-muted-yellow/20 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 font-serif text-5xl font-thin tracking-tighter text-off-white sm:text-6xl lg:text-7xl">
            Blog
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-off-white/70 sm:text-xl">
            A curated collection of thoughts
          </p>
        </div>
      </header>

      {/* Blog Posts Grid */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {allPosts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-off-white/60">
              The archive awaits its first entry. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {allPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-xl border border-muted-yellow/20 bg-near-black shadow-lg shadow-primary-yellow/5 transition-all hover:border-primary-yellow/40 hover:shadow-primary-yellow/10"
              >
                {/* Cover Image */}
                {post.coverImage && (
                  <div className="aspect-video overflow-hidden bg-off-white/5">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <h2 className="mb-3 font-serif text-2xl font-medium leading-tight text-off-white transition-colors group-hover:text-primary-yellow">
                    {post.title}
                  </h2>

                  {post.excerpt && (
                    <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-off-white/70">
                      {post.excerpt}
                    </p>
                  )}

                  {post.publishedAt && (
                    <p className="text-xs uppercase tracking-wider text-muted-yellow">
                      {new Date(post.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}

                  <div className="mt-4 inline-flex items-center text-sm font-medium uppercase tracking-wider text-primary-yellow">
                    Read More
                    <span className="ml-2">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 w-full border-t border-muted-yellow/20 py-10">
        <div className="mx-auto px-4 text-center text-xs uppercase tracking-widest text-off-white/50 sm:px-6 lg:px-8">
          <p>
            &copy; 2025 Idealite. All rights reserved.{" "}
            <span className="mx-3">|</span> Designed with Intent.
          </p>
        </div>
      </footer>
    </div>
  );
}
