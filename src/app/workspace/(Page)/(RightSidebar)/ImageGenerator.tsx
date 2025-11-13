"use client";

import React, { useState, useRef, useEffect } from "react";
import { Paperclip, MoveUp, Eraser, Copy } from "lucide-react";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { toast } from "sonner";

export function ImageGenerator() {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<{ id: number; src: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    image: string;
    description?: string;
  } | null>(null);
  const [description, setDescription] = useState("");
  const [showCopyAnimation, setShowCopyAnimation] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea effect
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current as HTMLTextAreaElement;

      // Save the current scroll position
      const scrollTop = textarea.scrollTop;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";

      // Calculate the new height, but cap it at max-h-64 (16rem = 256px)
      const newHeight = Math.min(textarea.scrollHeight, 256);
      textarea.style.height = `${newHeight}px`;

      // If the content is larger than the max height, enable scrolling
      if (textarea.scrollHeight > 256) {
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.overflowY = "hidden";
      }

      // Restore the scroll position
      textarea.scrollTop = scrollTop;
    }
  }, [message]);

  // Copy button pulse animation effect
  useEffect(() => {
    if (result?.image) {
      // Trigger animation immediately when result appears
      setShowCopyAnimation(true);

      // Auto-stop after 4 seconds
      const timer = setTimeout(() => {
        setShowCopyAnimation(false);
      }, 3000);

      // Cleanup timeout on unmount or when result changes
      return () => clearTimeout(timer);
    }
  }, [result?.image]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!message.trim() && !image) return;

    setIsLoading(true);

    try {
      // Determine if we're editing an existing image or generating a new one
      if (image) {
        // We have an image, so we're editing
        await editImage();
      } else {
        // No image, so we're generating a new one
        await generateImage();
      }
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async () => {
    try {
      const response = await fetch("/api/memory-palace/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: message }),
      });

      if (!response.ok) {
        throw new Error(`Error generating image: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data.image) {
        setResult({
          image: data.data.image,
          description: data.data.description,
        });

        // Update the description field
        setDescription(data.data.description || message);
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
    }
  };

  const editImage = async () => {
    if (!image) return;

    try {
      // Convert base64 image back to a file
      const response = await fetch(image.src);
      const blob = await response.blob();
      const file = new File([blob], "image.png", { type: blob.type });

      // Create FormData for API request
      const formData = new FormData();
      formData.append("image", file);
      formData.append("prompt", message);

      // Make request to your API endpoint
      const result = await fetch("/api/memory-palace/edit/gemini", {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        throw new Error("Failed to edit image");
      }

      const data = await result.json();

      // Update with the edited image
      if (data.success && data.image) {
        setResult({
          image: data.image,
        });

        // Update the description field
        setDescription(data.description || message);
      }
    } catch (error) {
      console.error("Error editing image:", error);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Handle text paste (normal behavior)
    const text = e.clipboardData.getData("text");
    if (text) {
      // Let the default behavior handle text
      return;
    }

    // Handle image paste
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // If the item is an image
      if (item && item.type.indexOf("image") !== -1) {
        e.preventDefault(); // Prevent default paste behavior

        // Get file from clipboard
        const file = item.getAsFile();
        if (!file) continue;

        // Read the file as data URL
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result;
          if (typeof result === "string") {
            // Replace any existing image with the new one
            setImage({ id: Date.now(), src: result });
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAttachClick = () => {
    // This triggers the hidden file input
    if (fileInputRef.current) {
      (fileInputRef.current as HTMLInputElement).click();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Only process the first image
    const file = files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const result = readerEvent.target?.result;
        if (typeof result === "string") {
          // Replace any existing image with the new one
          setImage({ id: Date.now(), src: result });
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset file input
    e.target.value = "";
  };

  const handleRemoveBackground = async () => {
    if (!image) return;

    try {
      setIsLoading(true);

      // Convert base64 image back to a file
      const response = await fetch(image.src);
      const blob = await response.blob();
      const file = new File([blob], "image.png", { type: blob.type });

      // Create FormData for API request
      const formData = new FormData();
      formData.append("image", file);

      // Make request to your API endpoint
      const result = await fetch("/api/memory-palace/edit/remove-background", {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        throw new Error("Failed to remove background");
      }

      const data = await result.json();

      // Update the image with the background removed version
      if (data.success && data.image) {
        setResult({
          image: data.image,
          description: data.description || message,
        });
      }
    } catch (error) {
      console.error("Error removing background:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!result || !result.image) return;

    // Stop animation when user clicks copy
    setShowCopyAnimation(false);

    try {
      // For images, we need to fetch them first
      const response = await fetch(result.image);
      const blob = await response.blob();

      const metadata = {
        description: description || "",
      };
      // Create a ClipboardItem
      const item = new ClipboardItem({
        [blob.type]: blob,
        "text/plain": new Blob([JSON.stringify(metadata)], {
          type: "text/plain",
        }),
      });

      await navigator.clipboard.write([item]);

      // Show success feedback
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      try {
        await navigator.clipboard.writeText(result.image);
        toast.success("Copied URL", {
          description:
            "Your browser doesn't support copying images, so we copied the URL instead",
        });
      } catch (secondError) {
        toast.error("Not supported");
      }
    }
  };

  const resetForm = () => {
    setMessage("");
    setImage(null);
    setResult(null);
    setDescription("");
    setIsCopied(false);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Result Display */}
        {result && result.image && (
          <div className="mb-4 rounded-md border border-border p-2">
            <div className="flex items-center justify-between p-2">
              <h4 className="mb-2 text-sm font-medium text-foreground">
                {image ? "Edited Image:" : "Generated Image:"}
              </h4>

              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm font-medium text-gray-800 shadow-lg backdrop-blur-sm hover:bg-white hover:text-gray-900 hover:shadow-md active:scale-95 active:shadow-sm dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white",
                  showCopyAnimation && "animate-bounce",
                )}
                onClick={handleCopyToClipboard}
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
                <span>{isCopied ? "Copied!" : "Copy"}</span>
              </Button>
            </div>

            <img
              src={result.image}
              alt={result.description || "Generated image"}
              className="w-full rounded-md"
            />

            <div className="mt-2 space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={resetForm}>
                New Generation
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  if (result.image) {
                    setImage({ id: Date.now(), src: result.image });
                    setMessage("");
                    setResult(null);
                  }
                }}
              >
                Edit This Image
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Fixed input area at the bottom */}
      <div className="mt-auto">
        <Card className="shadow-sm">
          {/* Images section */}
          {image && (
            <div className="border-b p-3">
              <div className="border-black-500 group relative inline-block rounded-lg border-2">
                <img
                  src={image.src}
                  alt="Uploaded content"
                  className="h-24 w-auto rounded-md object-cover"
                />
                <Button
                  onClick={() => setImage(null)}
                  size="icon"
                  variant="secondary"
                  className="absolute right-1 top-1 h-6 w-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ✕
                </Button>
              </div>
            </div>
          )}

          {/* Text input area */}
          <CardContent className="p-3 pt-3">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={
                image
                  ? "Describe how to edit this image..."
                  : "Describe an image to generate..."
              }
              className="max-h-32 min-h-12 w-full resize-none border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
              disabled={isLoading}
            />
          </CardContent>

          {/* Bottom toolbar */}
          <CardFooter className="flex items-center justify-between border-t p-3 pt-2">
            <div className="flex gap-2">
              <Button
                onClick={handleAttachClick}
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full"
                title="Attach files"
                disabled={isLoading}
              >
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              </Button>
              {image && (
                <Button
                  onClick={handleRemoveBackground}
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full"
                  title="Remove background"
                  disabled={isLoading}
                >
                  <Eraser className="h-5 w-5 text-muted-foreground" />
                </Button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                className="hidden"
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={(!message.trim() && !image) || isLoading}
              size="icon"
              variant={message.trim() || image ? "default" : "secondary"}
              className={cn(
                "h-9 w-9 rounded-full",
                message.trim() || image ? "opacity-100" : "opacity-50",
              )}
              title={image ? "Edit image" : "Generate image"}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
              ) : (
                <MoveUp className="h-5 w-5" />
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
