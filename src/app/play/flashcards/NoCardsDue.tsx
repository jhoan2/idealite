import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function NoCardsDue() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="space-y-8 text-center duration-500 animate-in fade-in zoom-in">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white delay-200 duration-700 animate-in fade-in slide-in-from-bottom-4">
            No Cards Due
          </h1>
          <div className="space-y-2 delay-300 duration-700 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-slate-400">
              You&apos;ve completed all your cards for now!
            </p>
            <p className="text-slate-400">
              Come back later when more cards are due for review.
            </p>
          </div>
        </div>

        <div className="space-y-3 delay-500 duration-700 animate-in fade-in slide-in-from-bottom-4">
          <Link href="/play">
            <Button
              variant="secondary"
              size="lg"
              className="h-12 w-full min-w-[200px] text-lg transition-all hover:scale-105"
            >
              Back to Play
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
