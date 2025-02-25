import React from "react";
import { Button } from "~/components/ui/button";
import Link from "next/link";

export default function TwoTruths() {
  return (
    <div className="h-[100dvh] w-full bg-[#61C0FF]">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-6">
          <h1 className="text-2xl font-bold text-white">
            Two Truths and a Lie
          </h1>
          <h2 className="text-lg font-bold text-white">
            Guess which statement is the lie!
          </h2>
          <img
            src="/games/two-truths.png"
            alt="Two Truths and a Lie"
            className="h-48 w-48 object-contain"
            width={192}
            height={192}
          />
          <div className="flex w-48 flex-col gap-4">
            <Button variant="secondary" className="w-full" asChild>
              <Link href="/play/two-truths/host">Host a Game</Link>
            </Button>
            <Button variant="secondary" className="w-full">
              <Link href="/play/two-truths/games">Your Games</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
