import { auth } from "~/app/auth";
import { getTabs } from "~/server/queries/tabs";
import { TabBarWrapper } from "./TabBarWrapper";
import { headers } from "next/headers";

export default async function TabsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userTabs = userId ? await getTabs(userId).then((res) => res.data) : [];
  const headersList = headers();
  const userAgent = headersList.get("user-agent");

  const isMobile = userAgent?.toLowerCase().includes("mobile");
  const isWarpcast = userAgent?.toLowerCase().includes("warpcast");
  const activeTabId = userTabs?.find((tab) => tab.is_active)?.id ?? null;

  if (isMobile || isWarpcast) {
    return null;
  }

  return (
    <TabBarWrapper tabs={userTabs ?? []} activeTabId={activeTabId ?? null} />
  );
}
