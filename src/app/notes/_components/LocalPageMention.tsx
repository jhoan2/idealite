import { Mention } from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import type { SuggestionProps } from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { MentionList } from "../../workspace/@page/(BodyEditor)/MentionList";
import { db } from "~/storage/db";
import { v4 as uuidv4 } from "uuid";

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

    items: async ({ query }: { query: string }) => {
      // Instant query against Dexie
      const results = await db.pages
        .where('title')
        .startsWithIgnoreCase(query)
        .and(p => p.deleted === 0)
        .limit(10)
        .toArray();

      return results.map(p => ({
        id: p.id,
        title: p.title
      }));
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
      // Logic to insert the link
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "text",
          text: props.title,
          marks: [
            {
              type: "link",
              attrs: {
                href: `/notes/${props.id}`,
                pageId: props.id,
              },
            },
          ],
        })
        .insertContent(" ")
        .run();
    },
  },
});
