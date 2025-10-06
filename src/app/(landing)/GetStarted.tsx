import { WaitlistButton } from "~/components/WaitlistButton";

export default function GetStarted() {
  return (
    <section className="flex w-full justify-center py-12 md:p-10 lg:py-32">
      <div className="container relative mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-lg bg-[#03318c] p-8 shadow-lg md:p-12">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tighter text-white md:text-4xl md:text-5xl lg:text-6xl">
                Build your brain, not your notes.
              </h2>
            </div>
            <div className="flex flex-col gap-2 pt-8 min-[400px]:flex-row">
              {/* <span className="cursor-pointer bg-white px-8 py-6 text-lg text-black hover:bg-gray-300">
                <SignUpButton />
              </span> */}
              <WaitlistButton className="inline-flex transform items-center rounded-md bg-white px-8 py-6 text-lg font-semibold text-black shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-xl">
                Join the Waitlist
                <span className="ml-2">→</span>
              </WaitlistButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
