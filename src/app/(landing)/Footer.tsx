import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-black px-6 py-12 text-white md:px-12">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-8 md:flex-row md:gap-16">
          {/* Brand Section */}
          <div className="md:w-1/3">
            <div className="mb-3 flex items-center gap-2">
              <Image src="/icon48.png" alt="idealite" width={32} height={32} />
              <span className="text-xl font-bold">idealite</span>
            </div>
          </div>
          {/* Links Section */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 md:w-2/3">
            {/* Community Column */}
            <div>
              <h3 className="mb-4 text-sm font-medium tracking-wider">
                COMMUNITY
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="https://warpcast.com/~/channel/idealite"
                    className="text-gray-300 transition-colors hover:text-white"
                  >
                    Warpcast
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://x.com/jhoangeth"
                    className="text-gray-300 transition-colors hover:text-white"
                  >
                    Twitter
                  </Link>
                </li>
                <li>
                  <Link
                    href="mailto:john@idealite.xyz"
                    className="text-gray-300 transition-colors hover:text-white"
                  >
                    Email
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="mb-4 text-sm font-medium tracking-wider">LEGAL</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="#"
                    className="text-gray-300 transition-colors hover:text-white"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-300 transition-colors hover:text-white"
                  >
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between border-t border-gray-800 pt-8 md:flex-row">
          <p className="text-sm text-gray-400">
            Copyright © {new Date().getFullYear()} idealite. All Rights
            Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
