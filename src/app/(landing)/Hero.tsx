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
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="container mx-auto flex items-center justify-between px-4 py-6">
        <div className="flex items-center justify-between p-4 text-foreground">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <Image
                src="/icon48.png"
                alt="idealite logo"
                width={48}
                height={48}
                priority
              />
              <h1 className="text-xl font-semibold text-amber-400">Idealite</h1>
            </div>
          </Link>
        </div>
        <div className="flex gap-4">
          <SignedOut>
            <SignInButton />
            <SignUpButton>
              <button className="rounded-lg bg-gray-100 px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-200">
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
      <div className="container mx-auto mt-32 px-4 text-center">
        <div className="mb-2 inline-flex items-center rounded-full bg-white bg-opacity-10 px-4 py-2 text-sm">
          <span className="mr-2">✨</span>
          Learn & Adventure with
          <span className="pl-2 text-orange-600">Idealite</span>
          <span className="ml-2">→</span>
        </div>

        <h1 className="mx-auto max-w-5xl text-6xl font-bold leading-tight md:text-8xl">
          Become a Memory Master
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-400">
          Turn your knowledge into a memory palace to remember them better.
        </p>

        <div className="mt-12">
          <Link
            href="/workspace"
            className="inline-flex items-center rounded-md bg-white px-6 py-3 text-black hover:bg-gray-200"
          >
            Get Started for free
            <span className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
