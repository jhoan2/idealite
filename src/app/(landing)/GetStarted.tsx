import { Button } from "~/components/ui/button";
import { SignUpButton } from "@clerk/nextjs";

export default function GetStarted() {
  return (
    <section className="flex w-full justify-center py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-b from-yellow-300 via-orange-300 to-blue-200 p-8 shadow-lg md:p-12">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter text-white md:text-4xl">
                Ready to transform your learning?
              </h2>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button>
                <SignUpButton />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
