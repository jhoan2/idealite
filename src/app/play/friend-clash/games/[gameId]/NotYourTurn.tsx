import { Button } from "~/components/ui/button";
import Link from "next/link";
export default function NotYourTurn() {
  return (
    <div className="h-[100dvh] w-full bg-[#CC412F]">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-6">
          <h1 className="text-2xl font-bold text-white">Friend Clash</h1>
          <h2 className="text-lg font-bold text-white">It's not your turn!</h2>
          <img
            src="/games/friend-clash.png"
            alt="Friend Clash"
            className="h-48 w-48 object-contain"
            width={192}
            height={192}
          />
          <div className="flex w-48 flex-col gap-4">
            <Button variant="secondary" className="w-full">
              <Link href="/play/friend-clash/games">Your Games</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
