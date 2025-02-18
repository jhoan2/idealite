import { ImageResponse } from "next/og";
import { getGameSessionData } from "~/server/queries/gameSession";

export const dynamic = "force-dynamic";
export const alt = "idealite flashcards game";
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
  const result = await getGameSessionData(params.gameId);
  const players = result.success ? result.data?.players : [];
  const leftPlayers = players?.slice(0, 2);
  const rightPlayers = players?.slice(2, 4);
  return new ImageResponse(
    (
      <div
        tw="h-full w-full flex flex-col justify-center items-center relative"
        style={{
          backgroundImage:
            "url(https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreifizuhweqax3oaegwmrh2zh7ir6kx52ngw6wnp25d33ynqpto5riq)",
          backgroundSize: "600px 400px",
          backgroundPosition: "100% 100%",
        }}
      >
        <div tw="flex flex-row justify-between items-center w-full">
          {/* Left side names */}
          <div tw="flex flex-col items-end mr-24">
            {leftPlayers?.map((player: string, index: number) => (
              <p
                key={index}
                tw="text-4xl text-black font-bold mb-2  px-4 py-1 rounded"
              >
                {player}
              </p>
            ))}
          </div>

          {/* Right side names */}
          <div tw="flex flex-col items-start ml-12">
            {rightPlayers?.map((player: string, index: number) => (
              <p
                key={index}
                tw="text-4xl text-black font-bold mb-2  px-4 py-1 rounded"
              >
                {player}
              </p>
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
