// src/server/actions/notifications.ts
"use server";

import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";

export interface WorkflowCompleteData {
  workflowId: string;
  pagesCreated: number;
  pagesFailed: number;
  imagesUploaded: number;
  backlinksCreated: number;
  errors: string[];
}

/**
 * Create a workflow completion notification (success)
 */
export async function createWorkflowCompleteNotification(
  userId: string,
  data: WorkflowCompleteData,
) {
  try {
    const hasErrors = data.errors && data.errors.length > 0;
    
    const notification = await db
      .insert(notifications)
      .values({
        user_id: userId,
        event_type: "workflow_complete",
        notification_type: "creation",
        entity_type: "page",
        entity_id: data.workflowId,
        title: "Folder processing completed",
        message: hasErrors
          ? `Created ${data.pagesCreated} pages${data.imagesUploaded > 0 ? ` and uploaded ${data.imagesUploaded} images` : ''}, but ${data.pagesFailed} pages failed.`
          : `Successfully created ${data.pagesCreated} pages${data.imagesUploaded > 0 ? `, uploaded ${data.imagesUploaded} images` : ''}${data.backlinksCreated > 0 ? `, and generated ${data.backlinksCreated} backlinks` : ''}.`,
        context_data: {
          workflowId: data.workflowId,
          pagesCreated: data.pagesCreated,
          pagesFailed: data.pagesFailed,
          imagesUploaded: data.imagesUploaded,
          backlinksCreated: data.backlinksCreated,
          errors: data.errors,
          completedAt: new Date().toISOString(),
        },
      })
      .returning();

    return notification[0];
  } catch (error) {
    console.error("Error creating workflow complete notification:", error);
    throw error;
  }
}

/**
 * Create a workflow error notification (failure)
 */
export async function createWorkflowErrorNotification(
  userId: string,
  workflowId: string,
  error: string,
) {
  try {
    const notification = await db
      .insert(notifications)
      .values({
        user_id: userId,
        event_type: "workflow_error",
        notification_type: "info",
        entity_type: "page",
        entity_id: workflowId,
        title: "Folder processing failed",
        message: `Processing failed: ${error}`,
        context_data: {
          workflowId,
          error,
          failedAt: new Date().toISOString(),
        },
      })
      .returning();

    return notification[0];
  } catch (notificationError) {
    console.error("Error creating workflow error notification:", notificationError);
    throw notificationError;
  }
}