import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const alt = "idealite fill in the blank game";
export const size = {
  width: 800,
  height: 600,
};

export const contentType = "image/png";
export const revalidate = 300;

export default async function Image() {
  //To style this image, go to the route /play/cloze/opengraph-image
  return new ImageResponse(
    (
      <div
        tw="h-full w-full flex flex-col justify-center items-center relative bg-black"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundImage:
              "url(https://purple-defensive-anglerfish-674.mypinata.cloud/ipfs/bafkreihdu6kg342z66ptqpwuem2433qtfcrkchslaf5vfbf5ww27jvm574)",
            backgroundSize: "contain",
            backgroundPosition: "100% 60%",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>
    ),
    {
      ...size,
    },
  );
}
