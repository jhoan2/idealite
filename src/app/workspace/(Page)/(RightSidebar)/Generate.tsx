import { useState } from "react";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Wand2, Copy } from "lucide-react";
import { GeneratedImageResult } from "./MemoryPalace";
import { toast } from "sonner";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";

export function Generate({
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/memory-palace/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setResult(data.data);
    } catch (err) {
      console.error("Error generating image:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!result?.image) {
      toast.error("No image to copy");
      return;
    }

    try {
      // Fetch the image (which should now be PNG format)
      const response = await fetch(result?.image || "");
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
          Prompt
        </label>
        <Textarea
          placeholder="Describe the image you want to generate..."
          className="border-border bg-background placeholder:text-muted-foreground"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      {/* <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Style</label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border bg-background hover:bg-accent"
          >
            Realistic
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-border bg-background hover:bg-accent"
          >
            Artistic
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-border bg-background hover:bg-accent"
          >
            3D
          </Button>
        </div>
      </div> */}

      <Button
        className="w-full bg-primary hover:bg-primary/90"
        onClick={handleGenerateImage}
        disabled={isLoading || !prompt.trim()}
      >
        <Wand2 className="mr-2 h-4 w-4" />
        {isLoading ? "Generating..." : "Generate Image"}
      </Button>

      {error && (
        <div className="mt-2 rounded-md bg-destructive/10 p-2 text-destructive">
          {error}
        </div>
      )}

      {result && result.image && (
        <div className="mt-4 rounded-md border border-border p-2">
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
          <img
            src={result.image}
            alt={result.description || "Generated image"}
            className="w-full rounded-md"
          />
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
