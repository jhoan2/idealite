"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, ImageIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { createCardFromPage } from "~/server/actions/card";
import { NodeSelection } from "@tiptap/pm/state";
import { Tag } from "~/server/db/schema";

interface ImageFlashcardCreatorProps {
  editor: any;
  pageId: string;
  tags: Tag[];
  onClose?: () => void;
}

export function ImageFlashcardCreator({
  editor,
  pageId,
  tags,
  onClose,
}: ImageFlashcardCreatorProps) {
  const [description, setDescription] = useState("");
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Enhanced auto-resize effect for textarea
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;

      // Save the current scroll position
      const scrollTop = textarea.scrollTop;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";

      // Calculate the new height, but cap it at max height (256px)
      const newHeight = Math.min(textarea.scrollHeight, 256);
      textarea.style.height = `${newHeight}px`;

      // If the content is larger than the max height, enable scrolling
      if (textarea.scrollHeight > 256) {
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.overflowY = "hidden";
      }

      // Restore the scroll position
      textarea.scrollTop = scrollTop;
    }
  }, [description]);

  // Handle clicks outside the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        // If user clicks outside and there's content in the textarea, don't close it
        if (description.trim()) return;

        // Clear the textarea and close if needed
        setDescription("");
        setIsActive(false);

        // If the parent component provided an onClose handler, call it
        if (onClose) {
          onClose();
        }

        // Clear editor selection to close bubble menu
        if (editor) {
          const { from } = editor.state.selection;
          editor.commands.setTextSelection({ from, to: from });
        }
      }
    };

    // Add click listener to document
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up event listener when component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [description, editor, onClose]);

  // Re-activate on focus
  const handleFocus = () => {
    setIsActive(true);
  };

  const handleCreateCard = async () => {
    if (!editor || !description.trim()) {
      toast.error("Description is required for image cards");
      return;
    }

    try {
      setIsCreatingCard(true);

      const selection = editor.state.selection;
      const isImageSelection =
        selection instanceof NodeSelection &&
        selection.node?.type.name === "image";

      if (!isImageSelection) {
        toast.error("No image selected");
        return;
      }

      // Get image CID from the source
      const src = selection.node.attrs.src;
      const imageId = src.split("/").pop();

      if (!imageId) {
        toast.error("Invalid image source");
        return;
      }

      const nodeId = selection.node.attrs.nodeId;

      // Set up card data
      const twoWeeksFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const cardData = {
        pageId,
        imageCid: imageId,
        description: description.trim(),
        nextReview: twoWeeksFromNow.toISOString(),
        tagIds: tags.map((tag) => tag.id),
        sourceLocator: {
          type: "page" as const,
          pointer: nodeId,
        },
      };

      const result = await createCardFromPage(cardData);

      if (!result.success) {
        throw new Error(result.error || "Failed to create card");
      }

      toast.success("Image flashcard created successfully");
      setDescription("");
      setIsActive(false);

      // Clear the selection to hide the bubble menu
      editor.commands.setTextSelection({
        from: selection.from,
        to: selection.from,
      });

      // Re-focus the editor
      editor.commands.focus();

      // Call onClose if provided
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Card creation failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create image flashcard",
      );
    } finally {
      setIsCreatingCard(false);
    }
  };

  // Return null if not active and description is empty
  if (!isActive && !description.trim()) {
    return null;
  }

  return (
    <Card className="border-0 shadow-sm" ref={cardRef}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h3 className="text-base font-medium">Create Image Flashcard</h3>
          </div>

          <div className="flex flex-col gap-3">
            <Textarea
              ref={textareaRef}
              placeholder="Enter answer for image flashcard..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={handleFocus}
              autoFocus
              className="max-h-64 min-h-12 w-full resize-none border-0 p-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  handleCreateCard();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setDescription("");
                  setIsActive(false);
                  if (onClose) onClose();
                }
              }}
            />

            <div className="flex gap-2">
              <Button
                onClick={handleCreateCard}
                disabled={isCreatingCard || !description.trim()}
                className="min-w-[100px]"
              >
                {isCreatingCard ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Card"
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setDescription("");
                  setIsActive(false);
                  if (onClose) onClose();
                }}
                className="min-w-[80px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
