"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { ScrollBar } from "~/components/ui/scroll-area";
import { Card, CardContent } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";

export default function Games() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const items = [
    {
      id: "1",
      title: "Simple Reviews",
      icon: "/simple-review.svg",
      href: "/play/flashcards",
      categories: ["Flashcards", "Single Player"],
    },
    {
      id: "2",
      title: "Cloze",
      icon: "/simple-review.svg",
      href: "/play/cloze",
      categories: ["Flashcards", "Single Player"],
    },
  ];

  const categories = ["All", "Flashcards", "Single Player", "Multiplayer"];

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter((item) => item.categories.includes(selectedCategory));

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-semibold">Play</h2>
      <div className="mb-6">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-2 p-1">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filteredItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex flex-col items-center"
          >
            <Card className="transition-transform hover:scale-105">
              <CardContent className="flex h-24 w-24 items-center justify-center p-4">
                <img
                  src={item.icon}
                  alt={item.title}
                  className="h-16 w-16 dark:invert"
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
