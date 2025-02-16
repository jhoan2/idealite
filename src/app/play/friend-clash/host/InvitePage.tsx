"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { SearchUserAvatar } from "./SearchUserAvatar";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
export default function InvitePage({ isMobile }: { isMobile: boolean }) {
  const { data: session } = useSession();
  const [invitees, setInvitees] = useState<string[]>([]);
  const avatarCount = 4;

  const handleSelect = (friend: string) => {
    // Prevent duplicate selections
    if (!invitees.includes(friend)) {
      setInvitees((prev) => [...prev, friend]);
    }
  };

  const handleRemove = (friend: string) => {
    setInvitees((prev) => prev.filter((f) => f !== friend));
  };

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-white">Whitelist your friends</h1>
      <div className="grid grid-cols-2 gap-4">
        {/* Host Avatar */}
        <div className="relative">
          <Avatar className="h-24 w-24 cursor-not-allowed bg-white/30">
            <AvatarImage src={session?.user?.pfp_url ?? ""} />
            <AvatarFallback>
              {session?.user?.display_name?.charAt(0) ?? "H"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -right-2 -top-2 rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
            Host
          </div>
        </div>

        {/* Invitee Avatars */}
        {Array.from({ length: avatarCount - 1 }).map((_, index) => (
          <SearchUserAvatar
            key={index}
            isMobile={isMobile}
            onSelect={handleSelect}
            onRemove={handleRemove}
          />
        ))}
      </div>
      {invitees.length > 0 && <Button variant="secondary">Create game</Button>}
    </div>
  );
}
