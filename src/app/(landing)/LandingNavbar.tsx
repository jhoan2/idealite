import Link from "next/link";
import Image from "next/image";

export default function LandingNavbar() {
  return (
    <nav className="container mx-auto grid grid-cols-3 items-center px-4 py-6">
      {/* Column 1: Logo */}
      <div className="flex items-center p-4">
        <Link href="/">
          <div className="flex items-center space-x-2">
            <Image
              src="/icon128.png"
              alt="idealite logo"
              width={48}
              height={48}
              priority
            />
            <h1 className="text-xl font-semibold text-orange-600">Idealite</h1>
          </div>
        </Link>
      </div>

      {/* Column 2: Links */}
      <div className="flex items-center justify-center gap-8">
        <Link
          href="/blog"
          className="text-base font-medium text-gray-900 transition-colors hover:text-orange-600"
        >
          Blog
        </Link>
        <Link
          href="https://x.com/idealitexyz"
          target="_blank"
          rel="noopener noreferrer"
          className="text-base font-medium text-gray-900 transition-colors hover:text-orange-600"
        >
          Twitter
        </Link>
        <Link
          href="/blog/introducing-idealite"
          className="text-base font-medium text-gray-900 transition-colors hover:text-orange-600"
        >
          About
        </Link>
        <Link
          href="mailto:john@idealite.xyz"
          className="text-base font-medium text-gray-900 transition-colors hover:text-orange-600"
        >
          Help
        </Link>
      </div>

      {/* Column 3: Empty (for future use) */}
      <div></div>
    </nav>
  );
}
