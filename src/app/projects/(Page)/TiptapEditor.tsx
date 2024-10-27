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
// import { updatePage } from "./actions";
import { Badge } from "~/components/ui/badge";

type SaveStatus = "saved" | "saving" | "unsaved";

const TiptapEditor = ({
  content,
  title,
  immediatelyRender = false,
}: {
  content: string;
  title: string;
  immediatelyRender?: boolean;
}) => {
  const router = useRouter();
  const [editorTitle, setEditorTitle] = useState(title);
  const [editorContent, setEditorContent] = useState(content);
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const lastSavedContent = useRef({ title: title, content: content });

  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    immediatelyRender: immediatelyRender,
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
    },
  });

  return (
    <EditorContent
      editor={editor}
      className="min-h-[200px] w-3/4 rounded-md border p-4"
    />
  );
};

export default TiptapEditor;
