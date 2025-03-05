"use client";

import { Edit, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { GeneratedImageResult } from "./MemoryPalace";
import Image from "next/image";

export function Outpainting({
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
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which directions are selected
  const [directions, setDirections] = useState({
    up: 0,
    down: 0,
    left: 0,
    right: 0,
  });

  const handleDirectionToggle = (
    direction: "up" | "down" | "left" | "right",
  ) => {
    setDirections((prev) => ({
      ...prev,
      [direction]: prev[direction] === 0 ? 256 : 0, // Toggle between 0 and 256 pixels
    }));
  };

  const handleOutpaint = async () => {
    if (!originalImage && !result?.image) {
      setError("Please provide an image");
      return;
    }

    // Check if at least one direction is selected
    if (
      directions.up === 0 &&
      directions.down === 0 &&
      directions.left === 0 &&
      directions.right === 0
    ) {
      setError("Please select at least one direction for outpainting");
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

      // Add directions
      if (directions.up > 0) formData.append("up", directions.up.toString());
      if (directions.down > 0)
        formData.append("down", directions.down.toString());
      if (directions.left > 0)
        formData.append("left", directions.left.toString());
      if (directions.right > 0)
        formData.append("right", directions.right.toString());

      // Add prompt if provided
      if (prompt.trim()) formData.append("prompt", prompt);

      const response = await fetch("/api/memory-palace/edit/outpaint", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to outpaint image");
      }

      setEditedImage(data);
    } catch (err) {
      console.error("Error outpainting image:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();

    const clipboardData = event.clipboardData;
    const item = clipboardData.items[0];

    if (!item) return;
    if (!item.type.startsWith("image/")) {
      const inputElement = document.getElementById("paste-image-outpaint");
      if (!inputElement) return;
      (inputElement as HTMLInputElement).value = "";
      return;
    }

    const file = item.getAsFile();
    setOriginalImage(file);
    const inputElement = document.getElementById("input-image-outpaint");
    if (inputElement) {
      (inputElement as HTMLInputElement).disabled = true;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Outpainting Direction
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={directions.up > 0 ? "default" : "outline"}
            className={`justify-center ${directions.up > 0 ? "" : "border-border bg-background hover:bg-accent"}`}
            onClick={() => handleDirectionToggle("up")}
          >
            Top
          </Button>
          <Button
            variant={directions.down > 0 ? "default" : "outline"}
            className={`justify-center ${directions.down > 0 ? "" : "border-border bg-background hover:bg-accent"}`}
            onClick={() => handleDirectionToggle("down")}
          >
            Bottom
          </Button>
          <Button
            variant={directions.left > 0 ? "default" : "outline"}
            className={`justify-center ${directions.left > 0 ? "" : "border-border bg-background hover:bg-accent"}`}
            onClick={() => handleDirectionToggle("left")}
          >
            Left
          </Button>
          <Button
            variant={directions.right > 0 ? "default" : "outline"}
            className={`justify-center ${directions.right > 0 ? "" : "border-border bg-background hover:bg-accent"}`}
            onClick={() => handleDirectionToggle("right")}
          >
            Right
          </Button>
        </div>
      </div>

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
            id="paste-image-outpaint"
            placeholder="Paste image here"
            className="border-input bg-background placeholder:text-muted-foreground"
            onPaste={handlePaste}
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Outpainting Prompt (Optional)
        </label>
        <Textarea
          placeholder="Describe what should appear in the outpainted areas..."
          className="border-input bg-background placeholder:text-muted-foreground"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-2 text-destructive">
          {error}
        </div>
      )}

      <Button
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={handleOutpaint}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Edit className="mr-2 h-4 w-4" />
            Apply Outpainting
          </>
        )}
      </Button>

      {editedImage && (
        <div className="mt-6">
          <h4 className="mb-2 text-sm font-medium text-foreground">
            Outpainted Image:
          </h4>
          <img
            src={editedImage.image}
            alt="Outpainted image"
            className="h-auto max-w-full rounded-md"
          />
        </div>
      )}
    </div>
  );
}
