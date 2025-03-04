import { useState } from "react";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Wand2 } from "lucide-react";
import { GeneratedImageResult } from "./MemoryPalace";

export function Generate({
  result,
  setResult,
}: {
  result: GeneratedImageResult | null;
  setResult: (result: GeneratedImageResult | null) => void;
}) {
  const [prompt, setPrompt] = useState("");
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
          <img
            src={result.image}
            alt={result.description || "Generated image"}
            className="w-full rounded-md"
          />
        </div>
      )}
    </div>
  );
}
