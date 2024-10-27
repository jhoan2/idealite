"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Focus from "@tiptap/extension-focus";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";

interface HeadingEditorProps {
  initialTitle: string;
  pageId: string;
  immediatelyRender?: boolean;
}

const HeadingEditor = ({
  initialTitle,
  pageId,
  immediatelyRender = false,
}: HeadingEditorProps) => {
  const [title, setTitle] = useState(initialTitle);

  const debouncedSave = useDebouncedCallback(async (newTitle: string) => {
    try {
      const response = await fetch(`/api/pages?pageId=${pageId}`, {
        method: "PUT",
        body: JSON.stringify({ title: newTitle }),
      });
      if (!response.ok) {
        throw new Error("Failed to save title");
      }
    } catch (error) {
      console.error("Failed to save title:", error);
      toast.error("Failed to save changes. Please try again.");
    }
  }, 1000);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1],
        },
      }),
      Focus.configure({
        className: "has-focus",
        mode: "all",
      }),
    ],
    content: `<h1>${initialTitle}</h1>`,
    editorProps: {
      attributes: {
        class: "pb-4 prose prose-2xl font-bold focus:outline-none",
      },
    },
    immediatelyRender,
    onUpdate: ({ editor }) => {
      const newTitle = editor
        .getHTML()
        .replace(/<\/?h1>/g, "")
        .trim();

      if (newTitle !== title) {
        setTitle(newTitle);
        debouncedSave(newTitle);
      }
    },
  });

  return (
    <div className="mb-10 flex h-full w-full justify-center overflow-hidden">
      <div className={`w-full max-w-4xl px-4`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default HeadingEditor;
