// src/app/home/@totalcardsprogress/page.tsx
/*
import { getTagHierarchyForUserExcludingRoot } from "~/server/queries/dashboard";
import HierarchicalTopicBrowser from "./TopicBrowser";
import { headers } from "next/headers";

export default async function TotalCards() {
  const tagTree = await getTagHierarchyForUserExcludingRoot();

  // Add mobile detection
  const headersList = headers();
  const userAgent = headersList.get("user-agent");
  const isMobile = userAgent?.toLowerCase().includes("mobile");

  return (
    <HierarchicalTopicBrowser tagTree={tagTree} isMobile={isMobile ?? false} />
  );
}
*/

export default function TotalCards() {
  return null;
}
