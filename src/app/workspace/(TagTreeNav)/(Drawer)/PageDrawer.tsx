"use client";

import { useState } from "react";
import { Replace, Trash, File } from "lucide-react";
import { Button } from "~/components/ui/button";
import { DrawerTitle } from "~/components/ui/drawer";
import { DrawerHeader } from "~/components/ui/drawer";
import { TreePage, TreeTag } from "~/server/queries/usersTags";
import { deletePage } from "~/server/actions/page";
import { toast } from "sonner";
import { MoveToDialog } from "../MoveToDialog";
import { movePage } from "~/server/actions/page";

interface PageDrawerProps {
  page: TreePage;
  onOpenChange: (open: boolean) => void;
  allTags: TreeTag[];
  currentTagId: string;
}

export default function PageDrawer({
  page,
  onOpenChange,
  allTags,
  currentTagId,
}: PageDrawerProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const handleDeletePage = async () => {
    try {
      setIsDeleting(true);
      const result = await deletePage({ id: page.id });

      if (!result.success) {
        throw new Error(result.error || "Failed to delete page");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting page:", error);
      toast.error("Failed to delete page");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMovePage = async (destinationId: string) => {
    setIsMoving(true);
    try {
      const result = await movePage({
        pageId: page.id,
        destinationId: destinationId,
      });

      if (!result.success) {
        throw new Error(
          "error" in result ? String(result.error) : "Failed to move page",
        );
      }

      setShowMoveDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error moving page:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to move page";
      toast.error(errorMessage);
    } finally {
      setIsMoving(false);
    }
  };
  return (
    <>
      <MoveToDialog
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        tags={allTags}
        currentTagId={currentTagId}
        currentFolderId={page.folder_id}
        primaryTagId={page.primary_tag_id}
        onMove={handleMovePage}
        isLoading={isMoving}
      />
      <div className="p-4">
        <DrawerHeader>
          <DrawerTitle className="flex items-center">
            <File className="mr-2 h-4 w-4" />
            {page.title}
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col space-y-2">
          <div className="h-px bg-border" />
          <Button
            variant="ghost"
            className="w-full justify-start py-6 text-sm font-normal"
            onClick={() => setShowMoveDialog(true)}
          >
            <Replace className="mr-3 h-4 w-4" />
            <span>Move to</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start py-6 text-sm font-normal text-destructive"
            onClick={handleDeletePage}
            disabled={isDeleting}
          >
            <Trash className="mr-3 h-4 w-4" />
            <span>Delete Page</span>
          </Button>
        </div>
      </div>
    </>
  );
}
