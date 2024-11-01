"use client";

import { useState, useEffect } from "react";
import { Input } from "~/components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import { cleanUrl } from "~/lib/utils";
import MetadataDisplay from "./MetadataDisplay";
import { Loader2 } from "lucide-react";

interface AddUrlProps {
  setPreviewData: (data: any) => void;
  previewData: any;
}

export default function AddUrl({ setPreviewData, previewData }: AddUrlProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newMetadataKey, setNewMetadataKey] = useState("");

  const fetchPreviewData = useDebouncedCallback(async (value: string) => {
    if (!value) {
      setPreviewData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const cleanedUrl = cleanUrl(value);
      const response = await fetch(
        `/api/resource?type=url&query=${encodeURIComponent(cleanedUrl)}`,
      );
      const data = await response.json();
      console.log("data", data);
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
      </div>
    </>
  );
}
