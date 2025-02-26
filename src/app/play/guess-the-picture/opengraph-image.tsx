import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const alt = "idealite guess the picture game";
export const size = {
  width: 600,
  height: 400,
};

export const contentType = "image/png";
export const revalidate = 300;

export default async function Image() {
  //To style this image, go to the route /play/guess-the-picture/opengraph-image
  return new ImageResponse(
    (
      <div
        tw="h-full w-full flex flex-col justify-center items-center relative"
        style={{
          backgroundImage:
            "url(https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreibjhkbro6gyvfspnr2ivtvpj6szcmqf3g7u5w67llr3zfl5stcu4q)",
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
