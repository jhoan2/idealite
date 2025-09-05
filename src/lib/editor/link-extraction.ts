// src/lib/editor/link-extraction.ts

interface TipTapNode {
  type?: string;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;
  attrs?: Record<string, any>;
}

interface TipTapMark {
  type: string;
  attrs?: {
    pageId?: string;
    isInternal?: boolean;
    [key: string]: any;
  };
}

export function extractLinksFromTipTapJSON(editorJSON: any): string[] {
  if (!editorJSON || typeof editorJSON !== "object") {
    return [];
  }

  const pageIds = new Set<string>();

  function traverseNode(node: TipTapNode): void {
    // Check if this node has marks with page links
    if (node.marks) {
      for (const mark of node.marks) {
        // First try the proper way with isInternal and pageId
        if (
          mark.type === "link" &&
          mark.attrs?.isInternal === true &&
          mark.attrs?.pageId &&
          typeof mark.attrs.pageId === "string"
        ) {
          pageIds.add(mark.attrs.pageId);
        }
        // Fallback: extract page ID from href if it's an internal workspace link
        else if (
          mark.type === "link" &&
          mark.attrs?.href &&
          typeof mark.attrs.href === "string" &&
          mark.attrs.href.includes("/workspace?pageId=")
        ) {
          const match = mark.attrs.href.match(/pageId=([a-f0-9-]+)/);
          if (match && match[1]) {
            // Basic UUID validation inline since we can't self-import
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(match[1])) {
              pageIds.add(match[1]);
            }
          }
        }
      }
    }

    // Recursively traverse child content
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        traverseNode(child);
      }
    }
  }

  // Start traversal from root content
  if (editorJSON.content && Array.isArray(editorJSON.content)) {
    for (const node of editorJSON.content) {
      traverseNode(node);
    }
  }

  return Array.from(pageIds);
}

export function validatePageId(pageId: string): boolean {
  // Basic UUID validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(pageId);
}
