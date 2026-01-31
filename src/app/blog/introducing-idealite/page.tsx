import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { lora } from "~/app/ui/fonts";

export const metadata: Metadata = {
  title: "Introducing Idealite",
  description:
    "Fundamentally, idealite's mission is to provide a different path",
  openGraph: {
    title: "Introducing Idealite",
    description:
      "Fundamentally, idealite's mission is to provide a different path",
    type: "article",
    siteName: "Idealite",
  },
  twitter: {
    card: "summary_large_image",
    title: "Introducing Idealite",
    description:
      "Fundamentally, idealite's mission is to provide a different path",
  },
};

export default function IntroducingIdealite() {
  return (
    <div
      className={`min-h-screen bg-dark-primary font-sans text-light-secondary antialiased ${lora.variable}`}
    >
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-10 bg-dark-primary/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo/Title */}
          <Link
            href="/"
            className="flex items-center space-x-2 transition duration-300 hover:opacity-80"
          >
            <Image
              src="/icon128.png"
              alt="idealite logo"
              width={32}
              height={32}
              priority
            />
            <h1 className="font-serif text-xl uppercase tracking-widest text-off-white transition duration-300 hover:text-primary-yellow md:text-2xl">
              Idealite.
            </h1>
          </Link>
          {/* Nav Links */}
          <div className="space-x-8 font-sans text-sm tracking-widest">
            <Link
              href="/blog"
              className="text-light-secondary transition duration-300 hover:text-accent-vibrant"
            >
              BLOG
            </Link>
          </div>
        </div>
      </nav>

      {/* Header / Cinematic Hero Section */}
      <header className="flex min-h-screen items-center justify-center p-8 lg:p-16">
        <div className="max-w-6xl text-center">
          <h1 className="mb-6 font-serif text-5xl font-thin leading-tight tracking-tighter sm:text-7xl lg:text-8xl">
            <span className="text-accent-vibrant">Introducing</span> Idealite
          </h1>
          <p className="mx-auto mb-10 max-w-4xl text-xl font-light text-accent-muted sm:text-2xl">
            Fundamentally, idealite's mission is to provide a different path
          </p>
          <a
            href="#manifesto"
            className="inline-block rounded-md border border-accent-muted px-8 py-3 text-lg font-medium tracking-wider transition-colors duration-300 hover:bg-accent-muted hover:text-dark-primary"
          >
            Explore the Void
          </a>
        </div>
      </header>

      {/* Mid-Section / Manifesto */}
      <section
        id="manifesto"
        className="border-y border-gray-800/50 py-24 sm:py-32 lg:py-48"
      >
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="mb-12 text-center font-serif text-4xl font-thin text-accent-vibrant sm:text-5xl">
            M A N I F E S T O
          </h2>
          <div className="space-y-10 text-lg leading-relaxed sm:text-xl">
            <p>
              <span className="float-left pr-1 font-serif text-3xl text-accent-muted">
                G
              </span>
              enerally, the canonical startup advice when introducing your
              product is to say a one liner about what your product does, but it
              hard figuring out what exactly to say because the product changes
              so much. Instead, it would be easier to talk about what won&apos;t
              change which is its mission to fundamentally change education.
            </p>
            <p>
              In order to explain what this means, we have to start from the
              very beginning with the question of what is education. The word
              itself comes from educe which means to unleash one&apos;s
              potential. So, education is an attempt to answer the perennial
              question of who you should become.
            </p>
            <p>
              This makes the university&apos;s answer to be that you should
              become the universal being. In contrast, idealite&apos;s answer is
              to become the ideal being. Where as the universal being is well
              rounded and belongs anywhere, the ideal being belongs only in the
              ideal, and thus cannot be well rounded. As opposed to the
              universal being looking the same as every other one, each ideal
              being is unique and different from the next.
            </p>
            <p>
              Fundamentally, idealite's mission is to provide a different path
              and with that a different answer to the question of who you should
              become.
            </p>
            <p>
              That said, as with paving any new path, it is best to start with
              the first step, and we are doing that by working on a product that
              changes how a person learns. If the goal is to reach the ideal, it
              doesn't make sense to continue using the memorize to learn study
              system from school where the goal was to reach the same answers.
              What we should be doing instead is creating. Rather than doing
              repetitions, we should be using our creativity to create variation
              of our ideas, and then selecting for the best. If we are
              successful, we can see that we have learned something, not by
              recalling the details, but whether or not we have improved.
            </p>
            <p className="pt-8 text-center font-serif italic text-accent-muted">
              &ldquo;The present is pregnant with the future. - Voltaire&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Footer / Contact & Final CTA */}
      <footer className="py-16 sm:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 text-center lg:px-8">
          <div className="flex flex-col space-y-4 text-lg sm:flex-row sm:space-x-8 sm:space-y-0">
            <a
              href="mailto:john@idealite.xyz"
              className="text-light-secondary transition-colors duration-300 hover:text-accent-vibrant"
            >
              Email: john@idealite.xyz
            </a>
          </div>
          <p className="mt-16 text-sm text-gray-700/80">
            &copy; 2025 Idealite. All Rights Reserved to the Silence.
          </p>
        </div>
      </footer>
    </div>
  );
}
