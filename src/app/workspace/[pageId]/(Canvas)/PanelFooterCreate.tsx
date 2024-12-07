"use client";

import { Editor, TldrawUiButton, uniqueId, useEditor, useToasts } from "tldraw";
import { useCallback } from "react";
import { Loader2 } from "lucide-react";
import { TLAssetId } from "tldraw";
export const PanelFooterCreate = ({
  inputValue,
  isLoading,
  setIsLoading,
  width,
  height,
}: {
  inputValue: string;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  width: number;
  height: number;
}) => {
  const editor = useEditor();
  const { addToast } = useToasts();

  const generateImage = useCallback(async () => {
    setIsLoading(true);

    if (!inputValue) {
      addToast({ title: "No prompt", severity: "error" });
      return;
    }
    try {
      const response = await fetch("/api/blackforest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: inputValue,
          width,
          height,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      pollForResult(data.id);
    } catch (error) {
      console.error("Error generating image:", error);
    }
  }, [inputValue]);

  const pollForResult = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 5;
    const pollInterval = 2000;

    const poll = async (): Promise<boolean> => {
      if (attempts >= maxAttempts) {
        throw new Error("Timeout waiting for generation");
      }

      const response = await fetch(`/api/blackforest?id=${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch result: ${response.statusText}`);
      }

      const result = await response.json();

      switch (result.status) {
        case "completed":
          if (result.output) {
            if (editor) {
              createTldrawImage(editor, result.output);
            }
            setIsLoading(false);
            return true;
          }
          setIsLoading(false);
          return false;
        case "pending":
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          return poll();
        case "failed":
          setIsLoading(false);
          console.error("Generation failed");
          throw new Error("Generation failed");

        default:
          setIsLoading(false);
          throw new Error(`Unknown status: ${result.status}`);
      }
    };

    return poll();
  };

  const createTldrawImage = (editor: Editor, imageUrl: string) => {
    const assetId = `asset:${uniqueId()}` as TLAssetId;
    editor.createAssets([
      {
        id: assetId,
        type: "image",
        typeName: "asset",
        props: {
          name: "generated-image.png",
          src: imageUrl,
          w: width,
          h: height,
          mimeType: "image/png",
          isAnimated: false,
        },
        meta: { fileSize: 1000 },
      },
    ]);

    editor.createShape({
      type: "image",
      props: { assetId, w: width, h: height },
    });
  };

  return (
    <div className="flex w-full justify-center">
      {isLoading ? (
        <TldrawUiButton type="menu" disabled>
          <Loader2 className="animate-spin" />
        </TldrawUiButton>
      ) : (
        <TldrawUiButton type="menu" onClick={generateImage}>
          Generate
        </TldrawUiButton>
      )}
    </div>
  );
};
