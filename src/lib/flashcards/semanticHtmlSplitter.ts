import { JSDOM } from "jsdom";
import he from "he";

const MAX_CHARS = 2_200;
const OVERLAP = 200;

export interface SplitChunk {
  primaryId: string | undefined;
  additionalIds: string[];
  text: string; // plain-text, no HTML
}

/** Header-aware splitter with character budget + overlap */
export function semanticHtmlSplitter(html: string): SplitChunk[] {
  const { document } = new JSDOM(html).window;
  const headers = Array.from(
    document.querySelectorAll("h1,h2,h3,h4,h5,h6"),
  ) as HTMLElement[];

  // If no headers, treat whole <body> as one section.
  const sections: { nodes: Element[]; header?: HTMLElement }[] = [];
  if (headers.length === 0) {
    sections.push({ nodes: Array.from(document.body.children) as Element[] });
  } else {
    // Walk header list and gather sibling nodes until next header of <= level
    headers.forEach((hdr, i) => {
      const siblings: Element[] = [];
      let el: Element | null = hdr.nextElementSibling;
      while (
        el &&
        !(
          /^h[1-6]$/.test(el.tagName.toLowerCase()) &&
          Number(el.tagName[1]) <= Number(hdr.tagName[1])
        )
      ) {
        siblings.push(el);
        el = el.nextElementSibling;
      }
      sections.push({ header: hdr, nodes: siblings });
    });
  }

  /* ---------- flatten sections into chunks ---------- */
  const chunks: SplitChunk[] = [];
  for (const { header, nodes } of sections) {
    const headerText = header ? he.decode(header.textContent ?? "").trim() : "";
    const headerId = header?.getAttribute("data-node-id") || undefined;

    let buff = headerText ? `${headerText}\n` : "";
    let ids: string[] = headerId ? [headerId] : [];

    const flush = () => {
      if (!buff.trim()) return;
      chunks.push({
        primaryId: ids[0],
        additionalIds: ids.slice(1),
        text: buff.trim(),
      });
      // Seed next chunk with overlap
      buff = buff.slice(-OVERLAP);
      ids = ids.slice(-1);
    };

    const pushNode = (el: Element) => {
      // collect ids inside this element
      el.querySelectorAll("[data-node-id]").forEach((e) => {
        const id = e.getAttribute("data-node-id");
        if (id) ids.push(id);
      });
      const selfId = el.getAttribute("data-node-id");
      if (selfId) ids.push(selfId);

      const txt = he
        .decode(el.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim();
      if (!txt) return;

      if (buff.length + txt.length + 1 > MAX_CHARS) flush();
      buff += (buff ? " " : "") + txt;
    };
    nodes.forEach((el, idx) => {
      pushNode(el);

      // If we have NO headings in the entire doc,
      // start a new chunk after every paragraph-like block
      if (headers.length === 0) {
        const tag = el.tagName.toLowerCase();
        const isParaLike = tag === "p" || tag === "li" || tag === "div";
        if (isParaLike) flush();
      }
    });
    flush();
  }

  return chunks;
}
