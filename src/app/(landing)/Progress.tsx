import Image from "next/image";

export default function Progress() {
  return (
    <section className="w-full bg-black text-white md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Track Your Learning Progress
            </h1>
            <p className="text-lg text-gray-300 md:text-xl">
              Monitor your knowledge retention, identify areas for improvement,
              and celebrate your achievements with our comprehensive progress
              tracking system.
            </p>
          </div>
          <div className="flex justify-center">
            <Image
              src="/mastery-landing.png"
              alt="Learning Progress Dashboard"
              width={400}
              height={266}
              className="rounded-lg shadow-lg"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
