"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

import { createResource, CreateResourceInput } from "~/server/actions/resource";
import { toast } from "sonner";
import AddUrl from "./AddUrl";
import AddBook from "./AddBook";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";

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
  const [selectedType, setSelectedType] = useState("url");
  const [previewData, setPreviewData] = useState<any>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedType("url");
      setPreviewData(null);
    }
    onOpenChange(open);
  };

  const handleAddResource = async () => {
    if (!previewData) return;

    const resourceInput: CreateResourceInput = {
      url: previewData.url,
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
        <div className="flex flex-col gap-2">
          <RadioGroup
            defaultValue="url"
            onValueChange={setSelectedType}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="book" id="book" />
              <Label htmlFor="book">Book</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="url" id="url" />
              <Label htmlFor="url">URL</Label>
            </div>
          </RadioGroup>
          {selectedType === "url" && (
            <AddUrl setPreviewData={setPreviewData} previewData={previewData} />
          )}
          {selectedType === "book" && (
            <AddBook
              pageId={pageId}
              handleOpenChange={() => handleOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
