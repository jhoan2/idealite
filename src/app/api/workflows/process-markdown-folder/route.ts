import { NextRequest } from "next/server";
import { serve } from "@upstash/workflow/nextjs";
import { WorkflowContext } from "@upstash/workflow";
import * as Sentry from "@sentry/nextjs";
import { v4 as uuidv4 } from "uuid";
import { createPageWithRelationsFromWebhook } from "~/server/actions/page";
import {
  createWorkflowCompleteNotification,
  createWorkflowErrorNotification,
} from "~/server/actions/notifications";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "~/server/db";
import { images, users, pages, users_pages } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { updateStorageUsedWorkflow } from "~/server/actions/storage";
import { processMarkdownForTiptap } from "~/lib/markdown/markdownToTiptapHTML";

// Configure Cloudflare R2 client
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

function getPublicUrlForKey(key: string): string {
  const base =
    process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL || "https://idealite.xyz";
  return `${base}/${key}`;
}

interface FileData {
  name: string;
  content: string;
  type: "markdown" | "image";
  size: number;
  relativePath: string;
}

interface WorkflowInput {
  userId: string;
  files: FileData[];
  workflowId?: string;
  imageFilesMeta?: Array<{
    name: string;
    size: number;
    relativePath: string;
    key: string;
    publicUrl: string;
  }>;
}

interface ProcessedFile {
  name: string;
  pageId?: string;
  error?: string;
}

interface ImageUploadResult {
  success: boolean;
  relativePath: string;
  publicUrl?: string;
  error?: string;
}

// Upload image to Cloudflare R2 and create database record
async function uploadImageToR2(
  imageFile: FileData,
  userId: string,
): Promise<ImageUploadResult> {
  try {
    const requiredEnvVars = [
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_R2_ACCESS_KEY_ID",
      "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
      "CLOUDFLARE_R2_BUCKET_NAME",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );
    if (missingVars.length > 0) {
      return {
        success: false,
        relativePath: imageFile.relativePath || imageFile.name,
        error: `Missing environment variables: ${missingVars.join(", ")}`,
      };
    }

    const [user] = await db
      .select({
        id: users.id,
        storageUsed: users.storage_used,
        storageLimit: users.storage_limit,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return {
        success: false,
        relativePath: imageFile.relativePath,
        error: "User not found",
      };
    }

    if (user.storageUsed + imageFile.size > user.storageLimit) {
      return {
        success: false,
        relativePath: imageFile.relativePath,
        error: "Storage limit exceeded",
      };
    }

    const buffer = Buffer.from(imageFile.content, "base64");
    const fileExtension = imageFile.name.split(".").pop() || "jpg";
    const uniqueKey = `images/${userId}/${uuidv4()}.${fileExtension}`;

    let contentType = "image/jpeg";
    const ext = fileExtension.toLowerCase();
    if (ext === "png") contentType = "image/png";
    else if (ext === "gif") contentType = "image/gif";
    else if (ext === "webp") contentType = "image/webp";
    else if (ext === "svg") contentType = "image/svg+xml";

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: uniqueKey,
      Body: buffer,
      ContentType: contentType,
      ContentLength: imageFile.size,
      Metadata: {
        userId: userId,
        originalName: imageFile.name,
        uploadedAt: new Date().toISOString(),
        relativePath: imageFile.relativePath || imageFile.name,
      },
    });

    const uploadResult = await r2Client.send(uploadCommand);

    if (!uploadResult.ETag) {
      return {
        success: false,
        relativePath: imageFile.relativePath,
        error: "Failed to upload to Cloudflare R2 - no ETag returned",
      };
    }

    const publicUrl = getPublicUrlForKey(uniqueKey);

    await db.insert(images).values({
      user_id: user.id,
      filename: imageFile.name,
      url: uniqueKey,
      size: imageFile.size,
    });

    await updateStorageUsedWorkflow(user.id, imageFile.size);

    console.log(
      `✓ Successfully uploaded image: ${imageFile.name} -> ${publicUrl}`,
    );

    return {
      success: true,
      relativePath: imageFile.relativePath,
      publicUrl,
    };
  } catch (error) {
    console.error(`✗ Failed to upload image ${imageFile.name}:`, error);

    let errorMessage = "Unknown upload error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      relativePath: imageFile.relativePath,
      error: errorMessage,
    };
  }
}

// Template replacement strategy: Replace image URLs AND page links in markdown before HTML conversion
function replaceImageUrlsAndPageLinksInMarkdown(
  markdown: string,
  imageUrlMapping: Record<string, string>,
  pageUrlMapping: Record<string, { id: string; title: string }>,
): string {
  let processedMarkdown = markdown;

  // Step 1: Convert wiki-links to standard markdown
  const wikiImageRegex = /!\[\[([^\]]+)\]\]/g;
  const wikiMatches = [...markdown.matchAll(wikiImageRegex)];

  wikiMatches.forEach((match) => {
    const fullMatch = match[0];
    const filename = match[1];
    const standardMarkdown = `![${filename}](${filename})`;
    processedMarkdown = processedMarkdown.replace(fullMatch, standardMarkdown);
  });

  // Step 2: Find all image references and replace with actual URLs
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const imageMatches = [...processedMarkdown.matchAll(imageRegex)];

  imageMatches.forEach((match) => {
    const fullMatch = match[0];
    const altText = match[1] || "";
    const originalSrc = match[2];

    if (!originalSrc) {
      return;
    }

    const possibleKeys = [
      originalSrc,
      decodeURIComponent(originalSrc),
      originalSrc.replace(/^<|>$/g, ""),
      decodeURIComponent(originalSrc.replace(/^<|>$/g, "")),
      originalSrc.split("/").pop() || originalSrc,
      decodeURIComponent(originalSrc.split("/").pop() || originalSrc),
    ];

    let foundUrl = null;
    for (const key of possibleKeys) {
      if (imageUrlMapping[key]) {
        foundUrl = imageUrlMapping[key];
        break;
      }
    }

    if (foundUrl) {
      const replacementMarkdown = `![${altText}](${foundUrl})`;
      processedMarkdown = processedMarkdown.replace(
        fullMatch,
        replacementMarkdown,
      );
    }
  });

  // Step 3: Replace page links [[Page Name]] with proper HTML
  const pageLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  const pageLinkMatches = [...processedMarkdown.matchAll(pageLinkRegex)];

  pageLinkMatches.forEach((match) => {
    const fullMatch = match[0];
    const pageName = match[1]?.trim();
    const displayText = match[2]?.trim();

    if (!pageName) return;

    const pageData = pageUrlMapping[pageName];
    if (pageData) {
      const displayName = displayText || pageName;
      // Include data-page-id so we can identify internal links for previews
      const htmlLink = `<a href="/workspace?pageId=${pageData.id}" data-page-id="${pageData.id}">${displayName}</a>`;

      processedMarkdown = processedMarkdown.replace(fullMatch, htmlLink);
    }
  });

  return processedMarkdown;
}

// Simple markdown to HTML conversion
async function convertMarkdownToHTML(markdown: string): Promise<string> {
  const { html } = await processMarkdownForTiptap(markdown);
  return html;
}

// Process markdown files using template replacement strategy
async function processMarkdownFiles(
  markdownFiles: FileData[],
  internalUserId: string,
  imagesMeta: Array<{
    name: string;
    size: number;
    relativePath: string;
    key: string;
    publicUrl: string;
  }> = [],
): Promise<ProcessedFile[]> {
  const processedFiles: ProcessedFile[] = [];

  // Build image URL mapping
  const imageUrlMapping: Record<string, string> = {};
  for (const imgMeta of imagesMeta) {
    imageUrlMapping[imgMeta.name] = imgMeta.publicUrl;
    imageUrlMapping[imgMeta.relativePath] = imgMeta.publicUrl;
    imageUrlMapping[encodeURIComponent(imgMeta.name)] = imgMeta.publicUrl;
    imageUrlMapping[encodeURIComponent(imgMeta.relativePath)] =
      imgMeta.publicUrl;
    const basename = imgMeta.relativePath.split("/").pop();
    if (basename && basename !== imgMeta.relativePath) {
      imageUrlMapping[basename] = imgMeta.publicUrl;
      imageUrlMapping[encodeURIComponent(basename)] = imgMeta.publicUrl;
    }
  }

  // Get all user's existing pages for link resolution
  const userPages = await db
    .select({
      id: pages.id,
      title: pages.title,
    })
    .from(pages)
    .innerJoin(users_pages, eq(users_pages.page_id, pages.id))
    .where(
      and(eq(users_pages.user_id, internalUserId), eq(pages.deleted, false)),
    );

  const pageUrlMapping: Record<string, { id: string; title: string }> = {};
  userPages.forEach((page) => {
    pageUrlMapping[page.title] = { id: page.id, title: page.title };
  });

  for (const file of markdownFiles) {
    try {
      console.log(`Processing file: ${file.name}`);

      // Step 1: Replace BOTH image URLs AND page links using the combined function
      const markdownWithReplacements = replaceImageUrlsAndPageLinksInMarkdown(
        file.content,
        imageUrlMapping,
        pageUrlMapping,
      );

      // Step 2: Convert to HTML
      const finalHtml = await convertMarkdownToHTML(markdownWithReplacements);

      // Create page
      const fileName = file.name.split("/").pop() || file.name;
      const title = fileName.replace(/\.[^/.]+$/, "");

      const pageResult = await createPageWithRelationsFromWebhook({
        title: title,
        content: finalHtml,
        content_type: "page",
        user_id: internalUserId,
        primary_tag_id: undefined,
      });

      if (pageResult.success) {
        const page = pageResult as { success: true; page: { id: string } };
        processedFiles.push({
          name: file.name,
          pageId: page.page.id,
        });

        // Update the page mapping for subsequent files
        pageUrlMapping[title] = { id: page.page.id, title: title };
        console.log(`✓ Successfully created page for ${file.name}`);
      } else {
        const errorMsg = (pageResult as any).error || "Failed to create page";
        processedFiles.push({
          name: file.name,
          error: errorMsg,
        });
        console.log(`✗ Failed to create page for ${file.name}: ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      processedFiles.push({
        name: file.name,
        error: errorMsg,
      });
      console.error(`Error processing ${file.name}:`, error);
    }
  }

  return processedFiles;
}

export const POST = async (req: NextRequest) => {
  const { POST: wf } = serve<WorkflowInput>(
    async (context: WorkflowContext<WorkflowInput>) => {
      const input = context.requestPayload;
      const { userId, files } = input;

      const workflowId = input.workflowId || uuidv4();

      const userRow = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId));
      if (userRow.length === 0) {
        throw new Error(`User not found for id: ${userId}`);
      }
      const internalUserId = userId;

      const markdownFiles = files.filter((f) => f.type === "markdown");
      const imageFiles = files.filter((f) => f.type === "image");

      console.log(
        `Workflow started: ${markdownFiles.length} markdown files, ${imageFiles.length} image files`,
      );

      let uploadedImagesCount = 0;
      const imagesMeta = input.imageFilesMeta || [];

      // Handle pre-uploaded images
      if (imagesMeta.length > 0) {
        console.log(`Recording ${imagesMeta.length} pre-uploaded images`);
        for (const m of imagesMeta) {
          try {
            await db.insert(images).values({
              user_id: internalUserId,
              filename: m.name,
              url: m.key,
              size: m.size,
            });
            await updateStorageUsedWorkflow(internalUserId, m.size);
            uploadedImagesCount++;
          } catch (e) {
            console.error(
              `Failed to record pre-uploaded image ${m.relativePath}:`,
              e,
            );
            Sentry.captureException(e);
          }
        }
      }

      // Upload images if they're part of the payload
      if (imageFiles.length > 0) {
        console.log(`Uploading ${imageFiles.length} images`);

        const imageUploadResults = await context.run(
          "upload-images",
          async () => {
            const results: ImageUploadResult[] = [];
            for (const imageFile of imageFiles) {
              const result = await uploadImageToR2(imageFile, userId);
              results.push(result);

              if (result.success && result.publicUrl) {
                uploadedImagesCount++;
                console.log(`✓ Image uploaded: ${imageFile.name}`);
              } else {
                console.error(
                  `✗ Image upload failed: ${imageFile.name} - ${result.error}`,
                );
              }
            }
            return results;
          },
        );

        // Build imagesMeta from upload results
        for (const imageFile of imageFiles) {
          const uploadResult = imageUploadResults.find(
            (r) => r.relativePath === imageFile.relativePath,
          );
          if (uploadResult && uploadResult.success && uploadResult.publicUrl) {
            imagesMeta.push({
              name: imageFile.name,
              size: imageFile.size,
              relativePath: imageFile.relativePath,
              key: `images/${userId}/${uuidv4()}.${imageFile.name.split(".").pop()}`,
              publicUrl: uploadResult.publicUrl,
            });
          }
        }

        console.log(`✓ Successfully uploaded ${uploadedImagesCount} images`);
      }

      // Process markdown files using template replacement strategy
      const processedFiles = await context.run("process-markdown", async () => {
        try {
          return await processMarkdownFiles(
            markdownFiles,
            internalUserId,
            imagesMeta,
          );
        } catch (error) {
          await createWorkflowErrorNotification(
            userId,
            workflowId,
            error instanceof Error
              ? error.message
              : "Failed to process markdown files",
          );
          Sentry.captureException(error, {
            tags: { action: "processMarkdown", userId },
            extra: { markdownCount: markdownFiles.length },
          });
          throw error;
        }
      });

      const successfulPages = processedFiles.filter((f) => f.pageId).length;
      const failedPages = processedFiles.filter((f) => f.error).length;

      const pageErrors = processedFiles
        .filter((f) => f.error)
        .map((f) => `Page "${f.name}": ${f.error}`);

      const allErrors = [...pageErrors];

      console.log(
        `Workflow completed: ${successfulPages} pages created, ${failedPages} failed, ${uploadedImagesCount} images uploaded`,
      );

      await createWorkflowCompleteNotification(userId, {
        workflowId,
        pagesCreated: successfulPages,
        pagesFailed: failedPages,
        imagesUploaded: uploadedImagesCount,
        backlinksCreated: 0,
        errors: allErrors,
      });

      return {
        success: true,
        pagesCreated: successfulPages,
        pagesFailed: failedPages,
        imagesUploaded: uploadedImagesCount,
        backlinksCreated: 0,
        errors: allErrors,
      };
    },
    {
      baseUrl: process.env.NEXT_PUBLIC_DEPLOYMENT_URL,

      failureFunction: async ({ context, failStatus, failResponse }) => {
        const input = context.requestPayload;
        const workflowId = input.workflowId || "unknown";

        try {
          await createWorkflowErrorNotification(
            input.userId,
            workflowId,
            `Workflow failed with status: ${failStatus}`,
          );
        } catch (notificationError) {
          console.error(
            "Failed to create workflow failure notification:",
            notificationError,
          );
        }

        Sentry.captureException(
          new Error("Markdown folder processing workflow failed"),
          {
            tags: {
              action: "workflowFailure",
              status: failStatus,
              userId: input.userId,
            },
            extra: {
              input,
              failResponse,
              fileCount: input.files.length,
            },
          },
        );
      },
    },
  );

  return wf(req);
};

export const GET = POST;
