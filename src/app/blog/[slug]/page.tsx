import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "~/server/queries/blog";
import { lora } from "~/app/ui/fonts";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const siteUrl = "https://idealite.xyz";
  const postUrl = `${siteUrl}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt ?? "Read this article on Idealite",
    openGraph: {
      title: post.title,
      description: post.excerpt ?? "Read this article on Idealite",
      images: post.coverImage ? [post.coverImage] : [],
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      url: postUrl,
      siteName: "Idealite",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? "Read this article on Idealite",
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

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

      {/* Article */}
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Back Link */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center text-sm font-medium uppercase tracking-wider text-muted-yellow transition-colors hover:text-primary-yellow"
        >
          <span className="mr-2">←</span>
          Back to Blog
        </Link>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="mb-12 overflow-hidden rounded-xl border border-muted-yellow/20 shadow-lg">
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-auto w-full object-cover opacity-90"
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-12 border-b border-muted-yellow/20 pb-8">
          <h1 className="mb-6 font-serif text-4xl font-thin tracking-tighter text-off-white sm:text-5xl md:text-6xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mb-6 text-lg leading-relaxed text-off-white/70 sm:text-xl">
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
        </header>

        {/* Content */}
        <div
          className="prose prose-lg prose-invert max-w-none prose-headings:font-serif prose-headings:font-thin prose-headings:text-off-white prose-p:leading-relaxed prose-p:text-off-white/80 prose-a:text-primary-yellow prose-a:transition-colors hover:prose-a:text-muted-yellow prose-blockquote:border-muted-yellow/30 prose-blockquote:text-off-white/70 prose-strong:text-off-white prose-code:text-muted-yellow"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Footer */}
        <div className="mt-16 border-t border-muted-yellow/20 pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center text-base font-medium uppercase tracking-wider text-primary-yellow transition-colors hover:text-muted-yellow"
          >
            <span className="mr-2">←</span>
            Back to all posts
          </Link>
        </div>
      </article>

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
