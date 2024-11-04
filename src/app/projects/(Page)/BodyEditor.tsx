"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Focus from "@tiptap/extension-focus";
import { savePageContent } from "~/server/actions/page";

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

  const debouncedSave = useDebouncedCallback(async (content: string) => {
    try {
      onSavingStateChange(true);
      await savePageContent(pageId, content);
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      onSavingStateChange(false);
    }
  }, 1000);

  const editor = useEditor({
    extensions: [
      StarterKit,
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
    },
  });

  return (
    <div className="flex h-full w-full justify-center overflow-auto">
      <div className={`w-full max-w-4xl px-4`}>
        <EditorContent editor={editor} className="w-full" />
      </div>
    </div>
  );
};

export default BodyEditor;
