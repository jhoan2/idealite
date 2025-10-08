// src/app/SideBarWrapper.tsx (New Server Component)
import React from "react";
import { getUserPinnedPages } from "~/server/queries/pinnedPages";
import SideBarClient from "./SideBarClient";
import { currentUser } from "@clerk/nextjs/server";

export default async function SideBarWrapper() {
  const user = await currentUser();

  if (!user?.externalId) {
    return <SideBarClient initialPinnedPages={[]} />;
  }

  const initialPinnedPages = await getUserPinnedPages();
  return <SideBarClient initialPinnedPages={initialPinnedPages} />;
}
