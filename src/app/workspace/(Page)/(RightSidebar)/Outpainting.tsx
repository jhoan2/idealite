"use client";

import { Edit, Loader2, X, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { GeneratedImageResult } from "./MemoryPalace";
import Image from "next/image";
import { Input } from "~/components/ui/input";
import { toast } from "sonner";
import { Label } from "~/components/ui/label";

export function Outpainting({
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outpaintingPrompt, setOutpaintingPrompt] = useState("");

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
          value={outpaintingPrompt}
          onChange={(e) => setOutpaintingPrompt(e.target.value)}
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
          <div className="flex items-center justify-between p-2">
            <h4 className="mb-2 text-sm font-medium text-foreground">
              Outpainted Image:
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm font-medium text-gray-800 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-gray-900 hover:shadow-md active:scale-95 active:shadow-sm dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white"
              onClick={handleCopyToClipboard}
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
              <span>Copy</span>
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
