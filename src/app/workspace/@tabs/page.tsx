import { auth } from "~/app/auth";
import { getTabs } from "~/server/queries/tabs";
import { TabBarWrapper } from "./TabBarWrapper";

export default async function TabsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const userTabs = userId ? await getTabs(userId).then((res) => res.data) : [];

  const activeTabId = userTabs?.find((tab) => tab.is_active)?.id ?? null;
  return (
    <TabBarWrapper tabs={userTabs ?? []} activeTabId={activeTabId ?? null} />
  );
}
