import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const alt = "idealite flashcards game";
export const size = {
  width: 600,
  height: 600,
};

export const contentType = "image/png";
export const revalidate = 300;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        tw="h-full w-full flex flex-col justify-center items-center relative"
        style={{
          backgroundImage:
            "url(https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreigpuni3hgi67dyeqfonib6drtej7ehmnbj2d7hu4anacvnpan5kry)",
          backgroundSize: "600px 600px",
          backgroundPosition: "100% 100%",
        }}
      ></div>
    ),
    {
      ...size,
    },
  );
}
