"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Pencil,
  Trash2,
  Check,
  X,
  Tag as TagIcon,
  Pause,
  CircleDashed,
  CircleCheck,
} from "lucide-react";
import { updateCard, deleteCard } from "~/server/actions/card";
import { toast } from "sonner";
import { Textarea } from "~/components/ui/textarea";
import { Tag } from "~/server/db/schema";
import { flattenTagTree } from "~/lib/tree";
import { TreeTag } from "~/server/queries/usersTags";
import { Drawer } from "~/components/ui/drawer";
import { TagList } from "../../@page/TagList";
import { TagDrawer } from "../../@page/TagDrawer";

interface SidebarCardProps {
  id: string;
  content: string | null;
  prompt: string | null;
  description: string | null;
  status: "active" | "mastered" | "suspended";
  image_cid: string | null;
  tags: Tag[];
  userTagTree: TreeTag[];
  currentCardId: string;
  isMobile: boolean;
}

export function SidebarCard({
  id,
  content,
  prompt,
  description,
  status,
  image_cid,
  userTagTree,
  tags,
  currentCardId,
  isMobile,
}: SidebarCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content || "");
  const [editedDescription, setEditedDescription] = useState(description || "");
  const [showTags, setShowTags] = useState(false);
  const availableTags = flattenTagTree(userTagTree, tags);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSave = async () => {
    try {
      await updateCard({
        id,
        content: editedContent,
        description: editedDescription,
      });
      setIsEditing(false);
      toast.success("Card updated successfully");
    } catch (error) {
      toast.error("Failed to update card");
      console.error("Error updating card:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCard(id);
      toast.success("Card deleted successfully");
    } catch (error) {
      toast.error("Failed to delete card");
      console.error("Error deleting card:", error);
    }
  };

  const handleShowTags = () => {
    if (isMobile) {
      setIsDrawerOpen(true);
    } else {
      setShowTags(!showTags);
    }
  };

  if (isEditing) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="space-y-4">
            {image_cid ? (
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
            ) : (
              <div>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="mt-1 h-auto max-h-[200px] min-h-[100px] overflow-y-auto"
                />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="space-y-4">
            {image_cid ? (
              <div className="space-y-2">
                <img
                  src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image_cid}`}
                  alt="Card content"
                  className="w-full rounded-md"
                />
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            ) : (
              content && (
                <div>
                  <p className="text-sm">{content}</p>
                </div>
              )
            )}
            {prompt && (
              <div>
                <label className="text-sm font-medium">Prompt</label>
                <p className="mt-1 text-sm">{prompt}</p>
              </div>
            )}
            <div>
              {!isMobile && showTags && (
                <div className="flex flex-wrap gap-2">
                  <TagList
                    tags={tags}
                    availableTags={availableTags}
                    currentPageId={currentCardId}
                    variant="card"
                    cardId={id}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex flex-row items-center gap-2">
            {status === "suspended" && (
              <div title="Suspended">
                <Pause className="h-4 w-4 text-amber-500" />
              </div>
            )}
            {status === "active" && (
              <div title="Active">
                <CircleDashed className="h-4 w-4 text-emerald-500" />
              </div>
            )}
            {status === "mastered" && (
              <div title="Mastered">
                <CircleCheck className="h-4 w-4 text-emerald-700" />
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleShowTags}>
              <TagIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
      {isMobile && (
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <TagDrawer
            tags={tags}
            availableTags={availableTags}
            onOpenChange={setIsDrawerOpen}
            variant="card"
            cardId={id}
            currentPageId={currentCardId}
          />
        </Drawer>
      )}
    </>
  );
}
