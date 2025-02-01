"use client";

import { useState } from "react";
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
                onClick={() => {
                  // Method 1: Get text between from and to
                  const { from, to } = editor.state.selection;
                  const selectedText = editor.state.doc.textBetween(from, to);
                  console.log(editor.state.doc.textContent, "inlineContent");
                  console.log("Selected text (Method 1):", selectedText);

                  // Method 2: Get text using getText()
                  // const text = editor.getText();
                  // console.log("All text (Method 2):", text);

                  // Method 3: Get HTML of selection
                  // const htmlContent = editor.getHTML();
                  // console.log("HTML content (Method 3):", htmlContent);
                }}
              >
                Click
              </button>
            </div>
          </BubbleMenu>
        )}
      </div>
    </div>
  );
};

export default BodyEditor;
