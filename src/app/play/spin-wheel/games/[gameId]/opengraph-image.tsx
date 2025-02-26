import { ImageResponse } from "next/og";
import {
  getGamePlayerInfo,
  type GamePlayer,
} from "~/server/queries/gameSession";
export const dynamic = "force-dynamic";
export const alt = "idealite spin the wheel game";
export const size = {
  width: 600,
  height: 400,
};

export const contentType = "image/png";
export const revalidate = 300;

export default async function Image({
  params,
}: {
  params: { gameId: string };
}) {
  //To style this image, go to the route /play/friend-clash/opengraph-image
  const result = await getGamePlayerInfo(params.gameId);
  const players = result.success ? result.data : [];
  const leftPlayers = players?.slice(0, 2);
  const rightPlayers = players?.slice(2, 4);
  return new ImageResponse(
    (
      <div
        tw="h-full w-full flex flex-col justify-center items-center relative"
        style={{
          backgroundImage:
            "url(https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreibjhkbro6gyvfspnr2ivtvpj6szcmqf3g7u5w67llr3zfl5stcu4q)",
          backgroundSize: "600px 400px",
          backgroundPosition: "100% 100%",
        }}
      >
        <div tw="flex flex-row justify-between items-center w-full px-4">
          {/* Left side names */}
          <div tw="flex flex-col items-start w-1/2">
            {leftPlayers?.map((player: GamePlayer, index: number) => (
              <div key={index} tw="flex flex-row items-center mb-4">
                <img
                  src={player.pfp_url || "/placeholder.svg?height=40&width=40"}
                  tw="w-10 h-10 rounded-full mr-2"
                  alt={player.username}
                />
                <p tw="text-xl text-black font-bold truncate max-w-[180px]">
                  {player.username}
                </p>
              </div>
            ))}
          </div>

          {/* Right side names */}
          <div tw="flex flex-col items-end w-1/2">
            {rightPlayers?.map((player: GamePlayer, index: number) => (
              <div key={index} tw="flex flex-row-reverse items-center mb-4">
                <img
                  src={player.pfp_url || "/placeholder.svg?height=40&width=40"}
                  tw="w-10 h-10 rounded-full ml-2"
                  alt={player.username}
                />
                <p tw="text-xl text-black font-bold truncate max-w-[180px]">
                  {player.username}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
