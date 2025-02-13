import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const alt = "idealite flashcards game";
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
          backgroundImage: "url(/games/questions-and-answers.png)",
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
