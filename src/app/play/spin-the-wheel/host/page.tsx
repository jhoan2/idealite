import { headers } from "next/headers";
import { auth } from "~/app/auth";
import WarpcastLogin from "~/app/WarpcastLogin";
import InvitePage from "./InvitePage";

export default async function Host() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent");
  const isMobile = userAgent?.toLowerCase().includes("mobile");
  const isWarpcast = userAgent?.toLowerCase().includes("warpcast");
  const session = await auth();

  if (!session?.user?.id && !isMobile) {
    // Desktop
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        Login!
      </div>
    );
  }

  if (!session?.user?.id && isWarpcast) {
    return <WarpcastLogin />;
  }

  return (
    <div className="h-[100dvh] w-full bg-[#33A33C]">
      <InvitePage isMobile={isMobile ?? false} />
    </div>
  );
}
