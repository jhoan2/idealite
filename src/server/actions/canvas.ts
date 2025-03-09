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
import { auth } from "~/app/auth";
import { updateStorageUsed } from "~/server/actions/storage";
import * as Sentry from "@sentry/nextjs";

type AssetMetadata = {
  id: string;
  src: string;
  type: string;
  ipfsHash: string | null;
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
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = session.user.id;

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
        // Extract IPFS hashes from old snapshot
        // This depends on how your snapshot structure works
        if (oldSnapshot.store?.assets) {
          oldAssetMetadata = Object.values(oldSnapshot.store.assets).map(
            (asset: any) => {
              const src = asset.props?.src;
              let ipfsHash = null;

              if (
                src &&
                typeof src === "string" &&
                src.includes("mypinata.cloud/ipfs/")
              ) {
                const matches = src.match(/ipfs\/([^/?#]+)/);
                ipfsHash = matches?.[1] || null;
              }

              return {
                id: asset.id,
                src: asset.props?.src || "",
                type: asset.type || "",
                ipfsHash,
                meta: asset.meta,
              };
            },
          );
        }
      } catch (e) {
        console.error("Failed to parse existing canvas data", e);
      }
    }

    // 5. Get all assets with IPFS hashes that are currently used on the canvas
    const usedAssetsWithIpfs = assetMetadata.filter((a) => a.ipfsHash);
    const usedIpfsHashes = usedAssetsWithIpfs
      .map((a) => a.ipfsHash)
      .filter(Boolean) as string[];

    // 6. Get existing cards for this page
    const existingCards = await db.query.cards.findMany({
      where: and(eq(cards.page_id, pageId), eq(cards.user_id, userId)),
    });

    const existingIpfsHashes = existingCards.map((card) => card.image_cid);

    // 7. Find which assets need cards created (used on canvas but no card exists)
    const ipfsHashesNeedingCards = usedIpfsHashes.filter(
      (hash) => !existingIpfsHashes.includes(hash),
    );

    // 8. Find which cards need deletion (card exists but asset not used on canvas)
    const ipfsHashesToDelete = existingIpfsHashes.filter(
      (hash) => !usedIpfsHashes.includes(hash as string),
    );

    let createdCount = 0;
    let deletedCount = 0;

    // Use a single transaction for all database operations
    await db.transaction(async (tx) => {
      // Create cards for new assets (bulk insert)
      if (ipfsHashesNeedingCards.length > 0) {
        const newCards = ipfsHashesNeedingCards
          .map((ipfsHash) => {
            const asset = usedAssetsWithIpfs.find(
              (a) => a.ipfsHash === ipfsHash,
            );
            return {
              user_id: userId,
              page_id: pageId,
              image_cid: ipfsHash,
              prompt: asset?.meta?.prompt || "",
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
      if (ipfsHashesToDelete.length > 0) {
        await tx
          .delete(cards)
          .where(
            and(
              eq(cards.user_id, userId),
              eq(cards.page_id, pageId),
              inArray(cards.image_cid, ipfsHashesToDelete as string[]),
            ),
          );
        deletedCount = ipfsHashesToDelete.length;
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

    // 10. Delete images from Pinata and update storage quota
    if (ipfsHashesToDelete.length > 0) {
      // Find the image records for these IPFS hashes
      const imagesToDelete = await db.query.images.findMany({
        where: inArray(images.url, ipfsHashesToDelete as string[]),
      });

      // Parallel deletion of images from Pinata
      if (imagesToDelete.length > 0) {
        const deletionPromises = imagesToDelete.map(async (image) => {
          try {
            // Delete from Pinata
            const pinataRes = await fetch(
              `https://api.pinata.cloud/pinning/unpin/${image.url}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${process.env.PINATA_JWT}`,
                },
              },
            );

            if (pinataRes.ok || pinataRes.status === 404) {
              // Update user's storage quota and delete image record
              await updateStorageUsed(userId, -image.size);
              await db.delete(images).where(eq(images.id, image.id));
              return true;
            }
            return false;
          } catch (error) {
            console.error(`Error deleting image ${image.id}:`, error);
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
          // Delete from Pinata
          const pinataRes = await fetch(
            `https://api.pinata.cloud/pinning/unpin/${oldCanvasImageCid}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${process.env.PINATA_JWT}`,
              },
            },
          );

          if (!pinataRes.ok && pinataRes.status !== 404) {
            Sentry.captureException(
              `Failed to delete old canvas image ${oldCanvasImageCid} from Pinata`,
            );
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
    Sentry.captureException(error);
    return {
      success: false,
      error: "Failed to save canvas data",
    };
  }
}
