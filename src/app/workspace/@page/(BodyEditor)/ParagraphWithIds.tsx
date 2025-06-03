import Paragraph from "@tiptap/extension-paragraph";
import { v4 as uuidv4 } from "uuid";

export const ParagraphWithId = Paragraph.extend({
  name: "paragraph",

  /**
   * 1. Advertise a new `nodeId` attribute that will be emitted as
   *    data-node-id="<value>" in the DOM.
   */
  addAttributes() {
    return {
      ...this.parent?.(), // retain all existing attrs
      nodeId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-node-id") ?? null,
        renderHTML: (attrs) => {
          // Only output the attribute when it's present
          if (!attrs.nodeId) return {};
          return { "data-node-id": attrs.nodeId };
        },
      },
    };
  },

  /**
   * 2. On document load OR first insertion, make sure each paragraph
   *    gets a UUID if it doesn’t have one yet.
   */
  onCreate() {
    const tr = this.editor.state.tr;
    const state = this.editor.state;
    let mutated = false;

    state.doc.descendants((node: any, pos: any) => {
      if (node.type.name === "paragraph" && !node.attrs.nodeId) {
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          nodeId: uuidv4(),
        });
        mutated = true;
      }
    });
    if (mutated) this.editor.view.dispatch(tr);
  },
});
