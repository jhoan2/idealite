import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const alt = "idealite channel frame";
export const size = {
  width: 1260,
  height: 660,
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
            "url(https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreifcxtpzwappwtqn4lp2kupefzcqh4szk7kluky4abg6ywaew4chyy)",
          backgroundSize: "cover",
          backgroundPosition: "100% 140%",
        }}
      ></div>
    ),
    {
      ...size,
    },
  );
}
