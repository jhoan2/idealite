import { Typography } from "@tiptap/extension-typography";

declare module "@tiptap/extension-typography" {
  interface TypographyOptions {
    customReplacements?: Array<{ find: RegExp; replace: string }>;
  }
}

export const CustomTypography = Typography.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      // Add custom replacements
      customReplacements: [
        // Special characters
        { find: /\(p\)/g, replace: "¶" },
        { find: /\(s\)/g, replace: "§" },
        // Custom arrows
        { find: /<=>/g, replace: "↔" },
        { find: /=>/g, replace: "⇒" },
        { find: /<=/g, replace: "⇐" },
        // Math symbols
        { find: /\+-/g, replace: "±" },
        { find: /\infinity/g, replace: "∞" },
        // Currency symbols
        { find: /\(eur\)/g, replace: "€" },
        { find: /\(gbp\)/g, replace: "£" },
        { find: /\(yen\)/g, replace: "¥" },
      ],
    };
  },

  addInputRules() {
    const rules = this.parent?.() || [];

    // Add custom input rules for the new replacements
    if (this.options.customReplacements) {
      this.options.customReplacements.forEach(({ find, replace }) => {
        rules.push({
          find,
          handler: ({ state, range }) => {
            state.tr.insertText(replace, range.from, range.to);
          },
        });
      });
    }

    return rules;
  },

  addKeyboardShortcuts() {
    return {
      "'": ({ editor }) => {
        const { selection } = editor.state;
        const { empty, from, to } = selection;

        const beforeText = editor.state.doc.textBetween(
          Math.max(0, from - 20),
          from,
        );
        const afterText = editor.state.doc.textBetween(
          to,
          Math.min(editor.state.doc.content.size, to + 20),
        );

        const isBeforeWord = /[a-zA-Z]$/.test(beforeText);
        const isAfterWord = /^[a-zA-Z]/.test(afterText);
        const isPotentialContraction = isBeforeWord && isAfterWord;

        if (isPotentialContraction) {
          return false;
        }

        if (empty) {
          const isClosingQuote = beforeText.split("'").length % 2 === 0;

          if (isClosingQuote) {
            editor.chain().insertContent("'").run();
          } else {
            // Insert quotes and position cursor between them
            const pos = editor.state.selection.$head.pos;
            editor
              .chain()
              .insertContent("''")
              .setTextSelection(pos + 1)
              .run();
          }
          return true;
        }

        editor
          .chain()
          .insertContent(`'${editor.state.doc.textBetween(from, to)}'`)
          .run();
        return true;
      },

      '"': ({ editor }) => {
        const { selection } = editor.state;
        const { empty, from, to } = selection;

        const beforeText = editor.state.doc.textBetween(
          Math.max(0, from - 20),
          from,
        );

        if (empty) {
          const isClosingQuote = beforeText.split('"').length % 2 === 0;

          if (isClosingQuote) {
            editor.chain().insertContent('"').run();
          } else {
            // Insert quotes and position cursor between them
            const pos = editor.state.selection.$head.pos;
            editor
              .chain()
              .insertContent('""')
              .setTextSelection(pos + 1)
              .run();
          }
          return true;
        }

        editor
          .chain()
          .insertContent(`"${editor.state.doc.textBetween(from, to)}"`)
          .run();
        return true;
      },
      "`": ({ editor }) => {
        const { selection } = editor.state;
        const { empty, from, to } = selection;

        const beforeText = editor.state.doc.textBetween(
          Math.max(0, from - 20),
          from,
        );

        if (empty) {
          const isClosingBacktick = beforeText.split("`").length % 2 === 0;

          if (isClosingBacktick) {
            editor.chain().insertContent("`").run();
          } else {
            // Insert backticks and position cursor between them
            const pos = editor.state.selection.$head.pos;
            editor
              .chain()
              .insertContent("``")
              .setTextSelection(pos + 1)
              .run();
          }
          return true;
        }

        editor
          .chain()
          .insertContent(`\`${editor.state.doc.textBetween(from, to)}\``)
          .run();
        return true;
      },
    };
  },
});
