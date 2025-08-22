// src/app/SideBarWrapper.tsx (New Server Component)
import React from "react";
import { getUserPinnedPages } from "~/server/queries/pinnedPages";
import SideBarClient from "./SideBarClient";

export default async function SideBarWrapper() {
  // Fetch pinned pages on the server
  const initialPinnedPages = await getUserPinnedPages();

  return <SideBarClient initialPinnedPages={initialPinnedPages} />;
}
