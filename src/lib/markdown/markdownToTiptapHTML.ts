// lib/markdown/markdownToTiptapHTML.ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { v4 as uuidv4 } from "uuid";
import type { Element, Root } from "hast";

/**
 * Convert markdown to HTML with data-node-id attributes that match TipTap extensions
 * This ensures consistency between editor-created content and imported markdown
 */
export async function convertMarkdownToTiptapHTML(
  markdown: string,
): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(addConsistentNodeIds) // Add node IDs matching TipTap extensions
    .use(rehypeStringify, { allowDangerousHtml: true });

  const result = await processor.process(markdown);
  return String(result);
}

/**
 * Rehype plugin that adds node IDs to the EXACT same elements as your TipTap extensions
 * Matches: ParagraphWithId, HeadingWithId, ListItemWithId, BlockquoteWithId, CodeBlockWithId, ImageWithId
 */
function addConsistentNodeIds() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (!node.properties) {
        node.properties = {};
      }

      // Add node IDs to elements that match your TipTap extensions exactly
      switch (node.tagName.toLowerCase()) {
        case "p":
          // Matches ParagraphWithId
          node.properties["dataNodeId"] = uuidv4();
          break;

        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          // Matches HeadingWithId
          node.properties["dataNodeId"] = uuidv4();
          break;

        case "li":
          // Matches ListItemWithId
          node.properties["dataNodeId"] = uuidv4();
          break;

        case "blockquote":
          // Matches BlockquoteWithId
          node.properties["dataNodeId"] = uuidv4();
          break;

        case "pre":
          // Check if this is a code block (pre > code structure)
          const codeChild = node.children.find(
            (child) => child.type === "element" && child.tagName === "code",
          );
          if (codeChild) {
            // Matches CodeBlockWithId
            node.properties["dataNodeId"] = uuidv4();
          }
          break;

        case "img":
          // Matches ImageWithId
          node.properties["dataNodeId"] = uuidv4();
          // Also add id attribute like your ImageWithId extension does
          node.properties["id"] = node.properties["dataNodeId"];
          break;

        // Don't add node IDs to other elements (ul, ol, etc.) as they're containers
        // Only the actual content elements get IDs, matching TipTap behavior
        default:
          break;
      }
    });
  };
}

/**
 * Process complete markdown with frontmatter, returning TipTap-compatible HTML
 */
export async function processMarkdownForTiptap(
  markdownContent: string,
): Promise<{
  html: string;
  frontmatter?: Record<string, any>;
  title?: string;
  tags?: string[];
}> {
  // Extract frontmatter if present
  let frontmatter: Record<string, any> | undefined;
  let content = markdownContent;

  const frontmatterMatch = markdownContent.match(
    /^---\n([\s\S]*?)\n---\n([\s\S]*)$/,
  );
  if (frontmatterMatch) {
    try {
      const yamlContent = frontmatterMatch[1] ?? "";
      frontmatter = parseSimpleYaml(yamlContent);
      content = frontmatterMatch[2] ?? "";
    } catch (error) {
      console.warn("Failed to parse frontmatter:", error);
    }
  }

  // Convert markdown to TipTap-compatible HTML with consistent node IDs
  const html = await convertMarkdownToTiptapHTML(content);

  return {
    html,
    frontmatter,
    title: frontmatter?.title,
    tags: frontmatter?.tags || [],
  };
}

/**
 * Enhanced YAML parser that handles both bracket arrays and dash arrays
 */
function parseSimpleYaml(yamlContent: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = yamlContent.split("\n");

  let currentKey: string | null = null;
  let currentArray: string[] = [];
  let isInArray = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Check if this is a dash array item
    if (trimmed.startsWith("- ") && currentKey) {
      isInArray = true;
      const value = trimmed.substring(2).trim();
      currentArray.push(value);
      continue;
    }

    // If we were in an array and hit a non-dash line, save the array
    if (isInArray && currentKey) {
      result[currentKey] =
        currentArray.length === 1 ? currentArray[0] : currentArray;
      currentArray = [];
      isInArray = false;
      currentKey = null;
    }

    // Parse key-value pairs
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    let value: any = trimmed.substring(colonIndex + 1).trim();

    // If value is empty, this might be the start of a dash array
    if (!value) {
      currentKey = key;
      currentArray = [];
      continue;
    }

    // Handle different value types
    if (value.startsWith("[") && value.endsWith("]")) {
      // Bracket-style array: [item1, item2]
      value = value
        .slice(1, -1)
        .split(",")
        .map((item: string) => item.trim().replace(/['"]/g, ""));
    } else if (value.startsWith('"') && value.endsWith('"')) {
      // Quoted string
      value = value.slice(1, -1);
    } else if (value === "true" || value === "false") {
      // Boolean
      value = value === "true";
    } else if (!isNaN(Number(value))) {
      // Number
      value = Number(value);
    }
    // Otherwise keep as string

    result[key] = value;
  }

  // Handle case where YAML ends with an array
  if (isInArray && currentKey) {
    result[currentKey] =
      currentArray.length === 1 ? currentArray[0] : currentArray;
  }

  return result;
}
