import Link from "next/link";
import Image from "next/image";
import {
  SignInButton,
  SignedOut,
  SignedIn,
  UserButton,
  SignUpButton,
} from "@clerk/nextjs";

export default function Hero() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Gradient Background with Grid Pattern */}
      <div className="absolute inset-0 bg-white">
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="rgb(3 49 140 / 0.4)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto flex items-center justify-between px-4 py-6">
          <div className="flex items-center justify-between p-4">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <Image
                  src="/icon128.png"
                  alt="idealite logo"
                  width={48}
                  height={48}
                  priority
                />
                <h1 className="text-xl font-semibold text-amber-600">
                  Idealite
                </h1>
              </div>
            </Link>
          </div>
          <div className="flex gap-4">
            <SignedOut>
              <SignInButton>
                <button className="rounded-lg bg-gray-800 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-700">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-700">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </nav>

        {/* Main Hero Content */}
        <div className="container mx-auto mt-8 px-4 text-center">
          <div className="mb-2 inline-flex items-center rounded-full border border-indigo-200 bg-white bg-opacity-80 px-4 py-2 text-sm backdrop-blur-sm">
            <span className="mr-2">✨</span>
            Learn & Adventure with
            <span className="pl-2 font-medium text-orange-600">Idealite</span>
            <span className="ml-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
              BETA
            </span>
            <span className="ml-2">→</span>
          </div>

          <h1 className="mx-auto max-w-5xl pt-4 text-4xl font-bold leading-tight text-gray-900 md:text-6xl">
            Focus on Learning, Not Busy Work
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
            Knowledge management on autopilot. Automation prunes the clutter;
            you harvest the insights.
          </p>

          <div className="mb-12 mt-8">
            <Link
              href="/workspace"
              className="inline-flex transform items-center rounded-md bg-orange-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all transition-colors duration-200 hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-xl"
            >
              Get Started for free
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 flex justify-center">
        <Image
          src="/phone-mockup.png"
          alt="App interface on mobile"
          width={350}
          height={700}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
