import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "~/server/queries/blog";

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

      {/* Article */}
      <article className="mx-auto max-w-4xl px-4 py-12">
        {/* Back Link */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center text-sm font-medium text-gray-600 hover:text-orange-600"
        >
          <span className="mr-2">←</span>
          Back to Blog
        </Link>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="mb-8 overflow-hidden rounded-lg">
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mb-4 text-xl text-gray-600">{post.excerpt}</p>
          )}

          {post.publishedAt && (
            <p className="text-sm text-gray-500">
              Published on{" "}
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
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-orange-600 prose-strong:text-gray-900"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Footer */}
        <div className="mt-12 border-t pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center text-base font-medium text-orange-600 hover:text-orange-700"
          >
            <span className="mr-2">←</span>
            Back to all posts
          </Link>
        </div>
      </article>
    </div>
  );
}
