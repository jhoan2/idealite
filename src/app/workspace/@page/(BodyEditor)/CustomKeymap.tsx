import { type Editor, Extension } from "@tiptap/core";

// Custom extension to override the cut behavior
export const CustomKeymap = Extension.create({
  name: "customKeymap",

  addKeyboardShortcuts() {
    return {
      "Mod-x": ({ editor }: { editor: Editor }) => {
        const { selection } = editor.state;
        const { from } = selection;

        // Get the positions of the current block
        const $pos = editor.state.doc.resolve(from);

        // Find the deepest block that contains our position
        const textBlockDepth = $pos.depth;

        // Handle top-level node case
        if (textBlockDepth === 0) {
          // If at top level, just delete the current selection
          editor.chain().deleteSelection().run();
          return true;
        }

        const startPos = $pos.before(textBlockDepth);
        const endPos = $pos.after(textBlockDepth);

        // Delete the entire block
        editor.chain().deleteRange({ from: startPos, to: endPos }).run();
        return true;
      },
    };
  },
});
