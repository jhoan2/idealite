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
        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="bubble-menu">
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
