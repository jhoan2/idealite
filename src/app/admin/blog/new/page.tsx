"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BlogEditor } from "../_components/BlogEditor";
import { createBlogPost, generateSlug } from "~/server/actions/blog";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  // Auto-generate slug from title
  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    if (!slugEdited && newTitle) {
      const generatedSlug = await generateSlug(newTitle);
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (newSlug: string) => {
    setSlug(newSlug);
    setSlugEdited(true);
  };

  const handleCoverImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return;
      }

      // Validate file size (5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/image/cloudflare", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image");
      }

      const data = await response.json();
      setCoverImage(data.cloudflareData.url);
      toast.success("Cover image uploaded");
    } catch (error) {
      console.error("Cover image upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload cover image",
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createBlogPost({
        title: title.trim(),
        slug: slug.trim(),
        content,
        excerpt: excerpt.trim() || undefined,
        coverImage: coverImage || undefined,
        published,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create post");
      }

      toast.success(
        published ? "Post published successfully" : "Draft saved successfully",
      );
      router.push("/admin/blog");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create post",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link
          href="/admin/blog"
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to posts
        </Link>
        <h1 className="text-3xl font-bold">Create New Blog Post</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Enter post title"
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">
            Slug <span className="text-destructive">*</span>
          </Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="post-url-slug"
            required
          />
          <p className="text-sm text-muted-foreground">
            URL: /blog/{slug || "post-url-slug"}
          </p>
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary of the post (optional)"
            rows={3}
          />
        </div>

        {/* Cover Image */}
        <div className="space-y-2">
          <Label htmlFor="coverImage">Cover Image</Label>
          <Input
            id="coverImage"
            type="file"
            accept="image/*"
            onChange={handleCoverImageUpload}
          />
          {coverImage && (
            <div className="mt-2">
              <img
                src={coverImage}
                alt="Cover preview"
                className="h-48 w-full rounded-md object-cover"
              />
            </div>
          )}
        </div>

        {/* Content Editor */}
        <div className="space-y-2">
          <Label>
            Content <span className="text-destructive">*</span>
          </Label>
          <BlogEditor content={content} onChange={setContent} />
        </div>

        {/* Published Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="published"
            checked={published}
            onCheckedChange={setPublished}
          />
          <Label htmlFor="published" className="cursor-pointer">
            Publish immediately
          </Label>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {published ? "Publishing..." : "Saving..."}
              </>
            ) : published ? (
              "Publish Post"
            ) : (
              "Save Draft"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/blog")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
