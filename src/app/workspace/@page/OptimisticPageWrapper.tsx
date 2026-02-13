"use client";

import { useState, useEffect } from "react";
import { createPage } from "~/server/actions/page";

interface OptimisticPageWrapperProps {
  isOptimistic?: boolean;
  tempId?: string;
  tempType?: "page" | "canvas";
  children: React.ReactNode;
}

export function OptimisticPageWrapper({
  isOptimistic = false,
  tempId,
  tempType = "page",
  children,
}: OptimisticPageWrapperProps) {
  const [realPageId, setRealPageId] = useState<string | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);

  useEffect(() => {
    if (isOptimistic && tempId && !isCreatingPage && !realPageId) {
      setIsCreatingPage(true);
      createRealPageInBackground(tempId, tempType);
    }
  }, [isOptimistic, tempId, isCreatingPage, realPageId, tempType]);

  const createRealPageInBackground = async (tempId: string, type: "page" | "canvas") => {
    try {
      const result = await createPage(
        {
          title: "Untitled",
        },
        type,
      );

      if (result.success && "data" in result && result.data) {
        const realId = result.data.id;

        // Update URL seamlessly
        const newUrl = `/workspace?pageId=${realId}`;
        window.history.replaceState({}, "", newUrl);

        // Set the real page ID
        setRealPageId(realId);
      }
    } catch (error) {
      console.error("Failed to create page:", error);
    } finally {
      setIsCreatingPage(false);
    }
  };

  return <>{children}</>;
}
