// File: ./ImageWithId.ts

import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import { v4 as uuidv4 } from "uuid";

export const ImageWithId = Image.extend({
  name: "image",

  addOptions() {
    return {
      ...this.parent?.(),
      inline: true,
      allowBase64: true,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      // Internal TipTap attribute that gets rendered as both data-node-id and id
      nodeId: {
        default: () => uuidv4(),
        parseHTML: (element) =>
          element.getAttribute("data-node-id") ||
          element.getAttribute("id") ||
          uuidv4(),
        renderHTML: (attributes) => {
          return {
            "data-node-id": attributes.nodeId, // For flashcards
            id: attributes.nodeId, // For general HTML compliance
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: (dom) => {
          const element = dom as HTMLElement;
          const nodeId =
            element.getAttribute("data-node-id") ||
            element.getAttribute("id") ||
            uuidv4();

          return {
            src: element.getAttribute("src"),
            alt: element.getAttribute("alt"),
            title: element.getAttribute("title"),
            nodeId: nodeId, // Only store internally
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Ensure we always have a nodeId
    if (!HTMLAttributes.nodeId) {
      HTMLAttributes.nodeId = uuidv4();
    }

    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-node-id": HTMLAttributes.nodeId, // For flashcards
        id: HTMLAttributes.nodeId, // For HTML compliance
      }),
    ];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImage:
        (options) =>
        ({ commands }) => {
          const nodeId = uuidv4();
          return commands.insertContent({
            type: this.name,
            attrs: {
              ...options,
              nodeId, // Only set the internal attribute
            },
          });
        },
    };
  },
});
