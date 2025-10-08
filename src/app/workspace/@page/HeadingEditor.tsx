"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Focus from "@tiptap/extension-focus";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import { updatePage } from "~/server/actions/page";
import { useSearchParams } from "next/navigation";

interface HeadingEditorProps {
  initialTitle: string;
  immediatelyRender?: boolean;
  onSavingStateChange: (isSaving: boolean) => void;
  isCanvas?: boolean;
}


function hasInvalidCharacters(title: string): {
  isValid: boolean;
  invalidChar?: string;
} {
  const invalidChars = ['"', "/", "\\", "*", "<", ">", ":", "|", "?"];

  for (const char of invalidChars) {
    if (title.includes(char)) {
      return { isValid: false, invalidChar: char };
    }
  }

  return { isValid: true };
}

const HeadingEditor = ({
  initialTitle,
  immediatelyRender = false,
  onSavingStateChange,
  isCanvas = false,
}: HeadingEditorProps) => {
  const [title, setTitle] = useState(initialTitle);
  const searchParams = useSearchParams();

  const debouncedSave = useDebouncedCallback(async (newTitle: string) => {
    onSavingStateChange(true);

    // Read pageId fresh inside the callback
    const pageId = searchParams.get("pageId") ?? "";
    
    if (!newTitle.trim() || !pageId.trim()) {
      onSavingStateChange(false);
      return;
    }

    try {
      // Check for invalid characters
      const { isValid } = hasInvalidCharacters(newTitle);
      if (!isValid) {
        toast.error(`Title cannot contain the characters: " / \\ * < > : | ?`);
        return;
      }

      // Update the page - server will handle uniqueness validation
      const updatedPage = await updatePage(pageId, { title: newTitle });

      if (!updatedPage) {
        throw new Error("Failed to update page title");
      }
    } catch (error) {
      console.error("Failed to save title:", error);
      if (error instanceof Error && error.message.includes("already exists")) {
        toast.error(error.message);
      } else {
        toast.error("Failed to save changes. Please try again.");
      }
    } finally {
      onSavingStateChange(false);
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
        class:
          "pb-4 prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl font-bold focus:outline-none bg-background text-foreground",
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
    <div
      className={`mb-10 flex ${isCanvas ? "" : "h-full"} w-full justify-center overflow-hidden`}
    >
      <div className={`w-full max-w-4xl px-4`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default HeadingEditor;
