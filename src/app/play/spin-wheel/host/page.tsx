import { headers } from "next/headers";
import WarpcastLogin from "~/app/WarpcastLogin";
import InvitePage from "./InvitePage";
import { currentUser } from "@clerk/nextjs/server";

export default async function Host() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent");
  const isMobile = userAgent?.toLowerCase().includes("mobile");
  const isWarpcast = userAgent?.toLowerCase().includes("warpcast");
  const user = await currentUser();
  const userId = user?.externalId;

  if (!userId && !isMobile) {
    // Desktop
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        Login!
      </div>
    );
  }

  if (!userId && isWarpcast) {
    return <WarpcastLogin />;
  }

  return (
    <div className="h-[100dvh] w-full bg-[#33A33C]">
      <InvitePage isMobile={isMobile ?? false} />
    </div>
  );
}
