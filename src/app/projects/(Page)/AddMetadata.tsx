"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Loader2 } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "~/components/ui/button";
import { MetadataDisplay } from "./MetadataDisplay";
import { cleanUrl } from "~/lib/utils";
import { createResource, CreateResourceInput } from "~/server/actions/resource";
import { toast } from "sonner";

interface AddMetadataProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
}

export default function AddMetadata({
  isOpen,
  onOpenChange,
  pageId,
}: AddMetadataProps) {
  const [newMetadataKey, setNewMetadataKey] = useState("");
  const [selectedType, setSelectedType] = useState("url");
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        `/api/resource?type=${selectedType}&query=${encodeURIComponent(cleanedUrl)}`,
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

  useEffect(() => {
    fetchPreviewData(newMetadataKey);
  }, [newMetadataKey, selectedType]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNewMetadataKey("");
      setSelectedType("url");
      setPreviewData(null);
      setIsLoading(false);
      setError(null);
    }
    onOpenChange(open);
  };

  const handleAddResource = async () => {
    if (!previewData) return;

    const resourceInput: CreateResourceInput = {
      url: newMetadataKey,
      type: selectedType as CreateResourceInput["type"],
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
      handleOpenChange(false);
    } catch (error) {
      console.error("Error creating resource:", error);
      toast.error("Error creating resource");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Select the type of resource you want to add and then enter the URL or
          details.
        </DialogDescription>
        <div className="flex gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="url">URL</SelectItem>
              <SelectItem value="book">Book</SelectItem>
              <SelectItem value="research-paper">Research Paper</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Enter URL or book details"
            value={newMetadataKey}
            onChange={(e) => setNewMetadataKey(e.target.value)}
            className="flex-1"
          />
        </div>
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
        {previewData && (
          <Button onClick={handleAddResource}>Add Resource</Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
