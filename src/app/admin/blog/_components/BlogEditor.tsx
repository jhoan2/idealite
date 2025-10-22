"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { BubbleMenu } from "@tiptap/react";
import { ImageIcon } from "lucide-react";
import { Button } from "~/components/ui/button";

interface BlogEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
}

export function BlogEditor({
  content,
  onChange,
  editable = true,
}: BlogEditorProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (file: File, editor: Editor) => {
    try {
      setIsUploadingImage(true);

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return;
      }

      // Validate file size (5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/image/cloudflare", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image");
      }

      const data = await response.json();

      editor
        .chain()
        .focus()
        .setImage({
          src: data.cloudflareData.url,
          alt: data.image.filename,
          title: data.image.filename,
        })
        .run();

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageButtonClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && editor) {
        handleImageUpload(file, editor);
      }
    };
    input.click();
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https"],
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none min-h-[400px] focus:outline-none p-4 border rounded-md",
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

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 rounded-md border p-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-muted" : ""}
        >
          Bold
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-muted" : ""}
        >
          Italic
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "bg-muted" : ""}
        >
          Strike
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={
            editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""
          }
        >
          H1
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={
            editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""
          }
        >
          H2
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={
            editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""
          }
        >
          H3
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-muted" : ""}
        >
          Bullet List
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-muted" : ""}
        >
          Numbered List
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-muted" : ""}
        >
          Quote
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive("codeBlock") ? "bg-muted" : ""}
        >
          Code
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleImageButtonClick}
          disabled={isUploadingImage}
        >
          <ImageIcon className="h-4 w-4" />
          {isUploadingImage ? "Uploading..." : "Image"}
        </Button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Bubble Menu */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex gap-1 rounded border bg-background p-1 shadow-md">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive("bold") ? "bg-muted" : ""}
            >
              Bold
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? "bg-muted" : ""}
            >
              Italic
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive("strike") ? "bg-muted" : ""}
            >
              Strike
            </Button>
          </div>
        </BubbleMenu>
      )}
    </div>
  );
}
