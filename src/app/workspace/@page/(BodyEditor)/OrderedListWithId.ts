// src/editor/extensions/OrderedListWithId.ts
import OrderedList from "@tiptap/extension-ordered-list";
import { v4 as uuidv4 } from "uuid";

export const OrderedListWithId = OrderedList.extend({
  name: "orderedList",

  addAttributes() {
    return {
      ...this.parent?.(),
      nodeId: {
        default: null,
        parseHTML: (element) =>
          element.tagName === "OL"
            ? element.getAttribute("data-node-id")
            : null,
        renderHTML: (attrs) => {
          if (!attrs.nodeId) return {};
          return { "data-node-id": attrs.nodeId };
        },
      },
    };
  },

  onCreate() {
    const tr = this.editor.state.tr;
    const { doc } = this.editor.state;
    let mutated = false;

    doc.descendants((node, pos) => {
      if (node.type.name === "orderedList" && !node.attrs.nodeId) {
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
