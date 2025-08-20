// src/app/home/@totalcardsprogress/page.tsx
import { getTagHierarchyForUserExcludingRoot } from "~/server/queries/dashboard";
import HierarchicalTopicBrowser from "./TopicBrowser";

export default async function TotalCards() {
  const tagTree = await getTagHierarchyForUserExcludingRoot();

  return <HierarchicalTopicBrowser tagTree={tagTree} />;
}
