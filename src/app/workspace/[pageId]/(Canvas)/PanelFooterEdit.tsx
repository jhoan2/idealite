import { Loader2 } from "lucide-react";
import {
  Editor,
  TLAssetId,
  TLDrawShape,
  TldrawUiButton,
  TLImageShapeProps,
  TLShape,
  uniqueId,
  useEditor,
  useToasts,
} from "tldraw";

export const PanelFooterEdit = ({
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

  const pollForResult = async (id: string) => {
    let attempts = 0;
    const maxAttempts = 5;
    const pollInterval = 2500;

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

  const sendToEditApi = async (imageBase64: string, maskBase64: string) => {
    if (!inputValue) {
      addToast({ title: "No prompt", severity: "error" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/blackforest-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageBase64,
          mask: maskBase64,
          prompt: inputValue || "",
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      pollForResult(data.id);
      return data;
    } catch (error) {
      addToast({
        title: "Error sending to edit API",
        severity: "error",
        description: error instanceof Error ? error.message : "Unknown error",
      });
      console.error("Error sending to edit API:", error);
      throw error;
    }
  };

  const findOverlappingDrawings = (imageShape: TLShape): TLDrawShape[] => {
    if (!editor) return [];

    // Get the bounds of our target image
    const imageBounds = editor.getShapePageBounds(imageShape);
    if (!imageBounds) return [];

    // Helper function defined outside of the callback
    // to avoid creating new function on each render
    function isDrawingOverlappingImage(shape: TLShape): shape is TLDrawShape {
      // First check if it's a drawing shape
      if (shape.type !== "draw") return false;

      // Get the drawing's bounds
      const drawingBounds = editor.getShapePageBounds(shape);
      if (!drawingBounds || !imageBounds) return false;

      // Check intersection
      const isOverlapping = !(
        drawingBounds.maxX < imageBounds.minX ||
        drawingBounds.minX > imageBounds.maxX ||
        drawingBounds.maxY < imageBounds.minY ||
        drawingBounds.minY > imageBounds.maxY
      );

      return isOverlapping;
    }

    const overlappingDrawings = editor
      .getCurrentPageShapes()
      .filter(isDrawingOverlappingImage);

    return overlappingDrawings;
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

  const prepareMaskAndImage = async (
    selectedImage: TLShape,
    overlappingDrawings: TLDrawShape[],
  ): Promise<{ maskBase64: string; imageBase64: string }> => {
    editor.select(...overlappingDrawings.map((shape) => shape.id));

    // Create mask
    const maskBase64 = await createMaskFromDrawings(
      selectedImage,
      overlappingDrawings,
    );
    if (!maskBase64) {
      throw new Error("Failed to create mask");
    }
    const cleanMaskBase64 = cleanBase64Image(maskBase64);
    if (!cleanMaskBase64) {
      throw new Error("Failed to clean mask base64");
    }

    // Get the original image data
    const imageProps = selectedImage.props as TLImageShapeProps;
    if (!imageProps.assetId) {
      throw new Error("Failed to get image data");
    }

    const imageAsset = editor.getAsset(imageProps.assetId);
    if (!imageAsset) {
      throw new Error("Failed to get image data");
    }

    const imageBase64 = await fetch(imageAsset.props.src!)
      .then((response) => response.blob())
      .then((blob) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(",")[1];
            if (!base64String) {
              throw new Error("Failed to convert image to base64");
            }
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      });

    return { maskBase64: cleanMaskBase64, imageBase64 };
  };

  function cleanBase64Image(maskBase64: string) {
    // Remove data:image/png;base64, prefix if present
    const base64Data = maskBase64.replace(/^data:image\/png;base64,/, "");
    return base64Data;
  }

  const createMaskFromDrawings = async (
    selectedImage: TLShape,
    overlappingDrawings: TLDrawShape[],
  ): Promise<string | null> => {
    if (!editor || overlappingDrawings.length === 0) return null;

    const imageBounds = editor.getShapePageBounds(selectedImage);
    if (!imageBounds) return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Fill canvas with black (areas we don't want to modify)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    // Set up for drawing white shapes
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 40;

    for (const drawing of overlappingDrawings) {
      const svg = await editor.getSvgElement([drawing.id]);
      if (!svg) continue;

      // Create a blob URL for the SVG
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg.svg);
      const svgBlob = new Blob([svgStr], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);

      try {
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const drawingBounds = editor.getShapePageBounds(drawing);
            if (!drawingBounds) return reject("No bounds");

            // Calculate position relative to the image bounds
            const x = drawingBounds.minX - imageBounds.minX;
            const y = drawingBounds.minY - imageBounds.minY;

            // Draw the shape in white
            ctx.drawImage(img, x, y, drawingBounds.width, drawingBounds.height);
            resolve(null);
          };
          img.onerror = reject;
          img.src = url;
        });
      } finally {
        URL.revokeObjectURL(url); // Clean up the blob URL
      }
    }
    // Convert to base64 and clean up
    const base64 = canvas.toDataURL("image/png");
    canvas.remove();
    return base64;
  };

  const handleSendEdit = async () => {
    const selectedShapes = editor.getSelectedShapes();

    const selectedImage = selectedShapes.find(
      (shape) => shape.type === "image",
    );

    if (!selectedImage) {
      addToast({ title: "No image selected", severity: "error" });
      return;
    }
    const overlappingDrawings = findOverlappingDrawings(selectedImage);
    if (overlappingDrawings.length > 0) {
      try {
        const { maskBase64, imageBase64 } = await prepareMaskAndImage(
          selectedImage,
          overlappingDrawings,
        );
        await sendToEditApi(imageBase64, maskBase64);
      } catch (error) {
        addToast({
          title: "Error preparing mask",
          severity: "error",
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  };

  return (
    <div className="flex w-full justify-center">
      {isLoading ? (
        <TldrawUiButton type="menu" disabled>
          <Loader2 className="animate-spin" />
        </TldrawUiButton>
      ) : (
        <TldrawUiButton type="menu" onClick={() => handleSendEdit()}>
          Send Edit
        </TldrawUiButton>
      )}
    </div>
  );
};
