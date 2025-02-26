import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const alt = "idealite two truths game";
export const size = {
  width: 600,
  height: 400,
};

export const contentType = "image/png";
export const revalidate = 300;

export default async function Image() {
  //To style this image, go to the route /play/spin-wheel/opengraph-image
  return new ImageResponse(
    (
      <div
        tw="h-full w-full flex flex-col justify-center items-center relative"
        style={{
          backgroundImage:
            "url(https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreiaj7usci5vq7clyjma6sebgxbsgiilid5jrlk4hvslmvmo4v3elkm)",
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
