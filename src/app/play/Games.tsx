"use client";

import { sdk } from "@farcaster/frame-sdk";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import PlayTopNav from "./PlayTopNav";

export default function Games({
  userPlayStats,
}: {
  userPlayStats: { points: number; cash: number };
}) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const items = [
    {
      id: "1",
      title: "Q and A",
      icon: "/games/question-and-answer.png",
      href: "/play/flashcards",
    },
    {
      id: "2",
      title: "Fill in the Blank",
      icon: "/games/fill-in-the-blank.png",
      href: "/play/cloze",
    },
    // {
    //   id: "3",
    //   title: "Friend Clash",
    //   icon: "/games/friend-clash.png",
    //   href: "/play/friend-clash",
    // },
    // {
    //   id: "4",
    //   title: "Spin the Wheel",
    //   icon: "/games/spin-the-wheel.png",
    //   href: "/play/spin-the-wheel",
    // },
    // {
    //   id: "5",
    //   title: "Target Practice",
    //   icon: "/games/target.png",
    //   href: "/play/target-practice",
    // },
    // {
    //   id: "6",
    //   title: "Guess the Picture",
    //   icon: "/games/guess-the-picture.png",
    //   href: "/play/guess-the-picture",
    // },
    // {
    //   id: "7",
    //   title: "Memory Mansion",
    //   icon: "/games/memory-mansion.png",
    //   href: "/play/memory-mansion",
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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Play</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-semibold">
            <img
              src="/points/Premium 2nd Outline 64px.png"
              alt="points"
              className="h-8 w-8"
            />
            <span>{userPlayStats.points} </span>
          </div>

          <div className="flex items-center gap-2 font-semibold">
            <img
              src="/cash/Blue Cash 1st Outline 64px.png"
              alt="cash"
              className="h-8 w-8"
            />
            <span>{userPlayStats.cash}</span>
          </div>
        </div>
      </div>
      {/* <PlayTopNav /> */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex flex-col items-center"
          >
            <Card className="rounded-md transition-transform hover:scale-105">
              <CardContent className="h-24 w-24 overflow-hidden rounded-md p-0">
                <img
                  src={item.icon}
                  alt={item.title}
                  className="h-full w-full object-fill"
                />
              </CardContent>
            </Card>
            <span className="mt-2 text-center text-sm">{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
