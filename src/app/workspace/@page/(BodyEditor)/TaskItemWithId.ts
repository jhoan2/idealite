// src/editor/extensions/TaskItemWithId.ts
import TaskItem from "@tiptap/extension-task-item";
import { v4 as uuidv4 } from "uuid";

export const TaskItemWithId = TaskItem.extend({
  name: "taskItem",

  addAttributes() {
    return {
      ...this.parent?.(),
      nodeId: {
        default: null,
        parseHTML: (element) =>
          element.tagName === "LI"
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
      if (node.type.name === "taskItem" && !node.attrs.nodeId) {
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
