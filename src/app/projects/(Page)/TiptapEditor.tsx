"use client";

import { useCallback, useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Focus from "@tiptap/extension-focus";
import { Badge } from "~/components/ui/badge";

type SaveStatus = "saved" | "saving" | "unsaved";

const TiptapEditor = ({
  content,
  immediatelyRender = false,
}: {
  content: string;
  immediatelyRender?: boolean;
}) => {
  const router = useRouter();
  const [editorContent, setEditorContent] = useState(content);
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

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
      setEditorContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl bg-background text-foreground w-full h-screen focus:outline-none",
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

export default TiptapEditor;
