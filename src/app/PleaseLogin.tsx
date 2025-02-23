import { headers } from "next/headers";
import WarpcastReady from "./WarpcastReady";

export default function PleaseLogin() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent");
  const isWarpcast = userAgent?.toLowerCase().includes("warpcast");
  if (isWarpcast) return <WarpcastReady />;
  return (
    <div className="text-center">
      <main className="flex flex-col items-center px-6 pt-12">
        <div className="relative mb-8 flex aspect-square w-full max-w-md items-center justify-center">
          <img
            src="/icon256.png"
            alt="Mathematical rocket illustration"
            className="h-64 w-64 object-contain"
          />
        </div>

        <div className="mb-8 space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Please login
          </h1>
        </div>
      </main>
    </div>
  );
}
