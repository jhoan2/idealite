"use client";

import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Edit, X } from "lucide-react";
import { GeneratedImageResult } from "./MemoryPalace";
import Image from "next/image";

export function ImageEdit({
  result,
  setResult,
}: {
  result: GeneratedImageResult | null;
  setResult: (result: GeneratedImageResult | null) => void;
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

    const item = clipboardData.items[0];

    if (!item) return;
    if (!item.type.startsWith("image/")) {
      const inputElement = document.getElementById("paste-image");
      if (!inputElement) return;
      (inputElement as HTMLInputElement).value = "";
      return;
    }

    const file = item.getAsFile();
    setOriginalImage(file);
    const inputElement = document.getElementById("input-image");
    if (inputElement) {
      (inputElement as HTMLInputElement).disabled = true;
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
          <h4 className="mb-2 text-sm font-medium">Edited Image:</h4>
          <img
            src={editedImage.image}
            alt="Edited image"
            className="h-auto max-w-full rounded-md"
          />
        </div>
      )}
    </div>
  );
}
