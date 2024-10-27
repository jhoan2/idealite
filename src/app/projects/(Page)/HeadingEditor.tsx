"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Focus from "@tiptap/extension-focus";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

const HeadingEditor = ({
  initialTitle,
  pageId,
}: {
  initialTitle: string;
  pageId: string;
}) => {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);

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
        class: "prose prose-2xl font-bold focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const newTitle = editor
        .getHTML()
        .replace(/<\/?h1>/g, "")
        .trim();
      setTitle(newTitle);
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
