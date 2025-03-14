"use client";

import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Copy, Edit, X } from "lucide-react";
import { GeneratedImageResult } from "./MemoryPalace";
import Image from "next/image";
import { toast } from "sonner";
import { Label } from "~/components/ui/label";

export function ImageEdit({
  result,
  setResult,
  prompt,
  setPrompt,
  description,
  setDescription,
}: {
  result: GeneratedImageResult | null;
  setResult: (result: GeneratedImageResult | null) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  description: string;
  setDescription: (description: string) => void;
}) {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [editedImage, setEditedImage] = useState<{
    image: string;
    message: string;
  } | null>(null);
  const [searchPrompt, setSearchPrompt] = useState("");
  const [replacementPrompt, setReplacementPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();

    const clipboardData = event.clipboardData;

    let imageFile = null;

    // Check all clipboard items, not just the first one
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];

      if (!item) continue;

      // Process image items
      if (item.type.startsWith("image/")) {
        imageFile = item.getAsFile();
      }

      // Process text items that might contain our JSON metadata
      if (item.type === "text/plain") {
        item.getAsString((text) => {
          try {
            const parsedData = JSON.parse(text);

            // If we have a prompt in the metadata, use it
            if (parsedData && parsedData.prompt) {
              setPrompt(parsedData.prompt);
              setDescription(parsedData.description);
            }

            // You could also use other metadata fields like description
            // if needed elsewhere in your component
          } catch (err) {
            console.error("Error parsing metadata:", err);
            // Not JSON or invalid format, ignore
          }
        });
      }
    }

    // Process the image if we found one
    if (imageFile) {
      setOriginalImage(imageFile);
      const inputElement = document.getElementById("input-image-outpaint");
      if (inputElement) {
        (inputElement as HTMLInputElement).disabled = true;
      }
    } else {
      console.log("No image found in clipboard");
      const inputElement = document.getElementById("paste-image-outpaint");
      if (!inputElement) return;
      (inputElement as HTMLInputElement).value = "";
    }
  };

  const handleCopyToClipboard = async () => {
    if (!editedImage) {
      toast.error("No image to copy");
      return;
    }

    try {
      // Fetch the image (which should now be PNG format)
      const response = await fetch(editedImage.image);
      const blob = await response.blob();

      // Create metadata object
      const metadata = {
        prompt: prompt || "",
        description: description || "",
      };

      // Create ClipboardItem with the PNG image and metadata
      const item = new ClipboardItem({
        [blob.type]: blob,
        "text/plain": new Blob([JSON.stringify(metadata)], {
          type: "text/plain",
        }),
      });

      // Write to clipboard
      await navigator.clipboard.write([item]);
      toast.success("Image and metadata copied to clipboard");
    } catch (err) {
      console.error("Error copying to clipboard:", err);
      toast.error(
        `Failed to copy: ${err instanceof Error ? err.message : "Unknown error"}`,
      );

      // Fallback if the clipboard API fails
      try {
        // At least try to copy the metadata
        await navigator.clipboard.writeText(
          JSON.stringify({
            prompt: prompt || "",
            description: description || "",
          }),
        );
        toast.info("Only metadata copied (image copy failed)");
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
      }
    }
  };
  const handleSearchAndReplace = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (!originalImage || !searchPrompt || !replacementPrompt) {
      setError("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      // Use originalImage if available, otherwise use result?.image
      if (originalImage) {
        formData.append("image", originalImage);
      } else if (result?.image) {
        try {
          // Convert the image URL/data URL to a File object
          const response = await fetch(result.image);
          const blob = await response.blob();
          const imageFile = new File([blob], "image.jpg", { type: blob.type });
          formData.append("image", imageFile);
        } catch (error) {
          throw new Error(
            "Failed to process the image. Please try uploading it directly.",
          );
        }
      }

      formData.append("search_prompt", searchPrompt);
      formData.append("prompt", replacementPrompt);

      const response = await fetch("/api/memory-palace/edit/replace", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to edit image");
      }

      setEditedImage(data);
    } catch (err) {
      console.error("Error editing image:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="space-y-4">
      {result?.image && !originalImage && (
        <div className="relative h-64 w-full">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-6 w-6 rounded-full p-0"
            onClick={() => setResult(null)}
            title="Clear image"
          >
            <X className="h-4 w-4" />
          </Button>
          <img
            src={result?.image}
            alt={result.description || "Generated image"}
            className="h-full max-h-64 w-full max-w-full object-contain p-4"
          />
        </div>
      )}

      {originalImage && !result?.image ? (
        <div className="relative h-64 w-full">
          <Image
            fill
            style={{ objectFit: "contain" }}
            src={URL.createObjectURL(originalImage)}
            alt="Pasted Image"
            className="max-h-64 max-w-full p-4"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            placeholder="Paste image here"
            className="border-input bg-background placeholder:text-muted-foreground"
            onPaste={handlePaste}
          />
        </div>
      )}
      <form onSubmit={handleSearchAndReplace}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Find and Replace
          </label>
          <Input
            placeholder="Find object (e.g., dog, car, tree)"
            className="border-input bg-background placeholder:text-muted-foreground"
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
          />
          <Textarea
            placeholder="Replace with description..."
            className="border-input bg-background placeholder:text-muted-foreground"
            value={replacementPrompt}
            onChange={(e) => setReplacementPrompt(e.target.value)}
          />
        </div>
        {error && (
          <div className="rounded-md bg-destructive/10 p-2 text-destructive">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isLoading}
        >
          <Edit className="mr-2 h-4 w-4" />
          {isLoading ? "Processing..." : "Apply Edits"}
        </Button>
      </form>
      {editedImage && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h4 className="mb-2 text-sm font-medium text-foreground">
              Outpainted Image:
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="z-10 h-6 w-6 rounded-full bg-white bg-opacity-50 p-0"
              onClick={handleCopyToClipboard}
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <img
              src={editedImage.image}
              alt="Outpainted image"
              className="h-auto max-w-full rounded-md"
            />
          </div>
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
