import Flashcards from "./Flashcards";
export default function Remember() {
  return (
    <section className="w-full bg-black py-12 text-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Remember everything that matters
            </h1>
            <p className="text-lg text-gray-300 md:text-xl">
              Turn your important facts into knowledge that sticks. Easily
              create flashcards to help you remember everything that matters.
            </p>
          </div>
          <div className="flex justify-center">
            <Flashcards />
          </div>
        </div>
      </div>
    </section>
  );
}
