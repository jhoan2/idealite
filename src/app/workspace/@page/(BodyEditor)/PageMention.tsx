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

    items: ({ query }: { query: string }): PageSuggestion[] => {
      // Return empty array immediately to show menu instantly
      return [];
    },

    render: () => {
      let component: ReactRenderer<any, any> | null = null;
      let popup: TippyInstance | null = null;
      let isDestroyed = false;
      let currentQuery = '';
      let searchTimeout: NodeJS.Timeout | null = null;

      const fetchSuggestions = async (query: string) => {
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
      };

      const updateSuggestions = async (query: string) => {
        if (isDestroyed || !component) return;
        
        // Clear any existing timeout
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }

        // Store current query to handle race conditions
        const queryAtSearchTime = query;
        currentQuery = query;

        // Set loading state immediately
        component.updateProps({
          ...component.props,
          items: [],
          isLoading: true,
        });

        // Debounce the search
        searchTimeout = setTimeout(async () => {
          if (isDestroyed || !component || currentQuery !== queryAtSearchTime) {
            return;
          }

          const items = await fetchSuggestions(query);
          
          // Check again if we're still the current query
          if (isDestroyed || !component || currentQuery !== queryAtSearchTime) {
            return;
          }

          component.updateProps({
            ...component.props,
            items,
            isLoading: false,
          });
        }, 300); // 300ms debounce
      };

      return {
        onStart: (props: SuggestionProps<PageSuggestion>) => {
          isDestroyed = false;

          component = new ReactRenderer(MentionList, {
            props: {
              ...props,
              isLoading: true,
            },
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

          // Start fetching suggestions
          updateSuggestions(props.query || '');
        },

        onUpdate(props: SuggestionProps<PageSuggestion>) {
          if (!isDestroyed && popup) {
            popup.setProps({
              getReferenceClientRect: props.clientRect as () => DOMRect,
            });
          }

          // Update suggestions when query changes
          if (props.query !== currentQuery) {
            updateSuggestions(props.query || '');
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
          isDestroyed = true;

          // Clear any pending search timeout
          if (searchTimeout) {
            clearTimeout(searchTimeout);
            searchTimeout = null;
          }

          if (popup) {
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
