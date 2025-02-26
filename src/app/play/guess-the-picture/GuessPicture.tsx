import React from "react";
import { Button } from "~/components/ui/button";
import Link from "next/link";

export default function GuessPicture() {
  return (
    <div className="h-[100dvh] w-full bg-[#F28705]">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-6">
          <h1 className="text-2xl font-bold text-white">Guess the Picture</h1>
          <h2 className="text-lg font-bold text-white">
            Guess the picture to win a prize!
          </h2>
          <img
            src="/games/guess-the-picture.png"
            alt="Guess the Picture"
            className="h-48 w-48 object-contain"
            width={192}
            height={192}
          />
          <div className="flex w-48 flex-col gap-4">
            <Button variant="secondary" className="w-full" asChild>
              <Link href="/play/guess-the-picture/host">Host a Game</Link>
            </Button>
            <Button variant="secondary" className="w-full">
              <Link href="/play/guess-the-picture/games">Your Games</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
