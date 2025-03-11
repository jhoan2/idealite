"use client";

import { sdk } from "@farcaster/frame-sdk";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Users, User, WalletCardsIcon as Cards, Info } from "lucide-react";
import FarcasterSignIn from "./FarcasterSignIn";

export default function Games({ isWarpcast }: { isWarpcast: boolean }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const items = [
    {
      id: "1",
      title: "Q and A",
      description: "Test your knowledge with flashcard questions and answers",
      icon: "/games/question-and-answer.png",
      href: "/play/flashcards",
      usesCards: true,
      isMultiplayer: false,
    },
    {
      id: "2",
      title: "Fill in the Blank",
      description: "Complete sentences by filling in missing words",
      icon: "/games/fill-in-the-blank.png",
      href: "/play/cloze",
      usesCards: true,
      isMultiplayer: false,
    },
    {
      id: "3",
      title: "Friend Clash",
      description: "Challenge your friends to knowledge battles",
      icon: "/games/friend-clash.png",
      href: "/play/friend-clash",
      usesCards: false,
      isMultiplayer: true,
    },
    {
      id: "4",
      title: "Spin the Wheel",
      description: "Spin to win prizes and points",
      icon: "/games/spin-the-wheel.png",
      href: "/play/spin-wheel",
      usesCards: false,
      isMultiplayer: true,
    },
    // Commented games can be uncommented and enhanced with metadata when needed
    // {
    //   id: "5",
    //   title: "Guess the Picture",
    //   description: "Identify concepts from images",
    //   icon: "/games/guess-the-picture.png",
    //   href: "/play/guess-the-picture",
    //   usesCards: true,
    //   isMultiplayer: false,
    // },
    // {
    //   id: "6",
    //   title: "Memory Mansion",
    //   description: "Test your memory by matching pairs",
    //   icon: "/games/memory-mansion.png",
    //   href: "/play/memory-mansion",
    //   usesCards: false,
    //   isMultiplayer: false,
    // },
    // {
    //   id: "7",
    //   title: "Two Truths and a Lie",
    //   description: "Identify which statement is false",
    //   icon: "/games/two-truths.png",
    //   href: "/play/two-truths",
    //   usesCards: true,
    //   isMultiplayer: true,
    // },
  ];

  useEffect(() => {
    const load = async () => {
      const frameContext = await sdk.context;
      sdk.actions.ready();
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  if (isWarpcast) {
    return <FarcasterSignIn />;
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <Link key={item.id} href={item.href} className="group flex flex-col">
            <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-md">
              <div className="relative">
                <CardContent className="h-28 overflow-hidden p-0 sm:h-48">
                  <img
                    src={item.icon || "/placeholder.svg"}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </CardContent>
              </div>

              <CardFooter className="flex flex-col items-start gap-1 p-2 sm:p-4">
                <h3 className="text-base font-semibold sm:text-lg">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {item.description}
                </p>
                <div className="mt-1 flex w-full flex-col space-y-1 sm:mt-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div className="flex items-center gap-2">
                    {item.isMultiplayer && (
                      <span className="flex items-center text-[10px] text-muted-foreground sm:text-xs">
                        <Users className="mr-1 h-3 w-3" /> Multiplayer
                      </span>
                    )}
                    {!item.isMultiplayer && (
                      <span className="flex items-center text-[10px] text-muted-foreground sm:text-xs">
                        <User className="mr-1 h-3 w-3" /> Single Player
                      </span>
                    )}
                  </div>
                  <div>
                    {item.usesCards ? (
                      <span className="flex items-center text-[10px] text-muted-foreground sm:text-xs">
                        <Cards className="mr-1 h-3 w-3" /> Uses your cards
                      </span>
                    ) : (
                      <span className="flex items-center text-[10px] text-muted-foreground sm:text-xs">
                        <Info className="mr-1 h-3 w-3" /> No cards needed
                      </span>
                    )}
                  </div>
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
