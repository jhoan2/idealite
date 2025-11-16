import Link from "next/link";
import Image from "next/image";
import { SignedIn } from "@clerk/nextjs";
import { WaitlistButton } from "~/components/WaitlistButton";
import LandingNavbar from "~/app/(landing)/LandingNavbar";

export function HeroTransformation() {
  return (
    <div className="relative min-h-[120vh] overflow-hidden md:min-h-[140vh] md:pb-24">
      {/* Sky Gradient Background */}
      <div className="absolute inset-0 bg-sky-400"></div>

      <Image
        src="/top-left-foliage.PNG"
        alt=""
        width={400}
        height={150}
        className="absolute left-0 top-0 z-0 hidden h-auto w-48 object-contain md:block md:w-64 lg:w-80"
        priority
      />
      <Image
        src="/top-right-foliage.PNG"
        alt=""
        width={400}
        height={150}
        className="absolute right-0 top-0 z-0 hidden h-auto w-48 object-contain md:block md:w-64 lg:w-80"
        priority
      />
      <Image
        src="/bottom-right-foliage.PNG"
        alt=""
        width={400}
        height={150}
        className="absolute bottom-0 right-0 z-0 hidden h-auto w-48 object-contain md:block md:w-64 lg:w-80"
        priority
      />
      <Image
        src="/bottom-left-foliage.PNG"
        alt=""
        width={400}
        height={150}
        className="absolute bottom-0 left-0 z-0 hidden h-auto w-48 object-contain md:block md:w-64 lg:w-80"
        priority
      />
      <Image
        src="/icon256-sun.png"
        alt="idealite logo"
        width={84}
        height={84}
        className="absolute right-[25%] top-[5%] z-0 h-auto -rotate-12 object-contain"
        priority
      />
      {/* Mobile Images */}
      <Image
        src="/top-left-foliage.PNG"
        alt=""
        width={400}
        height={150}
        className="absolute left-0 top-0 z-0 block h-auto w-48 object-contain md:hidden md:w-64 lg:w-80"
        priority
      />
      <Image
        src="/top-right-foliage.PNG"
        alt=""
        width={400}
        height={150}
        className="absolute right-0 top-0 z-0 block h-auto w-48 object-contain md:hidden md:w-64 lg:w-80"
        priority
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <LandingNavbar />

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
            The Digital Method of Loci
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
            A technique once used by ancient scholars to memorize speeches and
            texts, now reimagined for the digital age.
          </p>

          <div className="mb-12 mt-8 flex flex-col items-center gap-4">
            <WaitlistButton
              variant="test"
              className="inline-flex transform items-center rounded-md bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Join the Waitlist
              <span className="ml-2">→</span>
            </WaitlistButton>

            <SignedIn>
              <Link
                href="/workspace"
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                Already approved? Continue to workspace →
              </Link>
            </SignedIn>
          </div>
        </div>
      </div>
      {/* Desktop/Tablet Image */}
      <div className="pointer-events-none absolute inset-x-4 hidden justify-center md:flex lg:inset-x-0">
        <Image
          src="/landing-visual-mnemonic.png"
          alt="App interface on desktop"
          width={1200}
          height={700}
          className="object-contain"
          priority
        />
      </div>
      {/* Mobile Image */}
      <div className="pointer-events-none absolute inset-x-4 flex justify-center md:hidden">
        <Image
          src="/visual-mnemonic.png"
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
