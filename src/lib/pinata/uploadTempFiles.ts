// lib/pinata-storage.ts - Updated to use correct Pinata SDK
import { PinataSDK } from "pinata";
import { v4 as uuidv4 } from "uuid";
import * as Sentry from "@sentry/nextjs";

// Initialize Pinata SDK
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY!,
});

export interface TempFile {
  cid: string;
  accessUrl: string; // Temporary access URL for Private IPFS
  size: number;
  name: string;
  isTemp: boolean;
  accessExpiresAt: Date;
}

export interface PublicFile {
  cid: string;
  publicUrl: string; // Direct public IPFS URL
  size: number;
  name: string;
  isTemp: false; // Always false for public uploads
}

// Upload file to Private IPFS (temporary storage)
export async function uploadTempFileToPinata(
  file: File | Buffer | ArrayBuffer,
  fileName: string,
  userId: string,
): Promise<TempFile> {
  try {
    // Convert to File if needed
    let fileToUpload: File;
    if (file instanceof File) {
      fileToUpload = file;
    } else if (file instanceof ArrayBuffer) {
      const blob = new Blob([file]);
      fileToUpload = new File([blob], fileName);
    } else {
      // Buffer
      const blob = new Blob([file]);
      fileToUpload = new File([blob], fileName);
    }

    // Upload to Private IPFS using SDK
    const upload = await pinata.upload.private
      .file(fileToUpload)
      .name(`temp-${uuidv4()}-${fileName}`)
      .keyvalues({
        userId,
        isTemporary: "true",
        uploadedAt: new Date().toISOString(),
        originalName: fileName,
      });

    // Create temporary access link (valid for 1 hour)
    const accessLinkExpiry = 3600; // 1 hour in seconds
    const accessLink = await pinata.gateways.private.createAccessLink({
      cid: upload.cid,
      expires: accessLinkExpiry,
    });

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + accessLinkExpiry);

    return {
      cid: upload.cid,
      accessUrl: accessLink,
      size: upload.size,
      name: fileName,
      isTemp: true,
      accessExpiresAt: expiresAt,
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: "uploadTempFileToPinata",
        fileName: fileName,
      },
    });
    throw new Error(
      `Private IPFS upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Upload multiple files to Private IPFS
export async function uploadTempFilesToPinata(
  files: { file: File | Buffer | ArrayBuffer; name: string }[],
  userId: string,
): Promise<TempFile[]> {
  // Upload files in parallel with concurrency control
  const chunkSize = 3; // Limit concurrent uploads to avoid rate limits
  const results: TempFile[] = [];

  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(({ file, name }) => uploadTempFileToPinata(file, name, userId)),
    );
    results.push(...chunkResults);
  }

  return results;
}

// Create fresh access link for private file (for background workers)
export async function createAccessLinkForPrivateFile(
  cid: string,
  expiresInSeconds = 3600,
): Promise<string> {
  try {
    const accessLink = await pinata.gateways.private.createAccessLink({
      cid,
      expires: expiresInSeconds,
    });

    return accessLink;
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: "createAccessLinkForPrivateFile",
        cid: cid,
      },
    });
    throw new Error(
      `Failed to create access link: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Download file from Private IPFS using access link
export async function downloadFileFromIPFS(
  cid: string,
  existingAccessUrl?: string,
): Promise<ArrayBuffer> {
  try {
    let accessUrl = existingAccessUrl;

    // Create new access link if not provided
    if (!accessUrl) {
      accessUrl = await createAccessLinkForPrivateFile(cid, 1800); // 30 minutes
    }
    const response = await fetch(accessUrl);

    if (!response.ok) {
      // If access link expired, try creating a new one
      if (response.status === 403 || response.status === 401) {
        accessUrl = await createAccessLinkForPrivateFile(cid, 1800);

        const retryResponse = await fetch(accessUrl);

        if (!retryResponse.ok) {
          throw new Error(
            `Failed to download after retry: ${retryResponse.status} ${retryResponse.statusText}`,
          );
        }

        return retryResponse.arrayBuffer();
      }

      throw new Error(
        `Failed to download file: ${response.status} ${response.statusText}`,
      );
    }

    return response.arrayBuffer();
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: "downloadFileFromIPFS",
        cid: cid,
      },
    });
    throw error;
  }
}

// Download text file from Private IPFS
export async function downloadTextFromIPFS(
  cid: string,
  existingAccessUrl?: string,
): Promise<string> {
  const arrayBuffer = await downloadFileFromIPFS(cid, existingAccessUrl);
  const text = new TextDecoder().decode(arrayBuffer);
  return text;
}

// Promote temporary file to permanent (move from Private to Public IPFS)
export async function promoteTempFileToPermanent(cid: string): Promise<string> {
  try {
    // First, download the file from Private IPFS
    const fileData = await downloadFileFromIPFS(cid);
    // Get file info to preserve metadata
    const fileInfo = await getFileInfo(cid);
    const originalName = fileInfo?.keyvalues?.originalName || "unknown";

    // Create File object
    const file = new File([fileData], originalName);

    // Upload to PUBLIC IPFS with permanent metadata using SDK
    const permanentUpload = await pinata.upload.public
      .file(file)
      .name(`permanent-${originalName}`)
      .keyvalues({
        isTemporary: "false",
        originalTempCid: cid,
        promotedAt: new Date().toISOString(),
      });

    return permanentUpload.cid;
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: "promoteTempFileToPermanent",
        cid: cid,
      },
    });
    throw new Error(
      `Failed to promote file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Clean up temporary files from Private IPFS using SDK
export async function cleanupTempFiles(cids: string[]): Promise<void> {
  if (cids.length === 0) return;

  try {
    // Use SDK to delete private files
    await pinata.files.private.delete(cids);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: "cleanupTempFiles",
        cids: cids.join(","),
      },
    });

    // Fallback: try deleting individually
    const cleanupPromises = cids.map(async (cid) => {
      try {
        await pinata.files.private.delete([cid]);
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            action: "cleanupTempFiles",
            cid: cid,
          },
        });
      }
    });

    await Promise.allSettled(cleanupPromises);
  }
}

// List and clean up old temporary files from Private IPFS using SDK
export async function cleanupOldTempFiles(
  olderThanHours = 24,
): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    // List private files with temporary metadata using SDK
    const response = await pinata.files.private.list().keyvalues({
      isTemporary: "true",
    });

    const oldFiles = response.files.filter((file: any) => {
      const uploadedAt = file.metadata?.keyValues?.uploadedAt;
      if (!uploadedAt) return false;

      const uploadDate = new Date(uploadedAt);
      return uploadDate < cutoffDate;
    });

    if (oldFiles.length > 0) {
      const cidsToCleanup = oldFiles.map((file: any) => file.cid);
      await cleanupTempFiles(cidsToCleanup);
    }

    return oldFiles.length;
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: "cleanupOldTempFiles",
      },
    });
    return 0;
  }
}

// Get file info from Private IPFS using SDK
export async function getFileInfo(cid: string) {
  try {
    const files = await pinata.files.private.list().cid(cid);
    return files.files[0] || null;
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: "getFileInfo",
        cid: cid,
      },
    });
    return null;
  }
}

// Upload file directly to Public IPFS (permanent storage)
export async function uploadFileToPublicIPFS(
  file: File | Buffer | ArrayBuffer,
  fileName: string,
  userId: string,
): Promise<PublicFile> {
  try {
    // Convert to File if needed
    let fileToUpload: File;
    if (file instanceof File) {
      fileToUpload = file;
    } else if (file instanceof ArrayBuffer) {
      const blob = new Blob([file]);
      fileToUpload = new File([blob], fileName);
    } else {
      // Buffer
      const blob = new Blob([file]);
      fileToUpload = new File([blob], fileName);
    }

    // Upload to Public IPFS using SDK
    const upload = await pinata.upload.public
      .file(fileToUpload)
      .name(`${uuidv4()}-${fileName}`)
      .keyvalues({
        userId,
        isTemporary: "false",
        uploadedAt: new Date().toISOString(),
        originalName: fileName,
        source: "obsidian-plugin",
      });

    // Generate public URL
    const publicUrl = `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${upload.cid}`;

    return {
      cid: upload.cid,
      publicUrl,
      size: upload.size,
      name: fileName,
      isTemp: false,
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: "uploadFileToPublicIPFS",
        fileName: fileName,
      },
    });
    throw new Error(
      `Public IPFS upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Upload multiple files to Public IPFS
export async function uploadFilesToPublicIPFS(
  files: { file: File | Buffer | ArrayBuffer; name: string }[],
  userId: string,
): Promise<PublicFile[]> {
  // Upload files in parallel with concurrency control
  const chunkSize = 3; // Limit concurrent uploads to avoid rate limits
  const results: PublicFile[] = [];

  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(({ file, name }) => uploadFileToPublicIPFS(file, name, userId)),
    );
    results.push(...chunkResults);
  }

  return results;
}
