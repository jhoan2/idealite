// src/app/api/workflows/auto-archive/route.ts
// Proper QStash authentication using signatures
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { runAutoArchiveWorkflow } from "~/server/actions/autoArchive";

// This automatically verifies the QStash signature
export const POST = verifySignatureAppRouter(async (request: Request) => {
  try {
    // At this point, we know the request is authentic from QStash
    const results = await runAutoArchiveWorkflow();

    return new Response(
      JSON.stringify({
        success: true,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Auto-archive workflow failed:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
});
