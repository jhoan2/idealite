import { User } from "lucide-react";
import { GameSessionWithMoves } from "~/server/queries/gameSession";

export default function ClashCompleted({
  gameSession,
}: {
  gameSession: GameSessionWithMoves;
}) {
  const players = gameSession.player_info.map((player) => {
    const score = gameSession.moves
      .filter((move) => move.player_username === player.username)
      .reduce((total, move) => total + move.points, 0);

    return {
      name: player.username,
      score,
      avatar: player.avatar_url || player.pfp_url,
    };
  });
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const losers = sortedPlayers.slice(1);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#CC412F] p-4 text-white">
      <div className="mb-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-75 blur"></div>
            <div className="relative rounded-full bg-gray-800 p-4">
              {winner?.avatar ? (
                <img
                  src={winner.avatar}
                  alt={winner.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Game Over!
        </h1>
        <p className="text-xl text-gray-400">
          Winner:{" "}
          <span className="text-2xl font-bold text-white">{winner?.name}</span>
        </p>
        <p className="text-xl text-gray-400">
          Score:{" "}
          <span className="text-2xl font-bold text-white">{winner?.score}</span>
        </p>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Other Players</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {losers.map((player, index) => (
            <div key={index} className="text-center">
              <div className="mb-2 flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-gray-600 to-gray-400 opacity-75 blur"></div>
                  <div className="relative rounded-full bg-gray-700 p-3">
                    {player.avatar ? (
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              <p className="font-bold">{player.name}</p>
              <p className="text-gray-400">Score: {player.score}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
