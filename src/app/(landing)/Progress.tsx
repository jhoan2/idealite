import Image from "next/image";

export default function Progress() {
  return (
    <section className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 py-16 text-gray-900 sm:py-20 md:p-24">
      <div className="container relative mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div className="flex justify-center">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl">
              <Image
                src="/auto-flashcards.png"
                alt="Learning Progress Dashboard"
                width={600}
                height={400}
                className="h-auto w-full object-contain"
                priority
              />
            </div>
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Instantly transformed into flashcards
            </h1>
            <p className="text-lg text-gray-700 md:text-xl">
              Visual mnemonics turn into flashcards the moment you create them.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
