"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { MobileTagAccordion } from "./MobileTagAccordion";
import { addUserTag } from "~/server/actions/usersTags";
import { createTagTree, type SelectTag } from "./tagUtils";

// Palette colors from flowUtils - used for top-level categories
const PALETTE = [
  "#FAAC7D",
  "#FAC552",
  "#FAAF53",
  "#FA7452",
  "#EBD050",
  "#EB7450",
  "#EAAA50",
  "#EBBD50",
  "#EB8F50",
  "#EBCB9E",
  "#EB6554",
  "#EB9954",
  "#EB7F55",
  "#EBB154",
  "#EB6A2F",
];

const sendHapticFeedback = (type: "impact" | "selection") => {
  if (typeof window !== "undefined" && (window as any).ReactNativeWebView) {
    (window as any).ReactNativeWebView.postMessage(
      JSON.stringify({
        type: type === "impact" ? "HAPTIC_IMPACT" : "HAPTIC_SELECTION",
      }),
    );
  }
};

interface MobileGlobalTagsListProps {
  tag: SelectTag[];
  userTags: SelectTag[];
}

export function MobileGlobalTagsList({
  tag,
  userTags,
}: MobileGlobalTagsListProps) {
  const tagTree = useMemo(() => createTagTree(tag, userTags), [tag, userTags]);

  // Get the children of the root node (the main categories)
  const mainCategories = useMemo(() => {
    if (tagTree.length === 1 && tagTree[0].children) {
      return tagTree[0].children;
    }
    return tagTree;
  }, [tagTree]);

  const handleAddTag = async (tagId: string, tagName: string) => {
    sendHapticFeedback("impact");

    try {
      const result = await addUserTag(tagId);

      if (result.success) {
        toast.success(`Added "${tagName}"`);

        // Dispatch event for mobile WebView handling
        if (typeof window !== "undefined") {
          const eventDetail = {
            tagId,
            tagName,
            type: "TAG_ADDED_SUCCESS",
          };

          window.dispatchEvent(
            new CustomEvent("tag-added", { detail: eventDetail }),
          );

          if ((window as any).ReactNativeWebView) {
            (window as any).ReactNativeWebView.postMessage(
              JSON.stringify(eventDetail),
            );
          }
        }
      } else {
        throw new Error(result.error || "Failed to add tag");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add tag");

      if (typeof window !== "undefined" && (window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(
          JSON.stringify({
            type: "TAG_ADD_ERROR",
            error: "Failed to add tag",
          }),
        );
      }
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-slate-950/50">
      <div className="px-2 py-4">
        <div className="mb-4 px-2">
          <p className="text-xs text-muted-foreground">
            Press and hold a tag to add it to your collection
          </p>
        </div>
        <div className="overflow-hidden rounded-lg shadow-sm">
          {mainCategories.map((category, index) => (
            <MobileTagAccordion
              key={category.id}
              node={category}
              level={0}
              parentColor={category.color || PALETTE[index % PALETTE.length]}
              onAddTag={handleAddTag}
            />
          ))}
        </div>
      </div>

      <style jsx global>{`
        .touch-action-none {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
}
