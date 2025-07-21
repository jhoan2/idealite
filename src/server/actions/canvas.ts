"use server";

import { db } from "~/server/db";
import {
  pages,
  images,
  cards,
  users_pages,
  cards_tags,
} from "~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updateStorageUsed } from "~/server/actions/storage";
import * as Sentry from "@sentry/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Configure Cloudflare R2 client
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

type AssetMetadata = {
  id: string;
  src: string;
  type: string;
  r2Key: string | null;
  meta: any;
};

export async function saveCanvasData(
  pageId: string,
  snapshot: any,
  assetMetadata: AssetMetadata[],
  canvasImageCid: string | null,
  tagIds: string[] = [],
) {
  try {
    // 1. Auth check
    const user = await currentUser();
    const userId = user?.externalId;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Fetch the current page to get existing canvas data
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
    });

    if (!page) {
      return { success: false, error: "Page not found" };
    }

    // 3. Check user has access to this page
    const hasAccess = await db.query.users_pages.findFirst({
      where: and(
        eq(users_pages.user_id, userId),
        eq(users_pages.page_id, pageId),
      ),
    });

    if (!hasAccess) {
      return { success: false, error: "No access to this page" };
    }

    // Store the old canvas image CID for deletion later
    const oldCanvasImageCid = page.canvas_image_cid;

    // 4. Get old asset data from previous snapshot
    let oldAssetMetadata: AssetMetadata[] = [];
    if (page.content && page.content_type === "canvas") {
      try {
        const oldSnapshot = JSON.parse(page.content);
        // Extract R2 keys from old snapshot
        if (oldSnapshot.store?.assets) {
          oldAssetMetadata = Object.values(oldSnapshot.store.assets).map(
            (asset: any) => {
              const src = asset.props?.src;
              let r2Key = null;

              if (
                src &&
                typeof src === "string" &&
                src.includes("idealite.xyz/")
              ) {
                // Extract R2 key from URL like https://idealite.xyz/images/userId/uuid.ext
                const matches = src.match(/idealite\.xyz\/(.+)$/);
                r2Key = matches?.[1] || null;
              }

              return {
                id: asset.id,
                src: asset.props?.src || "",
                type: asset.type || "",
                r2Key,
                meta: asset.meta,
              };
            },
          );
        }
      } catch (e) {
        console.error("Failed to parse existing canvas data", e);
      }
    }

    // 5. Get all assets with R2 keys that are currently used on the canvas
    const usedAssetsWithR2 = assetMetadata.filter((a) => a.r2Key);
    const usedR2Keys = usedAssetsWithR2
      .map((a) => a.r2Key)
      .filter(Boolean) as string[];

    // 6. Get existing cards for this page
    const existingCards = await db.query.cards.findMany({
      where: and(eq(cards.page_id, pageId), eq(cards.user_id, userId)),
    });

    const existingR2Keys = existingCards.map((card) => card.image_cid);

    // 7. Find which assets need cards created (used on canvas but no card exists)
    const r2KeysNeedingCards = usedR2Keys.filter(
      (key) => !existingR2Keys.includes(key),
    );

    // 8. Find which cards need deletion (card exists but asset not used on canvas)
    const r2KeysToDelete = existingR2Keys.filter(
      (key) => !usedR2Keys.includes(key as string),
    );

    let createdCount = 0;
    let deletedCount = 0;

    // Use a single transaction for all database operations
    await db.transaction(async (tx) => {
      // Create cards for new assets (bulk insert)
      if (r2KeysNeedingCards.length > 0) {
        const newCards = r2KeysNeedingCards
          .map((r2Key) => {
            const asset = usedAssetsWithR2.find((a) => a.r2Key === r2Key);
            return {
              user_id: userId,
              page_id: pageId,
              image_cid: r2Key,
              description: asset?.meta?.description || "",
            };
          })
          .filter(Boolean);

        // Insert cards and get their IDs
        const insertedCards = await tx
          .insert(cards)
          .values(newCards)
          .returning({
            id: cards.id,
          });
        createdCount = newCards.length;

        // Create card-tag relations for each new card
        if (tagIds.length > 0 && insertedCards.length > 0) {
          const cardTagRelations = [];

          // Create card-tag relations for all cards with all tags
          for (const card of insertedCards) {
            for (const tagId of tagIds) {
              cardTagRelations.push({
                card_id: card.id,
                tag_id: tagId,
              });
            }
          }

          // Bulk insert all card-tag relations
          if (cardTagRelations.length > 0) {
            await tx.insert(cards_tags).values(cardTagRelations);
          }
        }
      }

      // Delete cards in bulk
      if (r2KeysToDelete.length > 0) {
        await tx
          .delete(cards)
          .where(
            and(
              eq(cards.user_id, userId),
              eq(cards.page_id, pageId),
              inArray(cards.image_cid, r2KeysToDelete as string[]),
            ),
          );
        deletedCount = r2KeysToDelete.length;
      }

      // Update page with new snapshot
      await tx
        .update(pages)
        .set({
          content: JSON.stringify(snapshot),
          content_type: "canvas",
          updated_at: new Date(),
          canvas_image_cid: canvasImageCid,
        })
        .where(eq(pages.id, pageId));
    });

    // 10. Delete images from R2 and update storage quota
    if (r2KeysToDelete.length > 0) {
      // Find the image records for these R2 keys
      const imagesToDelete = await db.query.images.findMany({
        where: inArray(images.url, r2KeysToDelete as string[]),
      });

      // Parallel deletion of images from R2
      if (imagesToDelete.length > 0) {
        const deletionPromises = imagesToDelete.map(async (image) => {
          try {
            // Delete from Cloudflare R2
            const deleteCommand = new DeleteObjectCommand({
              Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
              Key: image.url, // The R2 key is stored in the url field
            });

            await r2Client.send(deleteCommand);

            // Update user's storage quota and delete image record
            await updateStorageUsed(userId, -image.size);
            await db.delete(images).where(eq(images.id, image.id));
            return true;
          } catch (error) {
            console.error(`Error deleting image ${image.id}:`, error);
            Sentry.captureException(error, {
              extra: {
                imageId: image.id,
                r2Key: image.url,
              },
            });
            return false;
          }
        });

        // Wait for all deletion operations to complete
        await Promise.all(deletionPromises);
      }
    }

    // Delete the old canvas image if it exists and differs from the new one
    if (oldCanvasImageCid && oldCanvasImageCid !== canvasImageCid) {
      try {
        // Find the image record for the old CID
        const oldImage = await db.query.images.findFirst({
          where: eq(images.url, oldCanvasImageCid),
        });

        if (oldImage) {
          // Delete from Cloudflare R2
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            Key: oldCanvasImageCid,
          });

          try {
            await r2Client.send(deleteCommand);
          } catch (r2Error) {
            console.error(
              "Failed to delete old canvas image from R2:",
              r2Error,
            );
            Sentry.captureException(r2Error, {
              extra: {
                r2Key: oldCanvasImageCid,
              },
            });
          }

          // Update user's storage quota
          await updateStorageUsed(userId, -oldImage.size);

          // Delete the image record
          await db.delete(images).where(eq(images.id, oldImage.id));
        }
      } catch (error) {
        console.error(
          `Error deleting old canvas image ${oldCanvasImageCid}:`,
          error,
        );
        // Continue with the save process even if deleting the old image fails
      }
    }

    // 12. Revalidate the page path
    revalidatePath(`/workspace/${pageId}`);

    return {
      success: true,
      created: createdCount,
      deleted: deletedCount,
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        feature: "canvas",
        source: "save_canvas_data",
      },
    });
    return {
      success: false,
      error: "Failed to save canvas data",
    };
  }
}
