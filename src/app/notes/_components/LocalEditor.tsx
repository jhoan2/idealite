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
import { toast } from "sonner";
import { createCardFromPage } from "~/server/actions/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

// Existing custom components/extensions
import { CustomTypography } from "../../workspace/@page/(BodyEditor)/CustomTypograph";
import { CustomKeymap } from "../../workspace/@page/(BodyEditor)/CustomKeymap";
import LoadingOverlay from "../../workspace/@page/(BodyEditor)/LoadingOverlay";
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

type CardMode = "qa" | "cloze" | "image";

interface SelectedImageInfo {
  src: string;
  alt?: string;
  nodeId?: string;
}

export function LocalEditor({ initialContent, onUpdate, pageId }: LocalEditorProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardMode, setCardMode] = useState<CardMode>("qa");
  const [selectedText, setSelectedText] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [selectedImage, setSelectedImage] = useState<SelectedImageInfo | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [clozeText, setClozeText] = useState("");
  const [imageResponse, setImageResponse] = useState("");

  const debouncedUpdate = useDebouncedCallback((content: string, plainText: string) => {
    onUpdate(content, plainText);
  }, 500);

  const isUnsyncedPage = pageId.startsWith("temp-");

  const ensureServerBackedPage = () => {
    if (!isUnsyncedPage) return true;
    toast.error("Flashcards are available after this note syncs. Please try again in a few seconds.");
    return false;
  };

  const getNodeIdFromSelection = (editorInstance: Editor): string | undefined => {
    const { from } = editorInstance.state.selection;
    const $pos = editorInstance.state.doc.resolve(from);
    for (let depth = $pos.depth; depth >= 0; depth--) {
      const node = $pos.node(depth);
      const nodeId = node?.attrs?.nodeId;
      if (nodeId) return String(nodeId);
    }
    return undefined;
  };

  const resetModalState = () => {
    setIsModalOpen(false);
    setCardMode("qa");
    setSelectedText("");
    setSelectedNodeId(undefined);
    setSelectedImage(null);
    setQuestionText("");
    setAnswerText("");
    setClozeText("");
    setImageResponse("");
  };

  const handleOpenModal = () => {
    if (!editor) return;
    if (!ensureServerBackedPage()) return;

    const selection = editor.state.selection;
    const isImageSelection =
      selection instanceof NodeSelection && selection.node?.type.name === "image";

    if (isImageSelection) {
      const imageSrc = selection.node?.attrs?.src;
      if (!imageSrc) {
        toast.error("Invalid image selection");
        return;
      }

      setCardMode("image");
      setSelectedImage({
        src: imageSrc as string,
        alt: selection.node?.attrs?.alt as string | undefined,
        nodeId: selection.node?.attrs?.nodeId as string | undefined,
      });
      setIsModalOpen(true);
      editor.commands.setTextSelection({ from: selection.from, to: selection.from });
      return;
    }

    const content = editor.state.doc.textBetween(selection.from, selection.to).trim();
    if (!content) {
      toast.error("Please select some text to create a card");
      return;
    }

    setCardMode("qa");
    setSelectedText(content);
    setSelectedNodeId(getNodeIdFromSelection(editor));
    setQuestionText("");
    setAnswerText(content);
    setClozeText(content);
    setIsModalOpen(true);
    editor.commands.setTextSelection({ from: selection.from, to: selection.from });
  };

  const handleAddClozeFormatting = () => {
    const textarea = document.getElementById("cloze-text") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) {
      toast.error("Please select some text first");
      return;
    }

    const selected = clozeText.substring(start, end);
    const formatted =
      clozeText.substring(0, start) + "{{" + selected + "}}" + clozeText.substring(end);
    setClozeText(formatted);
  };

  const handleCreateCard = async () => {
    if (!ensureServerBackedPage()) return;

    try {
      setIsSubmitting(true);
      const twoWeeksFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      let cardType: "qa" | "cloze" | "image";
      let content = selectedText;
      let cardPayload: Record<string, unknown>;
      let imageCid: string | undefined;
      let description: string | undefined;
      let sourcePointer = selectedNodeId;

      if (cardMode === "qa") {
        if (!questionText.trim() || !answerText.trim()) {
          toast.error("Both question and answer are required");
          return;
        }

        cardType = "qa";
        cardPayload = {
          prompt: questionText.trim(),
          response: answerText.trim(),
        };
      } else if (cardMode === "cloze") {
        if (!clozeText.trim()) {
          toast.error("Cloze text is required");
          return;
        }

        const clozeMatches = clozeText.match(/{{([^{}]+)}}/g);
        if (!clozeMatches) {
          toast.error("Please mark at least one word with {{...}} in your cloze text");
          return;
        }

        const blanks = clozeMatches.map((match) => match.slice(2, -2).trim()).filter(Boolean);
        const sentence = clozeText.replace(/{{([^{}]+)}}/g, "_____").trim();

        cardType = "cloze";
        content = clozeText.trim();
        cardPayload = {
          sentence,
          blanks,
        };
      } else {
        if (!selectedImage?.src) {
          toast.error("No image selected");
          return;
        }
        if (!imageResponse.trim()) {
          toast.error("Answer is required for image flashcards");
          return;
        }

        cardType = "image";
        content = imageResponse.trim();
        imageCid = selectedImage.src;
        description = imageResponse.trim();
        sourcePointer = selectedImage.nodeId;
        cardPayload = {
          image_url: selectedImage.src,
          response: imageResponse.trim(),
          alt: selectedImage.alt ?? null,
        };
      }

      const result = await createCardFromPage({
        pageId,
        cardType,
        cardPayload,
        cardPayloadVersion: 1,
        content,
        imageCid,
        description,
        nextReview: twoWeeksFromNow.toISOString(),
        sourceLocator: {
          type: "page",
          pointer: sourcePointer,
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create card");
      }

      toast.success("Flashcard created successfully");
      window.dispatchEvent(new CustomEvent("flashcard:created", { detail: { pageId } }));
      resetModalState();
    } catch (error) {
      console.error("Card creation failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create flashcard");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    immediatelyRender: false,
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
              {!isImageSelected && (
                <>
                  <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className="rounded px-2 py-1 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Bold
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className="rounded px-2 py-1 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Italic
                  </button>
                  <div className="mx-1 h-4 w-[1px] bg-border" />
                </>
              )}

              <button
                onClick={handleOpenModal}
                className="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-foreground hover:bg-muted"
                title={isImageSelected ? "Create image flashcard" : "Create flashcard"}
              >
                <Wrench className="h-4 w-4" />
                Create Card
              </button>
            </div>
          </BubbleMenu>
        )}

        <Dialog open={isModalOpen} onOpenChange={(open) => !isSubmitting && !open ? resetModalState() : setIsModalOpen(open)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Flashcard</DialogTitle>
              <DialogDescription>
                {cardMode === "image"
                  ? "Create an image flashcard from the selected image."
                  : "Create a text flashcard from the selected text."}
              </DialogDescription>
            </DialogHeader>

            {cardMode === "image" ? (
              <div className="space-y-3 pt-2">
                <Label htmlFor="image-response">Answer</Label>
                <Textarea
                  id="image-response"
                  placeholder="Enter answer for image flashcard..."
                  value={imageResponse}
                  onChange={(e) => setImageResponse(e.target.value)}
                  rows={4}
                />
              </div>
            ) : (
              <Tabs value={cardMode} onValueChange={(value) => setCardMode(value as "qa" | "cloze")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="qa">Question & Answer</TabsTrigger>
                  <TabsTrigger value="cloze">Cloze Deletion</TabsTrigger>
                </TabsList>

                <TabsContent value="qa" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Question</Label>
                    <Textarea
                      id="question"
                      placeholder="Enter the question"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="answer">Answer</Label>
                    <Textarea
                      id="answer"
                      placeholder="Enter the answer"
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="cloze" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="cloze-text">
                      Text with Cloze Deletions{" "}
                      <span className="text-sm text-muted-foreground">
                        (surround hidden words with double braces)
                      </span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddClozeFormatting}
                      className="text-xs"
                    >
                      Add Cloze Brackets
                    </Button>
                    <Textarea
                      id="cloze-text"
                      placeholder="Example: The capital of France is {{Paris}}."
                      value={clozeText}
                      onChange={(e) => setClozeText(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <strong>Preview:</strong> {clozeText.replace(/{{([^{}]+)}}/g, "_____")}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={resetModalState} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleCreateCard} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Flashcard"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
