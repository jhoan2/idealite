// app/api/obsidian/test-workflow/route.ts - Pure Workflow version
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { Client } from "@upstash/workflow";
import { validateCredential } from "~/lib/integrations/validate";
import {
  uploadTempFileToPinata,
  uploadTempFilesToPinata,
} from "~/lib/pinata/uploadTempFiles";
import * as Sentry from "@sentry/nextjs";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Authenticate user by API token
async function authenticateUser(
  authHeader: string | null,
): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const credential = await validateCredential("obsidian", token);
    if (!credential) {
      console.log("No valid credential found for token");
      return null;
    }
    return credential.user_id;
  } catch (error) {
    console.error("Error authenticating user:", error);
    return null;
  }
}

export const OPTIONS = async (req: NextRequest) => {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
};

export const POST = async (req: NextRequest) => {
  try {
    // Authenticate the user
    const userId = await authenticateUser(req.headers.get("Authorization"));
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing API token" },
        { status: 401, headers: corsHeaders },
      );
    }

    const form = await req.formData();
    const mdFile = form.get("markdown") as File;
    const frontMatterJson = form.get("frontMatter") as string;
    const imageFiles = form.getAll("images[]") as File[];

    if (!mdFile) {
      return NextResponse.json(
        { error: "markdown missing" },
        { status: 400, headers: corsHeaders },
      );
    }

    // Parse front matter
    let frontMatter: Record<string, any> | null = null;
    if (frontMatterJson) {
      try {
        frontMatter = JSON.parse(frontMatterJson);
      } catch (error) {
        console.error("Error parsing front matter JSON:", error);
      }
    }

    const markdownUpload = await uploadTempFileToPinata(
      mdFile,
      mdFile.name,
      userId,
    );

    const imageUploads = await uploadTempFilesToPinata(
      imageFiles.map((file) => ({
        file,
        name: file.name,
      })),
      userId,
    );

    // Start workflow with all data
    const client = new Client({
      token: process.env.QSTASH_TOKEN!,
    });

    const { workflowRunId } = await client.trigger({
      //   url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/workflow`,
      url: `https://c095-2601-646-897f-a740-a1bb-525c-54b9-fbce.ngrok-free.app/api/workflows/obsidian-upload`,
      body: {
        userId,
        fileName: mdFile.name,
        fileSize: mdFile.size,
        markdownCid: markdownUpload.cid,
        markdownAccessUrl: markdownUpload.accessUrl,
        markdownAccessExpires: markdownUpload.accessExpiresAt.toISOString(),
        imageData: imageUploads.map((upload) => ({
          cid: upload.cid,
          name: upload.name,
          size: upload.size,
          isTemp: upload.isTemp,
          accessUrl: upload.accessUrl,
          accessExpiresAt: upload.accessExpiresAt.toISOString(),
        })),
        frontMatter,
      },
    });

    // Return workflow information
    return NextResponse.json(
      {
        success: true,
        workflowRunId,
        status: "RUNNING",
        message: "Files uploaded to Private IPFS, workflow started",
        filesUploaded: {
          markdown: {
            cid: markdownUpload.cid,
            size: markdownUpload.size,
            accessExpiresAt: markdownUpload.accessExpiresAt,
          },
          images: imageUploads.map((img) => ({
            cid: img.cid,
            name: img.name,
            size: img.size,
            accessExpiresAt: img.accessExpiresAt,
          })),
        },
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: "obsidian-test-workflow",
      },
    });
    return NextResponse.json(
      {
        error: "internal error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders },
    );
  }
};
