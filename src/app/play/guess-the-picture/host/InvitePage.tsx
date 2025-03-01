"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { SearchUserAvatar } from "../../friend-clash/host/SearchUserAvatar";
import { useSession } from "next-auth/react";
import { useNeynarContext } from "@neynar/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { createGameSession } from "~/server/actions/gameSession";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { castParentUrl } from "~/app/constants";

export default function InvitePage({ isMobile }: { isMobile: boolean }) {
  const { data: session } = useSession();
  const { user } = useNeynarContext();
  const [invitees, setInvitees] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const [castText, setCastText] = useState("");
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

  const handleCreateGame = async () => {
    if (!session?.user?.id) return;
    setIsCreating(true);

    try {
      const players = [session.user.username, ...invitees];
      const gameSession = await createGameSession({
        playerCount: players.length,
        players,
        gameType: "guess-picture",
      });

      const formattedInvites = invitees
        .map((invitee) => `@${invitee}`)
        .join(" ");

      setCastText(
        `Hey ${formattedInvites}! You're invited to join my Guess the Picture game! 🎮\n\n` +
          `idealite.xyz/play/guess-the-picture/games/${gameSession?.id}`,
      );
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Failed to create game session");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendCast = async () => {
    if (!user?.signer_uuid) {
      toast.error("Please sign in to cast");
      return;
    }

    setIsCasting(true);
    try {
      const response = await fetch("/api/channelFeed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signer_uuid: user.signer_uuid,
          text: castText,
          embeds: [],
          parent: castParentUrl,
          parent_author_fid: user.fid,
          channel_id: "idealite",
          idem: uuidv4(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create cast");
      }

      toast.success("Game invitation cast sent!");
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to send cast");
    } finally {
      setIsCasting(false);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-white">Invite your friends</h1>
      <div className="grid grid-cols-2 gap-4">
        {/* Host Avatar */}
        <div className="relative">
          <Avatar className="h-24 w-24 cursor-not-allowed bg-white/30">
            <AvatarImage src={session?.user?.pfp_url ?? ""} />
            <AvatarFallback>
              {session?.user?.display_name?.charAt(0) ?? "Host"}
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
      {invitees.length > 0 && (
        <Button
          variant="secondary"
          onClick={handleCreateGame}
          disabled={isCreating}
          className="mt-4"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create game"
          )}
        </Button>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Game Session</DialogTitle>
            <DialogDescription>
              Share your game session with your friends!
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Cast Message
              </label>
              <Textarea
                value={castText}
                onChange={(e) => setCastText(e.target.value)}
                className="h-32"
                placeholder="Write your game invitation message..."
              />
            </div>

            <Button
              onClick={handleSendCast}
              disabled={isCasting}
              className="w-full"
            >
              {isCasting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Cast...
                </>
              ) : (
                "Send Cast"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
