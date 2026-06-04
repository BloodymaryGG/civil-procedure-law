import { cn } from "@/lib/utils";

/** 款/项标记：（一）、(1)、① 等 */
const CLAUSE_RE = /^[（(]([一二三四五六七八九十百千零\d]+)[）)]/;
const ORDERED_RE = /^(\d+[.、．]|[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])/;

export type ParagraphVariant = "lead" | "clause";

export function getParagraphVariant(text: string): ParagraphVariant {
  const trimmed = text.trim();
  if (CLAUSE_RE.test(trimmed) || ORDERED_RE.test(trimmed)) return "clause";
  return "lead";
}

export function paragraphClassName(text: string, extra?: string) {
  const variant = getParagraphVariant(text);
  return cn(
    "article-text",
    variant === "lead" ? "article-text--lead" : "article-text--clause",
    extra,
  );
}
