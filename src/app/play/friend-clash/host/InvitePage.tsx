"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { SearchUserAvatar } from "./SearchUserAvatar";

export default function InvitePage({ isMobile }: { isMobile: boolean }) {
  const [invitees, setInvitees] = useState<string[]>([]);
  const avatarCount = 4;

  const handleSelect = (friend: string) => {
    // Prevent duplicate selections
    if (!invitees.includes(friend)) {
      setInvitees((prev) => [...prev, friend]);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-white">Whitelist your friends</h1>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: avatarCount }).map((_, index) => (
          <SearchUserAvatar
            key={index}
            isMobile={isMobile}
            onSelect={handleSelect}
          />
        ))}
      </div>
      {invitees.length > 0 && <Button variant="secondary">Create game</Button>}
    </div>
  );
}
