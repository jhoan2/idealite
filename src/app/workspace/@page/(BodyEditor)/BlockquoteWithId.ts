import Blockquote from "@tiptap/extension-blockquote";
import { v4 as uuidv4 } from "uuid";

export const BlockquoteWithId = Blockquote.extend({
  name: "blockquote",

  addAttributes() {
    return {
      ...this.parent?.(),
      nodeId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-node-id") ?? null,
        renderHTML: (attrs) => {
          if (!attrs.nodeId) return {};
          return { "data-node-id": attrs.nodeId };
        },
      },
    };
  },

  onCreate() {
    const tr = this.editor.state.tr;
    const state = this.editor.state;
    let mutated = false;

    state.doc.descendants((node: any, pos: any) => {
      if (node.type.name === "blockquote" && !node.attrs.nodeId) {
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
