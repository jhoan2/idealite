import { Mention } from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import type { SuggestionProps } from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { MentionList } from "./MentionList";

interface PageSuggestion {
  id: string;
  title: string;
}

export const PageMention = Mention.extend({
  name: "pageMention",
}).configure({
  HTMLAttributes: {
    class: "mention",
  },
  suggestion: {
    char: "[[",
    allowSpaces: true,
    startOfLine: false,

    items: async ({ query }: { query: string }): Promise<PageSuggestion[]> => {
      try {
        const response = await fetch(
          `/api/v1/pages/search?q=${encodeURIComponent(query)}`,
        );
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch page suggestions:", error);
        return [];
      }
    },

    render: () => {
      let component: ReactRenderer<any, any> | null = null;
      let popup: TippyInstance | null = null;
      let isDestroyed = false;

      return {
        onStart: (props: SuggestionProps<PageSuggestion>) => {
          isDestroyed = false;

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
            onHide: () => {
              isDestroyed = true;
            },
            onDestroy: () => {
              isDestroyed = true;
            },
          }) as TippyInstance;
        },

        onUpdate(props: SuggestionProps<PageSuggestion>) {
          if (!isDestroyed && component) {
            component.updateProps(props);
          }

          if (!isDestroyed && popup) {
            popup.setProps({
              getReferenceClientRect: props.clientRect as () => DOMRect,
            });
          }
        },

        onKeyDown(props: { event: KeyboardEvent }) {
          if (props.event.key === "Escape") {
            if (!isDestroyed && popup) {
              popup.hide();
            }
            return true;
          }

          if (!isDestroyed && component?.ref) {
            return component.ref.onKeyDown(props);
          }

          return false;
        },

        onExit() {
          if (!isDestroyed && popup) {
            try {
              popup.destroy();
            } catch (e) {
              // Ignore errors if already destroyed
            }
          }

          if (component) {
            try {
              component.destroy();
            } catch (e) {
              // Ignore errors if already destroyed
            }
          }

          popup = null;
          component = null;
          isDestroyed = true;
        },
      };
    },

    command: ({ editor, range, props }) => {
      const pageData = props as unknown as PageSuggestion;

      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "text",
          text: pageData.title,
          marks: [
            {
              type: "link",
              attrs: {
                href: `/workspace?pageId=${pageData.id}`,
                pageId: pageData.id,
                displayName: pageData.title,
                isInternal: true,
              },
            },
          ],
        })
        .insertContent(" ")
        .run();
    },
  },
});
