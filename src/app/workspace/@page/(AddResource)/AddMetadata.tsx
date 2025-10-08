"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedType("url");
    }
    onOpenChange(open);
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
        <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
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
            <AddUrl
              pageId={pageId}
              handleOpenChange={() => handleOpenChange(false)}
            />
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
