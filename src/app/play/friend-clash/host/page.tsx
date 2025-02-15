import { headers } from "next/headers";
import InvitePage from "./InvitePage";

export default function Host() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent");
  const isMobile = userAgent?.toLowerCase().includes("mobile");

  return (
    <div className="h-[100dvh] w-full bg-[#CC412F]">
      <InvitePage isMobile={isMobile ?? false} />
    </div>
  );
}
