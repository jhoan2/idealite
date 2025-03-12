"use client";

import { useState } from "react";
import { Loader2, FileCheck } from "lucide-react";
import HeadingEditor from "./HeadingEditor";
import BodyEditor from "./(BodyEditor)/BodyEditor";
import { useSearchParams } from "next/navigation";
import { TreeTag } from "~/server/queries/usersTags";
import { Tag } from "~/server/db/schema";
import { PageTour } from "./PageTour";
import { MobilePageTour } from "./MobilePageTour";

export default function PageEditors({
  title,
  content,
  userTagTree,
  tags,
  isMobile,
}: {
  title: string;
  content: {
    content: string;
    content_type: "page" | "canvas";
  };
  userTagTree: TreeTag[];
  tags: Tag[];
  isMobile: boolean;
}) {
  const searchParams = useSearchParams();
  const pageId = searchParams.get("pageId") as string;
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);

  const isSaving = isSavingTitle || isSavingContent;

  return (
    <>
      {isMobile ? (
        <MobilePageTour>
          <div className="relative">
            <HeadingEditor
              initialTitle={title}
              pageId={pageId}
              onSavingStateChange={setIsSavingTitle}
              userTagTree={userTagTree}
            />
            <BodyEditor
              content={content.content}
              pageId={pageId}
              onSavingStateChange={setIsSavingContent}
              tags={tags}
            />

            {/* Floating Status Indicator */}
            <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 rounded-lg border bg-background p-2 shadow-lg">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {isSavingTitle && isSavingContent
                      ? "Saving all changes..."
                      : isSavingTitle
                        ? "Saving title..."
                        : "Saving content..."}
                  </span>
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </div>
          </div>
        </MobilePageTour>
      ) : (
        <PageTour>
          <div className="relative">
            <HeadingEditor
              initialTitle={title}
              pageId={pageId}
              onSavingStateChange={setIsSavingTitle}
              userTagTree={userTagTree}
            />
            <BodyEditor
              content={content.content}
              pageId={pageId}
              onSavingStateChange={setIsSavingContent}
              tags={tags}
            />

            {/* Floating Status Indicator */}
            <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 rounded-lg border bg-background p-2 shadow-lg">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {isSavingTitle && isSavingContent
                      ? "Saving all changes..."
                      : isSavingTitle
                        ? "Saving title..."
                        : "Saving content..."}
                  </span>
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </div>
          </div>
        </PageTour>
      )}
    </>
  );
}
