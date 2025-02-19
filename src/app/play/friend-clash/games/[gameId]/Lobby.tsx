import { Play, Trash } from "lucide-react";
import { X, User } from "lucide-react";
import { Avatar } from "~/components/ui/avatar";
import { AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { GameSession } from "~/server/db/schema";
import { removePlayerFromGame, endGame } from "~/server/actions/gameSession";

export default function Lobby({
  gameSession,
  isHost,
  currentUsername,
}: {
  gameSession: GameSession;
  isHost: boolean;
  currentUsername: string;
}) {
  const removePlayer = async (playerId: string, gameId: string) => {
    await removePlayerFromGame({ gameId, username: playerId });
  };

  const startGame = async (gameId: string) => {
    await startGame(gameId);
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center rounded-lg bg-background p-6 shadow-xl">
      <div className="flex flex-col items-center justify-center rounded-lg border border-primary bg-background p-6 shadow-xl">
        <h1 className="mb-12 text-center text-3xl font-bold text-primary">
          Friend Clash Lobby
        </h1>
        {gameSession && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-6">
              {gameSession.player_info.map((player) => (
                <div
                  key={player.user_id}
                  className="relative flex flex-col items-center space-x-4 rounded-lg bg-accent p-4"
                >
                  {isHost && player.username !== currentUsername && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 text-white hover:bg-white/10 hover:text-destructive"
                      onClick={() => {
                        removePlayer(player.username, gameSession.id);
                      }}
                      title="Remove Player"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Avatar className="h-20 w-20 border-4 border-primary">
                    <AvatarImage
                      src={player.avatar_url || ""}
                      alt={player.display_name || ""}
                    />
                    <AvatarFallback>
                      <User className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center justify-center space-x-2 pt-2">
                    {player.pfp_url && (
                      <img
                        src={player.pfp_url}
                        alt={`${player.display_name}'s profile picture`}
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <p className="text-lg text-muted-foreground">
                      @{player.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4 text-center text-foreground">
              {isHost && (
                <div className="flex flex-row gap-4">
                  <Button
                    size="lg"
                    className="inline-flex w-32 items-center rounded bg-primary px-4 py-2 font-bold text-primary-foreground hover:bg-primary/90"
                    onClick={() => startGame(gameSession.id)}
                  >
                    <Play className="mr-2" />
                    Start Game
                  </Button>
                  <Button
                    size="lg"
                    className="inline-flex w-32 items-center rounded bg-destructive px-4 py-2 font-bold text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => endGame(gameSession.id)}
                  >
                    <Trash className="mr-2" />
                    Cancel Game
                  </Button>
                </div>
              )}
              {!isHost && (
                <p className="text-sm text-muted-foreground">
                  Game has not started yet.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
