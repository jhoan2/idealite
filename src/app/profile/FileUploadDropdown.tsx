"use client";

import { useState, useRef } from "react";

// Extend HTML input attributes to include webkitdirectory
declare module "react" {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}
import { Upload, FolderOpen, ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { toast } from "sonner";

export default function FileUploadDropdown() {
  const [isProcessing, setIsProcessing] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleMarkdownFolderUpload = () => {
    folderInputRef.current?.click();
  };

  const handleFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    
    try {
      // Convert FileList to array and filter for markdown files
      const fileArray = Array.from(files);
      const markdownFiles = fileArray.filter(file => 
        file.name.toLowerCase().endsWith('.md') || 
        file.name.toLowerCase().endsWith('.markdown')
      );
      
      const imageFiles = fileArray.filter(file => 
        file.type.startsWith('image/')
      );

      console.log("Selected files:", {
        total: fileArray.length,
        markdown: markdownFiles.length,
        images: imageFiles.length,
        files: fileArray.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });

      if (markdownFiles.length === 0) {
        toast.error("No markdown files found in the selected folder");
        return;
      }

      toast.success(`Found ${markdownFiles.length} markdown files and ${imageFiles.length} images`);
      
      // TODO: Implement actual upload and processing logic here
      
    } catch (error) {
      console.error("Error processing folder:", error);
      toast.error("Failed to process folder");
    } finally {
      setIsProcessing(false);
      // Reset the input
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload size={20} />
          File Uploads
        </CardTitle>
        <CardDescription>
          Upload and process your files to create pages and content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                disabled={isProcessing}
              >
                <span className="flex items-center gap-2">
                  <Upload size={16} />
                  {isProcessing ? "Processing..." : "Upload Files"}
                </span>
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full" align="start">
              <DropdownMenuItem 
                onClick={handleMarkdownFolderUpload}
                className="flex items-center gap-2"
                disabled={isProcessing}
              >
                <FolderOpen size={16} />
                <span>Upload Markdown Folder</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <p className="text-sm text-muted-foreground">
            Select a folder containing markdown files to upload and process them into your workspace.
          </p>
        </div>

        {/* Hidden file input for folder selection */}
        <input
          ref={folderInputRef}
          type="file"
          multiple
          webkitdirectory=""
          directory=""
          onChange={handleFolderSelect}
          className="hidden"
          accept=".md,.markdown,image/*"
        />
      </CardContent>
    </Card>
  );
}