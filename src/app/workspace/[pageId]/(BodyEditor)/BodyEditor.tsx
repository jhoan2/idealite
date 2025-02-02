"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Focus from "@tiptap/extension-focus";
import { savePageContent } from "~/server/actions/page";
import { BubbleMenu } from "@tiptap/react";
import { CustomTypography } from "./CustomTypograph";
import { CustomKeymap } from "./CustomKeymap";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import LoadingOverlay from "./LoadingOverlay";
import { createCardFromPage } from "~/server/actions/card";
import { NodeSelection } from "@tiptap/pm/state";
import { Input } from "~/components/ui/input";
import StackCardsIcon from "./StackCardsIcon";
import { Loader2 } from "lucide-react";

const BodyEditor = ({
  content,
  immediatelyRender = false,

  onSavingStateChange,
  pageId,
}: {
  content: string;
  immediatelyRender?: boolean;
  onSavingStateChange: (isSaving: boolean) => void;
  pageId: string;
}) => {
  const [editorContent, setEditorContent] = useState(content);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [description, setDescription] = useState("");
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);

  const debouncedSave = useDebouncedCallback(async (content: string) => {
    try {
      onSavingStateChange(true);
      await savePageContent(pageId, content);
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      onSavingStateChange(false);
    }
  }, 2500);

  const handleImageUpload = async (file: File, editor: Editor) => {
    try {
      setIsUploadingImage(true);

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return;
      }

      // Validate file size
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image");
      }

      const data = await response.json();
      const privateGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

      // Insert image at cursor position
      editor
        .chain()
        .focus()
        .setImage({
          src: privateGateway + data.image.url,
          alt: data.image.filename,
          title: data.image.filename,
        })
        .run();
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCopy = (editor: Editor) => {
    if (!editor) return;

    // Get the selected text
    const selectedText =
      editor.state.selection.content().content.firstChild?.text;
    console.log(selectedText, "selectedText");
    if (selectedText) {
      navigator.clipboard
        .writeText(selectedText)
        .then(() => {
          toast.success("Copied to clipboard");
        })
        .catch(() => {
          toast.error("Failed to copy text");
        });
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomTypography,
      CustomKeymap,
      Image,
      TaskList,
      TaskItem.configure({
        nested: true, // Enable nested task lists
      }),
      Focus.configure({
        className: "has-focus",
        mode: "all",
      }),
    ],
    content: content,
    immediatelyRender: immediatelyRender,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setEditorContent(newContent);
      debouncedSave(newContent);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl bg-background text-foreground w-full min-h-[500px] focus:outline-none ",
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith("image/"));

        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file && editor) {
            handleImageUpload(file, editor);
          }
          return true;
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFile = files.find((file) => file.type.startsWith("image/"));

        if (imageFile && !moved && editor) {
          event.preventDefault();
          handleImageUpload(imageFile, editor);
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor) {
      // Update image selection state whenever selection changes
      const handleSelectionUpdate = () => {
        const selection = editor.state.selection;
        const isImageSelection =
          selection instanceof NodeSelection &&
          selection.node?.type.name === "image";

        setIsImageSelected(isImageSelection);
      };

      editor.on("selectionUpdate", handleSelectionUpdate);
      return () => {
        editor.off("selectionUpdate", handleSelectionUpdate);
      };
    }
  }, [editor]);

  const handleCreateCard = async (editor: Editor) => {
    if (!editor) return;

    try {
      setIsCreatingCard(true);
      const selection = editor.state.selection;
      const isImageSelection =
        selection instanceof NodeSelection &&
        selection.node?.type.name === "image";

      const twoWeeksFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const baseCardData = {
        pageId,
        nextReview: twoWeeksFromNow.toISOString(),
      };

      let cardData;

      if (isImageSelection) {
        if (!description.trim()) {
          toast.error("Description is required for image cards");
          return;
        }

        const src = selection.node.attrs.src;
        const imageId = src.split("/").pop();

        if (!imageId) {
          toast.error("Invalid image source");
          return;
        }

        cardData = {
          ...baseCardData,
          imageCid: imageId,
          description: description.trim(),
        };
      } else {
        // Handle text cards
        const content = editor.state.doc.textBetween(
          selection.from,
          selection.to,
        );

        if (!content.trim()) {
          toast.error("Please select some text to create a card");
          return;
        }

        cardData = {
          ...baseCardData,
          content: content.trim(),
        };
      }

      const result = await createCardFromPage(cardData);

      if (!result.success) {
        throw new Error(result.error || "Failed to create card");
      }

      setDescription("");
      editor.commands.focus();
    } catch (error) {
      console.error("Card creation failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create card",
      );
    } finally {
      setIsCreatingCard(false);
    }
  };

  return (
    <div className="flex h-full w-full justify-center overflow-auto">
      {isUploadingImage && <LoadingOverlay />}
      <div className={`w-full max-w-4xl px-4`}>
        <div className="pb-[50vh]">
          <EditorContent editor={editor} className="w-full" />
        </div>

        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="bubble-menu flex gap-2 rounded border border-border bg-background p-2 shadow-md">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive("bold") ? "is-active" : ""}
              >
                Bold
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive("italic") ? "is-active" : ""}
              >
                Italic
              </button>
              <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive("strike") ? "is-active" : ""}
              >
                Strike
              </button>
              <div className="w-[1px] bg-slate-200" />
              <button
                onClick={() => handleCreateCard(editor)}
                className="rounded bg-background px-2 py-1 text-secondary-foreground transition-colors hover:bg-secondary/90"
                disabled={isCreatingCard}
                title="Create Card"
              >
                {isCreatingCard ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <StackCardsIcon />
                )}
              </button>
              {isImageSelected && (
                <div className="absolute -top-10 left-0 right-0 flex gap-2 bg-background">
                  <Input
                    type="text"
                    placeholder="Enter description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    autoFocus
                    className="h-8 min-w-[300px] bg-background text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreateCard(editor);
                        setDescription("");
                      }
                      if (e.key === "Escape") {
                        setDescription("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (description.trim()) {
                        handleCreateCard(editor);
                        setDescription("");
                      }
                    }}
                    disabled={isCreatingCard}
                    className="rounded bg-primary px-2 py-1 text-sm text-primary-foreground transition-colors hover:bg-muted-foreground"
                  >
                    {isCreatingCard ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setDescription("");
                    }}
                    className="rounded bg-background px-2 py-1 text-sm text-secondary-foreground transition-colors hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </BubbleMenu>
        )}
      </div>
    </div>
  );
};

export default BodyEditor;
