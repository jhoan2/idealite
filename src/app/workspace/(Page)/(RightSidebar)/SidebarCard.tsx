"use client";

import { useState, useRef, useEffect } from "react";
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
  description: string | null;
  question?: string | null;
  answer?: string | null;
  card_type?: string | null;
  status: "active" | "mastered" | "suspended";
  image_cid: string | null;
  tags: Tag[];
  userTagTree: TreeTag[];
  currentCardId: string;
  isMobile: boolean;
  embedding?: number[];
}

export function SidebarCard({
  id,
  content,
  description,
  question,
  answer,
  card_type,
  status,
  image_cid,
  userTagTree,
  tags,
  currentCardId,
  isMobile,
  embedding,
}: SidebarCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content || "");
  const [editedDescription, setEditedDescription] = useState(description || "");
  const [editedQuestion, setEditedQuestion] = useState(question || "");
  const [editedAnswer, setEditedAnswer] = useState(answer || "");
  const [showTags, setShowTags] = useState(false);
  const availableTags = flattenTagTree(userTagTree, tags);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;

    // Save the current scroll position
    const scrollTop = textarea.scrollTop;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Calculate the new height, but cap it at max-h-[200px] (200px)
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;

    // If the content is larger than the max height, enable scrolling
    if (textarea.scrollHeight > 200) {
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.overflowY = "hidden";
    }

    // Restore the scroll position
    textarea.scrollTop = scrollTop;
  };

  // Auto-adjust height when content changes
  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight(contentTextareaRef.current);
    }
  }, [editedContent, isEditing]);

  // Auto-adjust height when description changes
  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight(descriptionTextareaRef.current);
    }
  }, [editedDescription, isEditing]);

  // Auto-adjust when editing mode is enabled
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        adjustTextareaHeight(contentTextareaRef.current);
        adjustTextareaHeight(descriptionTextareaRef.current);
      }, 0);
    }
  }, [isEditing]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setEditedDescription(e.target.value);
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedQuestion(e.target.value);
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedAnswer(e.target.value);
  };

  const handleSave = async () => {
    try {
      await updateCard({
        id,
        content: editedContent,
        description: editedDescription,
        question: editedQuestion,
        answer: editedAnswer,
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
                  ref={descriptionTextareaRef}
                  value={editedDescription}
                  onChange={handleDescriptionChange}
                  className="mt-1 min-h-[100px] resize-none overflow-hidden"
                />
              </div>
            ) : card_type === "qa" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Question</label>
                  <Textarea
                    value={editedQuestion}
                    onChange={handleQuestionChange}
                    className="mt-1 min-h-[60px] resize-none overflow-hidden"
                    placeholder="Enter question..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Answer</label>
                  <Textarea
                    value={editedAnswer}
                    onChange={handleAnswerChange}
                    className="mt-1 min-h-[60px] resize-none overflow-hidden"
                    placeholder="Enter answer..."
                  />
                </div>
              </div>
            ) : (
              <div>
                <Textarea
                  ref={contentTextareaRef}
                  value={editedContent}
                  onChange={handleContentChange}
                  className="mt-1 min-h-[100px] resize-none overflow-hidden"
                  placeholder="Card content..."
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
                  src={`https://idealite.xyz/${image_cid}`}
                  alt="Card content"
                  className="w-full rounded-md"
                />
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            ) : card_type === "qa" ? (
              <div className="space-y-2">
                {question && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Question:
                    </p>
                    <p className="text-sm">{question}</p>
                  </div>
                )}
                {answer && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Answer:
                    </p>
                    <p className="text-sm">{answer}</p>
                  </div>
                )}
              </div>
            ) : (
              content && (
                <div>
                  <p className="text-sm">{content}</p>
                </div>
              )
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
                    isMobile={isMobile}
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
