// lib/workflows/process-upload.ts - Correct Upstash Workflow syntax
import { NextRequest } from "next/server";
import { serve } from "@upstash/workflow/nextjs";
import { WorkflowContext } from "@upstash/workflow";
import * as Sentry from "@sentry/nextjs";
import {
  downloadAndProcessFiles,
  createPageFromContent,
  generateFlashcards,
  processResources,
  cleanupTempFiles,
} from "./process-steps";

interface WorkflowInput {
  userId: string;
  fileName: string;
  fileSize: number;
  markdownCid: string;
  markdownAccessUrl: string;
  markdownAccessExpires: string;
  imageData: Array<{
    cid: string;
    name: string;
    size: number;
    isTemp: boolean;
    accessUrl: string;
    accessExpiresAt: string;
  }>;
  frontMatter?: Record<string, any> | null;
}

export const POST = async (req: NextRequest) => {
  const { POST: wf } = serve<WorkflowInput>(
    async (context: WorkflowContext<WorkflowInput>) => {
      const input = context.requestPayload;

      // Step 1: Download files and convert markdown to HTML with consistent node IDs
      const { html, imageContents, imgRefs, frontmatter } = await context.run(
        "download-and-process",
        async () => {
          try {
            return await downloadAndProcessFiles(input);
          } catch (error) {
            Sentry.captureException(error, {
              tags: {
                action: "downloadAndProcessFiles",
                fileName: input.fileName,
              },
              extra: { input },
            });
            throw error;
          }
        },
      );

      // Step 2: Create the page and handle images
      const { pageId, imagesUploaded, finalHtml } = await context.run(
        "create-page",
        async () => {
          try {
            return await createPageFromContent(
              input,
              html,
              imageContents,
              imgRefs,
            );
          } catch (error) {
            Sentry.captureException(error, {
              tags: {
                action: "createPageFromContent",
                fileName: input.fileName,
              },
              extra: { input },
            });
            throw error;
          }
        },
      );

      // Step 3: Generate flashcards from the page content
      const flashcardResults = await context.run(
        "generate-flashcards",
        async () => {
          try {
            return await generateFlashcards(input.userId, pageId, finalHtml);
          } catch (error) {
            Sentry.captureException(error, {
              tags: {
                action: "generateFlashcards",
                fileName: input.fileName,
                pageId,
              },
              extra: { input },
            });
            throw error;
          }
        },
      );

      // Step 4: Process frontmatter resources
      const resourcesCreated = await context.run(
        "process-resources",
        async () => {
          try {
            const frontMatterToProcess = frontmatter || input.frontMatter;
            if (!frontMatterToProcess) return 0;

            return await processResources(
              frontMatterToProcess,
              input.userId,
              pageId,
            );
          } catch (error) {
            Sentry.captureException(error, {
              tags: {
                action: "processResources",
                fileName: input.fileName,
                pageId,
              },
              extra: { input },
            });
            throw error;
          }
        },
      );

      // Step 5: Cleanup temp files
      await context.run("cleanup", async () => {
        try {
          await cleanupTempFiles(input);
        } catch (error) {
          Sentry.captureException(error, {
            tags: {
              action: "cleanupTempFiles",
              fileName: input.fileName,
            },
            extra: { input },
          });
          throw error;
        }
      });

      return {
        success: true,
        pageId,
        resourcesCreated,
        imagesUploaded,
        flashcards: flashcardResults,
        fileName: input.fileName,
      };
    },
    {
      baseUrl:
        "https://c095-2601-646-897f-a740-a1bb-525c-54b9-fbce.ngrok-free.app",

      failureFunction: async ({ context, failStatus, failResponse }) => {
        const input = context.requestPayload;

        Sentry.captureException(new Error("Workflow failed"), {
          tags: {
            action: "workflowFailure",
            fileName: input.fileName,
            status: failStatus,
          },
          extra: {
            input,
            failResponse,
          },
        });

        try {
          await cleanupTempFiles(input);
        } catch (cleanupError) {
          Sentry.captureException(cleanupError, {
            tags: {
              action: "cleanupAfterFailure",
              fileName: input.fileName,
            },
            extra: { input },
          });
        }
      },
    },
  );

  return wf(req);
};
