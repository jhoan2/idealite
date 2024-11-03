"use client";

import { useState, useEffect } from "react";
import { Input } from "~/components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import MetadataDisplay from "./MetadataDisplay";
import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { createResource } from "~/server/actions/resource";
import { toast } from "sonner";
import { CreateResourceInput } from "~/server/actions/resource";

interface AddUrlProps {
  pageId: string;
  handleOpenChange: () => void;
}

export default function AddUrl({ pageId, handleOpenChange }: AddUrlProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newMetadataKey, setNewMetadataKey] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fetchPreviewData = useDebouncedCallback(async (value: string) => {
    if (!value) {
      setPreviewData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/resource?type=url&query=${encodeURIComponent(value)}`,
      );
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPreviewData(data);
      }
    } catch (error) {
      console.error("Error fetching preview:", error);
      setError("Error fetching preview");
    } finally {
      setIsLoading(false);
    }
  }, 1000);

  const handleAddResource = async () => {
    if (!previewData) return;
    setIsCreating(true);
    const resourceInput: CreateResourceInput = {
      url: previewData.url,
      type: "url",
      title: previewData.title || "",
      description: previewData.description || "",
      image: previewData.image || undefined,
      favicon: previewData.favicon || undefined,
      author: previewData.author || undefined,
      og_type: previewData.og_type || undefined,
      date_published: previewData.date_published
        ? new Date(previewData.date_published)
        : undefined,
      page_id: pageId,
    };

    try {
      await createResource(resourceInput);
      handleOpenChange();
    } catch (error) {
      console.error("Error creating resource:", error);
      toast.error("Error creating resource");
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    fetchPreviewData(newMetadataKey);
  }, [newMetadataKey]);

  return (
    <>
      <Input
        placeholder="Enter URL"
        value={newMetadataKey}
        onChange={(e) => setNewMetadataKey(e.target.value)}
        className="flex-1"
      />
      {/* Preview section */}
      <div className="mt-4">
        {isLoading && (
          <div className="z-10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        )}
        {error && !isLoading && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        {previewData && !error && (
          <MetadataDisplay
            type={previewData.type}
            title={previewData.title}
            image={previewData.image}
            description={previewData.description}
            url={previewData.url}
            date_published={previewData.date_published}
            author={previewData.author}
          />
        )}
        {previewData && (
          <Button
            onClick={handleAddResource}
            className="mt-4 w-full"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Resource...
              </>
            ) : (
              "Add Resource"
            )}
          </Button>
        )}
      </div>
    </>
  );
}
