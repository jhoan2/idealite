import { JSDOM } from "jsdom";
import he from "he";

const MAX_CHARS = 2_200; // ~550 tokens (4 chars/token)
const MAX_CODE_CHARS = 400;

export interface Chunk {
  nodeIds: string[];
  text: string;
}

/** Light-weight, model-agnostic chunker (no tiktoken) */
export function chunkHtmlGeneric(html: string): Chunk[] {
  const doc = new JSDOM(html).window.document;
  const chunks: Chunk[] = [];

  let ids: string[] = [];
  let buff = "";

  const flush = () => {
    if (buff.trim())
      chunks.push({ nodeIds: [...new Set(ids)], text: buff.trim() });
    ids = [];
    buff = "";
  };

  const add = (id: string, txt: string) => {
    if (txt.length > MAX_CHARS) {
      // oversize block → naive sentence split
      (txt.match(/[^.!?]+[.!?]*/g) || [txt]).forEach((s) => add(id, s));
      return;
    }
    if (buff.length + txt.length > MAX_CHARS) flush();
    ids.push(id);
    buff += (buff ? "\n" : "") + txt;
  };

  doc.body.querySelectorAll("[data-node-id]").forEach((el) => {
    const id = el.getAttribute("data-node-id")!;
    const tag = el.tagName.toLowerCase();

    // --------------- handlers ---------------
    if (tag === "img") {
      const alt = el.getAttribute("alt")?.trim();
      if (alt) add(id, `Image: ${alt}`);
      return;
    }

    if (tag === "li") {
      add(id, he.decode(el.textContent ?? ""));
      return;
    }

    if (tag === "table") {
      el.querySelectorAll("tr").forEach((tr) => {
        const cells = Array.from(tr.children).map((c) =>
          he.decode(c.textContent ?? "").trim(),
        );
        add(id, "| " + cells.join(" | ") + " |");
      });
      return;
    }

    if (tag === "code" || tag === "pre") {
      let code = (el.textContent ?? "").slice(0, MAX_CODE_CHARS);
      if ((el.textContent ?? "").length > MAX_CODE_CHARS) code += "\n[...]";
      add(id, "```\n" + code + "\n```");
      return;
    }

    // default paragraph / heading / div
    const txt = he.decode(el.textContent ?? "").trim();
    if (txt) add(id, txt);
  });

  flush();
  return chunks;
}
