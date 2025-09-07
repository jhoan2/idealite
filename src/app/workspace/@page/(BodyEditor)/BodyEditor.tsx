"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Focus from "@tiptap/extension-focus";
import { savePageContent } from "~/server/actions/page";
import * as Sentry from "@sentry/nextjs";
import { BubbleMenu } from "@tiptap/react";
import { CustomTypography } from "./CustomTypograph";
import { CustomKeymap } from "./CustomKeymap";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import LoadingOverlay from "./LoadingOverlay";
import { createCardFromPage } from "~/server/actions/card";
import { NodeSelection } from "@tiptap/pm/state";
import { Loader2, Wrench } from "lucide-react";
import { Tag } from "~/server/db/schema";
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
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import QuestionSparklesIcon from "./QuestionSparklesIcon";
import ClozeSparklesIcon from "./ClozeSparklesIcon";
import { ImageFlashcardCreator } from "./CreateImageFlashcard";
import { ParagraphWithId } from "./ParagraphWithIds";
import { ImageWithId } from "./ImageWithId";
import { HeadingWithId } from "./HeadingWithId";
import { ListItemWithId } from "./ListItemWithId";
import { BlockquoteWithId } from "./BlockquoteWithId";
import { CodeBlockWithId } from "./CodeBlockWithId";
import { TaskListWithId } from "./TaskListWithId";
import { TaskItemWithId } from "./TaskItemWithId";
import { BulletListWithId } from "./BulletListWithId";
import { OrderedListWithId } from "./OrderedListWithId";
import { PageMention } from "./PageMention";
import { Link } from "@tiptap/extension-link";

const BodyEditor = ({
  content,
  immediatelyRender = false,
  onSavingStateChange,
  pageId,
  tags,
}: {
  content: string;
  immediatelyRender?: boolean;
  onSavingStateChange: (isSaving: boolean) => void;
  pageId: string;
  tags: Tag[];
}) => {
  const [editorContent, setEditorContent] = useState(content);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [cardType, setCardType] = useState<"qa" | "cloze">("qa");
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [clozeText, setClozeText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingQA, setIsGeneratingQA] = useState(false);
  const [isGeneratingCloze, setIsGeneratingCloze] = useState(false);

  const debouncedSave = useDebouncedCallback(async (content: string, jsonContent: any) => {
    // Convert TipTap JSON to plain object for Server Action serialization
    let serializedJsonContent = null;
    
    try {
      onSavingStateChange(true);
      
      if (jsonContent) {
        try {
          // Strip prototypes and classes by serializing and parsing
          serializedJsonContent = JSON.parse(JSON.stringify(jsonContent));
        } catch (serializationError) {
          // Log serialization errors to Sentry for future debugging
          Sentry.captureException(serializationError, {
            tags: {
              operation: "tiptap_json_serialization",
              component: "body_editor",
            },
            extra: {
              pageId,
              contentLength: content.length,
              hasJsonContent: !!jsonContent,
            },
            level: "warning",
          });
          console.error('Failed to serialize TipTap JSON content:', serializationError);
          // Continue without jsonContent if serialization fails
          serializedJsonContent = null;
        }
      }
      
      await savePageContent(pageId, content, serializedJsonContent);
    } catch (error) {
      // Log save errors to Sentry for future debugging
      Sentry.captureException(error, {
        tags: {
          operation: "save_page_content",
          component: "body_editor",
        },
        extra: {
          pageId,
          contentLength: content.length,
          hasSerializedJsonContent: !!serializedJsonContent,
        },
        level: "error",
      });
      console.error('Failed to save page content:', error);
      toast.error("Failed to save changes");
    } finally {
      onSavingStateChange(false);
    }
  }, 2500);

  const handleImageUpload = async (file: File, editor: Editor) => {
    try {
      setIsUploadingImage(true);

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return;
      }

      // Validate file size
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      // Changed from "/api/image" to "/api/image/cloudflare"
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
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

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

  const getNodeIdFromSelection = (editor: Editor): string | undefined => {
    const { from } = editor.state.selection;
    const $pos = editor.state.doc.resolve(from);

    for (let depth = $pos.depth; depth >= 0; depth--) {
      const node = $pos.node(depth);
      const nodeId = node?.attrs?.nodeId;
      if (nodeId) return nodeId as string;
    }
    return undefined;
  };

  const handleOpenFlashcardModal = (editor: Editor) => {
    if (!editor) return;

    const selection = editor.state.selection;

    // Get the content before clearing selection
    const content = editor.state.doc.textBetween(selection.from, selection.to);

    if (!content.trim()) {
      toast.error("Please select some text to create a card");
      return;
    }

    // Store the selected text
    setSelectedText(content.trim());

    // Initialize form fields
    setQuestionText("");
    setAnswerText(content.trim());
    setClozeText(content.trim());

    // Clear selection - this should hide the bubble menu
    editor.commands.setTextSelection({
      from: selection.from,
      to: selection.from, // Set to same position to clear selection
    });

    // Open the modal
    setIsModalOpen(true);
  };

  const handleCreateCustomCard = async () => {
    if (cardType === "qa" && (!questionText.trim() || !answerText.trim())) {
      toast.error("Both question and answer are required");
      return;
    }

    if (cardType === "cloze" && !clozeText.trim()) {
      toast.error("Cloze text is required");
      return;
    }

    // Extract cloze answers from the format with {{...}}
    const clozeMatches = clozeText.match(/{{([^{}]+)}}/g);
    if (cardType === "cloze" && !clozeMatches) {
      toast.error(
        "Please mark at least one word with {{...}} in your cloze text",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const nodeId = getNodeIdFromSelection(editor!);
      const twoWeeksFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const baseCardData = {
        pageId,
        content: selectedText,
        nextReview: twoWeeksFromNow.toISOString(),
        tagIds: tags.map((tag) => tag.id),
        sourceLocator: {
          type: "page" as const,
          pointer: nodeId,
        },
      };

      let cardData;

      if (cardType === "qa") {
        cardData = {
          ...baseCardData,
          question: questionText.trim(),
          answer: answerText.trim(),
        };
      } else {
        // For cloze deletion cards
        const clozeAnswers = clozeMatches
          ? clozeMatches.map((match) => match.slice(2, -2))
          : [];

        const clozeTemplate = clozeText.replace(/{{([^{}]+)}}/g, "_____");

        cardData = {
          ...baseCardData,
          content: clozeText,
          clozeTemplate: clozeTemplate,
          clozeAnswers: clozeAnswers.join(", "),
        };
      }

      const result = await createCardFromPage(cardData);

      if (!result.success) {
        throw new Error(result.error || "Failed to create card");
      }

      toast.success(
        `Custom ${cardType === "qa" ? "question-answer" : "cloze"} card created successfully`,
      );

      window.dispatchEvent(
        new CustomEvent("flashcard:created", {
          detail: { pageId },
        }),
      );

      // Close the modal
      setIsModalOpen(false);

      // Clear form fields
      setQuestionText("");
      setAnswerText("");
      setClozeText("");
    } catch (error) {
      console.error("Card creation failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create card",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateQA = async (editor: Editor) => {
    if (!editor) return;

    const selection = editor.state.selection;
    const content = editor.state.doc.textBetween(selection.from, selection.to);
    const nodeId = getNodeIdFromSelection(editor!);

    if (!content.trim()) {
      toast.error("Please select some text to create a Q&A card");
      return;
    }

    try {
      setIsGeneratingQA(true);

      const response = await fetch("/api/queue-flashcard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          pageId,
          type: "question-answer",
          tagIds: tags.map((tag) => tag.id),
          sourceLocator: {
            type: "page" as const,
            pointer: nodeId,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to queue Q&A flashcard generation",
        );
      }

      const data = await response.json();

      toast.success("Q&A flashcard creation queued", {
        description: "Your flashcard will be created shortly",
      });

      // Clear the selection to hide the bubble menu
      editor.commands.setTextSelection({
        from: selection.from,
        to: selection.from,
      });
    } catch (error) {
      console.error("Error generating Q&A flashcard:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create Q&A flashcard",
      );
    } finally {
      setIsGeneratingQA(false);
    }
  };

  // Handler for generating Cloze flashcards
  const handleGenerateCloze = async (editor: Editor) => {
    if (!editor) return;

    const selection = editor.state.selection;
    const content = editor.state.doc.textBetween(selection.from, selection.to);
    const nodeId = getNodeIdFromSelection(editor!);
    if (!content.trim()) {
      toast.error("Please select some text to create a Cloze card");
      return;
    }

    try {
      setIsGeneratingCloze(true);

      const response = await fetch("/api/queue-flashcard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          pageId,
          type: "cloze",
          tagIds: tags.map((tag) => tag.id),
          sourceLocator: {
            type: "page" as const,
            pointer: nodeId,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to queue Cloze flashcard generation",
        );
      }

      const data = await response.json();

      toast.success("Cloze flashcard creation queued", {
        description: "Your flashcard will be created shortly",
      });

      // Clear the selection to hide the bubble menu
      editor.commands.setTextSelection({
        from: selection.from,
        to: selection.from,
      });
    } catch (error) {
      console.error("Error generating Cloze flashcard:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create Cloze flashcard",
      );
    } finally {
      setIsGeneratingCloze(false);
    }
  };

  const handleAddClozeFormatting = () => {
    // Get the textarea element with the correct type
    const textarea = document.getElementById(
      "cloze-text",
    ) as HTMLTextAreaElement;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Check if there's a selection
    if (start === end) {
      toast.error("Please select some text first");
      return;
    }

    // Get the selected text
    const selectedText = clozeText.substring(start, end);

    // Create the new text with the selection wrapped in curly brackets
    const newText =
      clozeText.substring(0, start) +
      "{{" +
      selectedText +
      "}}" +
      clozeText.substring(end);

    // Update the state
    setClozeText(newText);

    // Focus back on the textarea
    setTimeout(() => {
      textarea.focus();
      // Set cursor position after the newly formatted text
      const newPosition = end + 4; // 4 is the length of the added brackets
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const CustomLink = Link.extend({
    inclusive: false, // Set this at the mark level
    addAttributes() {
      return {
        ...this.parent?.(),
        // Just add a simple pageId attribute for internal links
        pageId: {
          default: null,
          parseHTML: element => element.getAttribute('data-page-id'),
          renderHTML: attributes => {
            return attributes.pageId ? { 'data-page-id': attributes.pageId } : {};
          },
        },
      };
    },
    renderHTML({ HTMLAttributes }) {
      const { pageId, ...otherAttrs } = HTMLAttributes;
      
      // Internal links have pageId, external links don't
      const isInternal = !!pageId;
      
      return [
        'a',
        {
          ...otherAttrs,
          class: isInternal 
            ? 'bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium cursor-pointer hover:bg-blue-200 transition-colors duration-150 no-underline dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700'
            : 'text-blue-600 hover:text-blue-800 underline cursor-pointer dark:text-blue-400 dark:hover:text-blue-300',
          'data-page-id': pageId || null,
          // Add target="_blank" only for external links (no pageId)
          ...(isInternal ? {} : { target: '_blank', rel: 'noopener noreferrer' }),
        },
        0,
      ];
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
      CustomLink.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https"],
        validate: (url: string) => {
          return url.startsWith("http://") || url.startsWith("https://");
        },
      }),
      PageMention,
    ],
    content: content,
    immediatelyRender: immediatelyRender,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      const jsonContent = editor.getJSON();
      setEditorContent(newContent);
      debouncedSave(newContent, jsonContent);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl bg-background text-foreground w-full min-h-[500px] focus:outline-none ",
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

  useEffect(() => {
    if (editor) {
      // Update image selection state whenever selection changes
      const handleSelectionUpdate = () => {
        const selection = editor.state.selection;
        const isImageSelection =
          selection instanceof NodeSelection &&
          selection.node?.type.name === "image";

        setIsImageSelected(isImageSelection);
      };

      editor.on("selectionUpdate", handleSelectionUpdate);
      return () => {
        editor.off("selectionUpdate", handleSelectionUpdate);
      };
    }
  }, [editor]);

  return (
    <div className="flex h-full w-full justify-center overflow-auto">
      {isUploadingImage && <LoadingOverlay />}
      <div className={`w-full max-w-4xl px-4`}>
        <div className="pb-[50vh]">
          <EditorContent editor={editor} className="w-full" />
        </div>

        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="bubble-menu flex gap-2 rounded border border-border bg-background p-2 shadow-md">
              {!isImageSelected && (
                <>
                  <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                  >
                    Bold
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                  >
                    Italic
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                  >
                    Strike
                  </button>
                  <div className="w-[1px] bg-slate-200" />
                  <button
                    onClick={() => handleGenerateQA(editor)}
                    title="Generate Q&A Cards"
                  >
                    <QuestionSparklesIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => handleGenerateCloze(editor)}
                    title="Generate Cloze Cards"
                  >
                    <ClozeSparklesIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => handleOpenFlashcardModal(editor)}
                    title="Create Custom Flashcard"
                  >
                    <Wrench className="h-4 w-4" />
                  </button>
                </>
              )}

              {isImageSelected && (
                <ImageFlashcardCreator
                  editor={editor}
                  pageId={pageId}
                  tags={tags}
                />
              )}
            </div>
          </BubbleMenu>
        )}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Custom Flashcard</DialogTitle>
              <DialogDescription>
                Create a custom flashcard from the selected text
              </DialogDescription>
            </DialogHeader>

            <Tabs
              defaultValue="qa"
              onValueChange={(value) => setCardType(value as "qa" | "cloze")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qa">Question & Answer</TabsTrigger>
                <TabsTrigger value="cloze">Cloze Deletion</TabsTrigger>
              </TabsList>

              {/* Question & Answer Tab */}
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

              {/* Cloze Deletion Tab */}
              <TabsContent value="cloze" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="cloze-text">
                    Text with Cloze Deletions{" "}
                    <span className="text-sm text-muted-foreground">
                      (Surround words to hide with double braces)
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
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm">
                    <strong>Preview:</strong>{" "}
                    {clozeText.replace(/{{([^{}]+)}}/g, "_____")}
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCustomCard} disabled={isSubmitting}>
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
};

export default BodyEditor;
