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
            "url(https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreifwxkjn2ckhokmew27s6vwiiar2pfkwivbz4x5nhevo27nznrq454)",
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
