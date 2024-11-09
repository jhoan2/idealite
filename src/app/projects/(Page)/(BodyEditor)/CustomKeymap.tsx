import { type Editor, Extension } from "@tiptap/core";

// Custom extension to override the cut behavior
export const CustomKeymap = Extension.create({
  name: "customKeymap",

  addKeyboardShortcuts() {
    return {
      "Mod-x": ({ editor }: { editor: Editor }) => {
        const { selection } = editor.state;
        const { from, to } = selection;

        // Get the positions of the current line
        const line = editor.state.doc.resolve(from).blockRange();

        if (line) {
          // Delete the entire line
          editor.chain().deleteRange({ from: line.start, to: line.end }).run();

          return true;
        }

        return false;
      },
    };
  },
});
