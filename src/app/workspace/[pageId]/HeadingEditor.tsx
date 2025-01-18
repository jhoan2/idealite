"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Focus from "@tiptap/extension-focus";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import { TreeFolder, TreeTag } from "~/server/queries/usersTags";
import { updatePage } from "~/server/actions/page";
import { updateTabTitle } from "~/server/actions/tabs";
import { useSearchParams } from "next/navigation";

interface HeadingEditorProps {
  initialTitle: string;
  pageId: string;
  userTagTree: TreeTag[];
  immediatelyRender?: boolean;
  onSavingStateChange: (isSaving: boolean) => void;
}

// Helper function to search through folder
function searchFolderForPage(folder: TreeFolder, pageId: string): boolean {
  // Check pages in current folder
  if (folder.pages?.some((page) => page.id === pageId)) {
    return true;
  }

  return false;
}

function findTagContainingPage(
  tree: TreeTag[],
  pageId: string,
): TreeTag | null {
  for (const tag of tree) {
    // Check pages directly in tag
    if (tag.pages?.some((page) => page.id === pageId)) {
      return tag;
    }

    // Check pages in folders
    if (tag.folders) {
      const hasPageInFolders = tag.folders.some((folder) => {
        const hasPage = searchFolderForPage(folder, pageId);
        return hasPage;
      });

      if (hasPageInFolders) {
        return tag;
      }
    }

    // Check children tags
    if (tag.children?.length) {
      const found = findTagContainingPage(tag.children, pageId);
      if (found) return found;
    }
  }
  return null;
}

function findContainingFolder(
  tree: TreeTag[],
  pageId: string,
): { folder: TreeFolder | null; tag: TreeTag | null } {
  for (const tag of tree) {
    // Check immediate folders in current tag
    if (tag.folders) {
      const folder = tag.folders.find((folder) =>
        folder.pages?.some((page) => page.id === pageId),
      );

      if (folder) {
        return { folder, tag };
      }
    }

    // Check children tags
    if (tag.children?.length) {
      const result = findContainingFolder(tag.children, pageId);
      if (result.folder) {
        return result;
      }
    }
  }
  return { folder: null, tag: null };
}

// Simplified check that only looks at immediate container
function isTitleUniqueInContext(
  folder: TreeFolder | null,
  tag: TreeTag | null,
  newTitle: string,
  currentPageId: string,
): boolean {
  if (folder) {
    // Only check pages in the immediate folder
    return !folder.pages?.some(
      (page) =>
        page.id !== currentPageId &&
        page.title.toLowerCase() === newTitle.toLowerCase(),
    );
  }

  if (tag) {
    // Only check direct pages in tag (already working this way)
    return !tag.pages?.some(
      (page) =>
        page.id !== currentPageId &&
        page.title.toLowerCase() === newTitle.toLowerCase(),
    );
  }

  return true;
}

function hasInvalidCharacters(title: string): {
  isValid: boolean;
  invalidChar?: string;
} {
  const invalidChars = ['"', "/", "\\", "*", "<", ">", ":", "|", "?"];

  for (const char of invalidChars) {
    if (title.includes(char)) {
      return { isValid: false, invalidChar: char };
    }
  }

  return { isValid: true };
}

const HeadingEditor = ({
  initialTitle,
  pageId,
  userTagTree,
  immediatelyRender = false,
  onSavingStateChange,
}: HeadingEditorProps) => {
  const [title, setTitle] = useState(initialTitle);
  const searchParams = useSearchParams();
  const tabId = searchParams.get("tabId") ?? "";

  const debouncedSave = useDebouncedCallback(async (newTitle: string) => {
    onSavingStateChange(true);

    if (!newTitle.trim()) {
      return;
    }

    try {
      // Check for invalid characters
      const { isValid } = hasInvalidCharacters(newTitle);
      if (!isValid) {
        toast.error(`Title cannot contain the characters: " / \\ * < > : | ?`);
        return;
      }

      // Find containing folder and tag
      const { folder, tag } = findContainingFolder(userTagTree, pageId);

      // If not in a folder, find the containing tag directly
      const containingTag = folder
        ? tag
        : findTagContainingPage(userTagTree, pageId);

      if (!containingTag) {
        throw new Error("Page not found in any tag");
      }

      // Check for title uniqueness in the immediate context
      if (!isTitleUniqueInContext(folder, containingTag, newTitle, pageId)) {
        toast.error(
          folder
            ? "A page with this title already exists in this folder"
            : "A page with this title already exists in this tag",
        );
        return;
      }

      // Update the page and tab
      const [updatedPage] = await Promise.all([
        updatePage(pageId, { title: newTitle }),
        updateTabTitle(tabId, newTitle),
      ]);

      if (!updatedPage) {
        throw new Error("Failed to update page title");
      }
    } catch (error) {
      console.error("Failed to save title:", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      onSavingStateChange(false);
    }
  }, 1000);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1],
        },
      }),
      Focus.configure({
        className: "has-focus",
        mode: "all",
      }),
    ],
    content: `<h1>${initialTitle}</h1>`,
    editorProps: {
      attributes: {
        class:
          "pb-4 prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl font-bold focus:outline-none bg-background text-foreground",
      },
    },
    immediatelyRender,
    onUpdate: ({ editor }) => {
      const newTitle = editor
        .getHTML()
        .replace(/<\/?h1>/g, "")
        .trim();

      if (newTitle !== title) {
        setTitle(newTitle);
        debouncedSave(newTitle);
      }
    },
  });

  return (
    <div className="mb-10 flex h-full w-full justify-center overflow-hidden">
      <div className={`w-full max-w-4xl px-4`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default HeadingEditor;
