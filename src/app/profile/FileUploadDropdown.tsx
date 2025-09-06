"use client";

import { useState, useRef } from "react";

// Extend HTML input attributes to include webkitdirectory
declare module "react" {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}
import { Upload, FolderOpen, ChevronDown, Bell } from "lucide-react";
import Link from "next/link";
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
      // Convert FileList to array and filter for supported files
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

      // Check total size (50MB limit)
      const totalSize = fileArray.reduce((sum, file) => sum + file.size, 0);
      const maxSizeBytes = 50 * 1024 * 1024; // 50MB
      
      if (totalSize > maxSizeBytes) {
        toast.error("Total file size exceeds 50MB limit");
        return;
      }

      toast.success(`Found ${markdownFiles.length} markdown files and ${imageFiles.length} images. Processing started!`);

      // Create FormData and upload files
      const formData = new FormData();
      const supportedFiles = [...markdownFiles, ...imageFiles];
      
      supportedFiles.forEach((file, index) => {
        formData.append(`file-${index}`, file);
      });

      const response = await fetch('/api/upload/markdown-folder', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      toast.success(
        <div className="flex items-start justify-between w-full">
          <div>
            <p>Processing started successfully!</p>
            <p className="text-sm text-muted-foreground">
              {result.stats.markdownFiles} markdown files and {result.stats.imageFiles} images are being processed. You'll get a notification when it's done.
            </p>
          </div>
          <Link href="/notifications" className="ml-2">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
              Notifications
            </Button>
          </Link>
        </div>,
        {
          duration: 10000,
        }
      );

      console.log("Upload result:", result);
      
    } catch (error) {
      console.error("Error processing folder:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process folder";
      toast.error(errorMessage);
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
            Select a folder containing markdown files and images. Markdown files will be converted to pages, images will be uploaded to Cloudflare, and wikilinks will create automatic backlink relationships between pages.
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