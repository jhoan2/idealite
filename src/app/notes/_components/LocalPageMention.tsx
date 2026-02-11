import { Mention } from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import type { SuggestionProps } from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { MentionList } from "../../workspace/@page/(BodyEditor)/MentionList";
import { db } from "~/storage/db";
import { v4 as uuidv4 } from "uuid";

interface PageSuggestion {
  id: string;
  title: string;
  isCreateOption?: boolean;
}

/**
 * Local-first version of the Page Mention extension.
 * Queries Dexie instead of the server for zero-latency linking.
 */
export const LocalPageMention = Mention.extend({
  name: "localPageMention",
}).configure({
  HTMLAttributes: {
    class: "mention",
  },
  suggestion: {
    char: "[[",
    allowSpaces: true,
    startOfLine: false,

    items: async ({ query }: { query: string }): Promise<PageSuggestion[]> => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return [];

      const results = await db.pages
        .where("title")
        .startsWithIgnoreCase(trimmedQuery)
        .and((p) => p.deleted === 0)
        .limit(10)
        .toArray();

      const suggestions = results.map((p) => ({
        id: p.id,
        title: p.title,
      }));

      const normalizedQuery = trimmedQuery.toLocaleLowerCase();
      const hasExactMatch = suggestions.some(
        (p) => p.title.trim().toLocaleLowerCase() === normalizedQuery,
      );

      if (!hasExactMatch) {
        suggestions.unshift({
          id: "create-new",
          title: trimmedQuery,
          isCreateOption: true,
        });
      }

      return suggestions;
    },

    render: () => {
      let component: ReactRenderer<any, any> | null = null;
      let popup: TippyInstance | null = null;

      return {
        onStart: (props: SuggestionProps) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });

          popup = tippy(document.body, {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          }) as TippyInstance;
        },

        onUpdate(props: SuggestionProps) {
          component?.updateProps(props);

          if (popup) {
            popup.setProps({
              getReferenceClientRect: props.clientRect as () => DOMRect,
            });
          }
        },

        onKeyDown(props: { event: KeyboardEvent }) {
          if (props.event.key === "Escape") {
            popup?.hide();
            return true;
          }

          return (component?.ref as any)?.onKeyDown(props);
        },

        onExit() {
          popup?.destroy();
          component?.destroy();
        },
      };
    },

    command: async ({ editor, range, props }) => {
      const pageData = props as unknown as PageSuggestion;
      let targetId = pageData.id;
      let targetTitle = pageData.title;

      if (pageData.isCreateOption) {
        const desiredTitle = pageData.title.trim();
        if (!desiredTitle) return;

        const existing = await db.pages
          .where("title")
          .equalsIgnoreCase(desiredTitle)
          .and((p) => p.deleted === 0)
          .first();

        if (existing) {
          targetId = existing.id;
          targetTitle = existing.title;
        } else {
          const tempId = `temp-${uuidv4()}`;
          const now = Date.now();

          try {
            await db.pages.add({
              id: tempId,
              title: desiredTitle,
              content: "",
              plainText: "",
              updatedAt: now,
              deleted: 0,
              isSynced: 0,
              isDaily: /^\d{4}-\d{2}-\d{2}$/.test(desiredTitle) ? 1 : 0,
            });

            targetId = tempId;
            targetTitle = desiredTitle;
          } catch (error) {
            // If another action created it first, reuse that row.
            const fallback = await db.pages
              .where("title")
              .equalsIgnoreCase(desiredTitle)
              .and((p) => p.deleted === 0)
              .first();

            if (!fallback) throw error;
            targetId = fallback.id;
            targetTitle = fallback.title;
          }
        }
      }

      const selection = editor.state.selection;
      const deleteFrom = range.from;
      const deleteTo = selection.from;

      editor
        .chain()
        .focus()
        .deleteRange({ from: deleteFrom, to: deleteTo })
        .insertContent({
          type: "text",
          text: targetTitle,
          marks: [
            {
              type: "link",
              attrs: {
                href: `/notes/${targetId}`,
                pageId: targetId,
              },
            },
          ],
        })
        .insertContent(" ")
        .run();
    },
  },
});
