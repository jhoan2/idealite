import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { ratelimit } from "~/server/ratelimit";
import { qstashClient } from "~/lib/upstash/qstash/qstash";
import * as Sentry from "@sentry/nextjs";

interface FileData {
  name: string;
  content: string;
  type: "markdown" | "image";
  size: number;
  relativePath: string;
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  const userId = user?.externalId;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await ratelimit.limit(userId);
  if (!success) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    const files: FileData[] = [];
    let imagesMeta: Array<{
      name: string;
      size: number;
      relativePath: string;
      key: string;
      publicUrl: string;
    }> = [];

    if (contentType.includes("application/json")) {
      // New JSON flow: markdown files only + image meta (presigned uploads)
      const body = await request.json();
      const markdownFiles: Array<{
        name: string;
        content: string;
        size: number;
        relativePath: string;
      }> = body.markdownFiles || [];
      imagesMeta = body.images || [];

      for (const mf of markdownFiles) {
        files.push({
          name: mf.name,
          content: mf.content,
          type: "markdown",
          size: mf.size,
          relativePath: mf.relativePath || mf.name,
        });
      }
    } else {
      // Backward-compatible FormData flow
      const data = await request.formData();

      // Process all files from the form data
      for (const [key, value] of data.entries()) {
        if (value instanceof File) {
          const file = value as File;
          const fileName = file.name.toLowerCase();

          // Handle markdown files
          if (
            key.startsWith("markdown-") &&
            (fileName.endsWith(".md") || fileName.endsWith(".markdown"))
          ) {
            const content = await file.text();
            files.push({
              name: file.name,
              content,
              type: "markdown",
              size: file.size,
              relativePath: file.webkitRelativePath || file.name,
            });
          }

          // Handle image files
          else if (
            key.startsWith("image-") &&
            (file.type.startsWith("image/") ||
              fileName.endsWith(".png") ||
              fileName.endsWith(".jpg") ||
              fileName.endsWith(".jpeg") ||
              fileName.endsWith(".gif") ||
              fileName.endsWith(".webp") ||
              fileName.endsWith(".svg"))
          ) {
            // For images, we'll pass the file as base64 or let the workflow handle the upload
            const arrayBuffer = await file.arrayBuffer();
            const content = Buffer.from(arrayBuffer).toString("base64");
            files.push({
              name: file.name,
              content,
              type: "image",
              size: file.size,
              relativePath: file.webkitRelativePath || file.name,
            });
          }
        }
      }

      if (files.length === 0) {
        return Response.json(
          { error: "No markdown or image files found" },
          { status: 400 },
        );
      }
    }

    // Separate file counts
    const markdownFiles = files.filter((f) => f.type === "markdown");
    const imageFilesCount = contentType.includes("application/json")
      ? imagesMeta.length
      : files.filter((f) => f.type === "image").length;

    if (markdownFiles.length === 0 && imageFilesCount === 0) {
      return Response.json(
        { error: "No valid markdown or image files found" },
        { status: 400 },
      );
    }

    // Calculate total size for validation
    const totalSize =
      files.reduce((sum, file) => sum + file.size, 0) +
      imagesMeta.reduce((s, i) => s + (i.size || 0), 0);
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB limit

    if (totalSize > maxSizeBytes) {
      return Response.json(
        { error: "Total file size exceeds 50MB limit" },
        { status: 400 },
      );
    }

    // Trigger the workflow
    const workflowUrl = `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/api/workflows/process-markdown-folder`;

    const workflowPayload: any = {
      userId,
      files,
    };
    if (contentType.includes("application/json")) {
      workflowPayload.imageFilesMeta = imagesMeta;
    }

    const workflowResponse = await qstashClient.publishJSON({
      url: workflowUrl,
      body: workflowPayload,
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(
      `Started processing ${markdownFiles.length} markdown files and ${imageFilesCount} images for user ${userId}`,
    );

    return Response.json({
      success: true,
      workflowId: workflowResponse.messageId,
      message: `Started processing ${markdownFiles.length} markdown files and ${imageFilesCount} images`,
      stats: {
        markdownFiles: markdownFiles.length,
        imageFiles: imageFilesCount,
        totalSize,
      },
    });
  } catch (error) {
    console.error("Error processing markdown folder:", error);

    Sentry.captureException(error, {
      tags: {
        action: "markdownFolderUpload",
        userId,
      },
    });

    return Response.json(
      { error: "Failed to process folder" },
      { status: 500 },
    );
  }
}
