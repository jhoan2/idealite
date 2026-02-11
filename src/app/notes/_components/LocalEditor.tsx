"use client";

import { useEditor, EditorContent, Editor, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Focus from "@tiptap/extension-focus";
import { Placeholder } from "@tiptap/extension-placeholder";
import { useDebouncedCallback } from "use-debounce";
import { LocalPageMention } from "./LocalPageMention";
import { Link } from "@tiptap/extension-link";
import { useEffect, useState } from "react";
import { NodeSelection } from "@tiptap/pm/state";
import { Loader2, Wrench } from "lucide-react";

// Existing custom components/extensions
import { CustomTypography } from "../../workspace/@page/(BodyEditor)/CustomTypograph";
import { CustomKeymap } from "../../workspace/@page/(BodyEditor)/CustomKeymap";
import LoadingOverlay from "../../workspace/@page/(BodyEditor)/LoadingOverlay";
import QuestionSparklesIcon from "../../workspace/@page/(BodyEditor)/QuestionSparklesIcon";
import ClozeSparklesIcon from "../../workspace/@page/(BodyEditor)/ClozeSparklesIcon";
import { ImageFlashcardCreator } from "../../workspace/@page/(BodyEditor)/CreateImageFlashcard";
import { ParagraphWithId } from "../../workspace/@page/(BodyEditor)/ParagraphWithIds";
import { ImageWithId } from "../../workspace/@page/(BodyEditor)/ImageWithId";
import { HeadingWithId } from "../../workspace/@page/(BodyEditor)/HeadingWithId";
import { ListItemWithId } from "../../workspace/@page/(BodyEditor)/ListItemWithId";
import { BlockquoteWithId } from "../../workspace/@page/(BodyEditor)/BlockquoteWithId";
import { CodeBlockWithId } from "../../workspace/@page/(BodyEditor)/CodeBlockWithId";
import { TaskListWithId } from "../../workspace/@page/(BodyEditor)/TaskListWithId";
import { TaskItemWithId } from "../../workspace/@page/(BodyEditor)/TaskItemWithId";
import { BulletListWithId } from "../../workspace/@page/(BodyEditor)/BulletListWithId";
import { OrderedListWithId } from "../../workspace/@page/(BodyEditor)/OrderedListWithId";

interface LocalEditorProps {
  initialContent: string;
  onUpdate: (content: string, plainText: string) => void;
  pageId: string;
}

export function LocalEditor({ initialContent, onUpdate, pageId }: LocalEditorProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);

  const debouncedUpdate = useDebouncedCallback((content: string, plainText: string) => {
    onUpdate(content, plainText);
  }, 500);

  const CustomLink = Link.extend({
    inclusive: false,
    addAttributes() {
      return {
        ...this.parent?.(),
        pageId: {
          default: null,
          parseHTML: element => element.getAttribute('data-page-id'),
          renderHTML: attributes => {
            return attributes.pageId ? { 'data-page-id': attributes.pageId } : {};
          },
        },
      };
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
      }),
      ParagraphWithId,
      CustomTypography,
      CustomKeymap,
      ImageWithId,
      HeadingWithId,
      ListItemWithId,
      BlockquoteWithId,
      CodeBlockWithId,
      TaskListWithId,
      TaskItemWithId.configure({ nested: true }),
      BulletListWithId,
      OrderedListWithId,
      Focus.configure({
        className: "has-focus",
        mode: "all",
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      CustomLink.configure({
        openOnClick: true,
        autolink: true,
      }),
      LocalPageMention,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      debouncedUpdate(html, text);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl bg-background text-foreground w-full min-h-[500px] focus:outline-none",
      },
      handlePaste: (view, event) => {
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

  const handleImageUpload = async (file: File, editor: Editor) => {
    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/image/cloudflare", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload image");

      const data = await response.json();
      editor.chain().focus().setImage({
        src: data.cloudflareData.url,
        alt: data.image.filename,
        title: data.image.filename,
      }).run();
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Safely update content if it changes externally (e.g. sync)
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(initialContent, false);
    }
  }, [initialContent, editor]);

  // Handle image selection for bubble menu
  useEffect(() => {
    if (editor) {
      const handleSelectionUpdate = () => {
        const selection = editor.state.selection;
        setIsImageSelected(
          selection instanceof NodeSelection && selection.node?.type.name === "image"
        );
      };
      editor.on("selectionUpdate", handleSelectionUpdate);
      return () => { editor.off("selectionUpdate", handleSelectionUpdate); };
    }
  }, [editor]);

  return (
    <div className="flex h-full w-full justify-center overflow-auto">
      {isUploadingImage && <LoadingOverlay />}
      <div className="w-full max-w-4xl px-4">
        <div className="pb-[50vh]">
          <EditorContent editor={editor} className="w-full" />
        </div>

        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="bubble-menu flex items-center gap-2 rounded border border-border bg-background p-2 shadow-md">
              {!isImageSelected ? (
                <>
                  <button onClick={() => editor.chain().focus().toggleBold().run()} className="px-2 py-1 text-sm font-medium hover:bg-muted rounded text-foreground">Bold</button>
                  <button onClick={() => editor.chain().focus().toggleItalic().run()} className="px-2 py-1 text-sm font-medium hover:bg-muted rounded text-foreground">Italic</button>
                  <div className="w-[1px] h-4 bg-border mx-1" />
                  <button onClick={() => toast.info("AI Generation is server-side")} title="Generate Q&A" className="p-1 hover:bg-muted rounded">
                    <QuestionSparklesIcon className="h-5 w-5 text-foreground" />
                  </button>
                  <button onClick={() => toast.info("AI Generation is server-side")} title="Generate Cloze" className="p-1 hover:bg-muted rounded">
                    <ClozeSparklesIcon className="h-5 w-5 text-foreground" />
                  </button>
                </>
              ) : (
                <ImageFlashcardCreator editor={editor} pageId={pageId} tags={[]} />
              )}
            </div>
          </BubbleMenu>
        )}
      </div>
    </div>
  );
}
