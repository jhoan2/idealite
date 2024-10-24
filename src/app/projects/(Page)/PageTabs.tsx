"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { X } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface TabPage {
  id: string;
  title: string;
  content: string;
}

const TiptapEditor = ({
  content,
  onUpdate,
  immediatelyRender = false,
}: {
  content: string;
  onUpdate: (newContent: string) => void;
  immediatelyRender?: boolean;
}) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    immediatelyRender: immediatelyRender,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  return (
    <EditorContent
      editor={editor}
      className="min-h-[200px] rounded-md border p-4"
    />
  );
};

export default function PageTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const [openTabs, setOpenTabs] = useState<TabPage[]>([]);
  const currentPageId = pathname.split("/projects/")[1];

  useEffect(() => {
    if (currentPageId && !openTabs.find((tab) => tab.id === currentPageId)) {
      // Fetch page data when a new tab is opened
      fetchPageData(currentPageId);
    }
  }, [currentPageId]);

  const fetchPageData = async (pageId: string) => {
    try {
      const response = await fetch(`/api/pages?pageId=${pageId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const pageData = await response.json();

      if (pageData.error) {
        throw new Error(pageData.error);
      }

      setOpenTabs((prev) => [
        ...prev,
        {
          id: pageId,
          title: pageData.title,
          content: pageData.content || "<p></p>",
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch page data:", error);
    }
  };

  const updateContent = async (tabId: string, newContent: string) => {
    try {
      await fetch(`/api/pages/${tabId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newContent }),
      });

      setOpenTabs((prev) =>
        prev.map((tab) =>
          tab.id === tabId ? { ...tab, content: newContent } : tab,
        ),
      );
    } catch (error) {
      console.error("Failed to save content:", error);
    }
  };

  return (
    <Tabs value={currentPageId} className="w-full">
      <TabsList className="flex overflow-x-auto">
        {openTabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="group relative"
            onClick={() => router.push(`/projects/${tab.id}`)}
          >
            <span>{tab.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenTabs((prev) => prev.filter((t) => t.id !== tab.id));
                if (tab.id === currentPageId) {
                  const remaining = openTabs.filter((t) => t.id !== tab.id);
                  if (remaining.length > 0) {
                    const lastTab = remaining[remaining.length - 1];
                    if (lastTab) {
                      router.push(`/projects/${lastTab.id}`);
                    }
                  } else {
                    router.push("/");
                  }
                }
              }}
              className="ml-2 rounded-full p-1 opacity-0 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </TabsTrigger>
        ))}
      </TabsList>

      {openTabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id}>
          <TiptapEditor
            content={tab.content}
            onUpdate={(newContent) => updateContent(tab.id, newContent)}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
