// app/api/workflows/obsidian-upload/route.ts - This file is now the workflow endpoint
// The workflow is defined in lib/workflows/process-upload.ts and served there
// This route simply re-exports it for organization

export { POST } from "~/lib/workflows/process-upload";
