"use client";

import { useRouter } from "next/navigation";
import { TabBar } from "./TabBar";
import { closeTab } from "~/server/actions/tabs";
import { toast } from "sonner";
import { setActiveTab } from "~/server/actions/tabs";

interface Tab {
  id: string;
  title: string;
  path: string;
}

interface TabBarWrapperProps {
  tabs: Tab[];
  activeTabId: string | null;
}

export function TabBarWrapper({ tabs, activeTabId }: TabBarWrapperProps) {
  const router = useRouter();

  const handleTabClick = async (tab: Tab) => {
    await setActiveTab(tab.id);
    router.push(`/workspace/${tab.path}?tabId=${tab.id}`);
  };

  const handleTabClose = async (tabId: string) => {
    try {
      await closeTab(tabId);

      // Handle navigation after closing
      if (tabs.length === 1) {
        // If this is the last tab, redirect to workspace
        router.push("/workspace");
      } else if (tabId === activeTabId) {
        // If closing active tab, switch to another tab
        const remainingTabs = tabs.filter((t) => t.id !== tabId);
        const nextTab = remainingTabs[0];
        if (nextTab) {
          router.push(`/workspace/${nextTab.path}`);
        }
      }

      router.refresh(); // Refresh the page to update tab state
    } catch (error) {
      console.error("Error closing tab:", error);
      toast.error("Failed to close tab");
    }
  };

  return (
    <TabBar
      tabs={tabs}
      activeTabId={activeTabId ?? null}
      onTabClick={handleTabClick}
      onTabClose={handleTabClose}
    />
  );
}
