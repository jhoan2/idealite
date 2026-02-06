import TurndownService from "turndown";

/**
 * Shared Turndown rules for Idealite.
 * These rules are used both for the public AI-readable blog (llms.txt)
 * and for the workspace editor (tiptap-markdown extension).
 */

export const IDEALITE_TURNDOWN_RULES: TurndownService.Rule[] = [
  // 1. Rule to handle internal links/mentions [[Page Title]]
  {
    filter: (node: HTMLElement) => {
      return (
        node.nodeName === "A" &&
        (node.getAttribute("data-page-id") !== null || node.classList.contains("mention"))
      );
    },
    replacement: (content: string) => {
      // Convert back to [[WikiLink]] format
      return `[[${content}]]`;
    },
  },
  // 2. Rule to strip data-node-id and other editor-specific attributes
  // Note: Turndown by default strips unknown attributes when converting to standard MD,
  // but we want to ensure the content remains clean.
  {
    filter: (node: HTMLElement) => {
      return node.hasAttribute("data-node-id");
    },
    replacement: (content: string, node: Node) => {
      // We just want the content of the node, without the node-id wrapping if it's a span/div,
      // or just return the content if it's a block-level node (Turndown handles the block tags)
      const element = node as HTMLElement;
      
      // If it's a simple container with an ID, just return its content
      if (element.nodeName === "SPAN" || element.nodeName === "DIV") {
        return content;
      }

      // For other nodes (P, H1, etc), Turndown's default rules will handle the tag,
      // we just need to make sure we don't interfere with the content.
      return content;
    },
  },
];

/**
 * Creates a pre-configured Turndown instance with Idealite rules.
 */
export function createIdealiteTurndown() {
  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  // Add our custom rules
  IDEALITE_TURNDOWN_RULES.forEach((rule, index) => {
    turndownService.addRule(`idealite-rule-${index}`, rule);
  });

  return turndownService;
}
