// 搜索与高亮工具
import { lawArticles } from "@/data/law-articles";
import { interpretations } from "@/data/interpretations";
import type { LawArticle, InterpretationArticle } from "@/data/types";

export type SearchHit =
  | { type: "law"; article: LawArticle; snippet: string }
  | { type: "interpretation"; article: InterpretationArticle; snippet: string };

const joinText = (paras: string[]) => paras.join("\n");

export function searchAll(query: string, limit = 200): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const lower = q.toLowerCase();

  // 支持「第X条」「119」等条号查询
  const articleMatch = q.match(/^第?\s*(\d+)\s*条?$/);
  const numQuery = articleMatch ? parseInt(articleMatch[1], 10) : null;

  const hits: SearchHit[] = [];

  for (const a of lawArticles) {
    const full = joinText(a.paragraphs);
    if (numQuery !== null && a.number === numQuery) {
      hits.push({ type: "law", article: a, snippet: full });
      continue;
    }
    if (full.toLowerCase().includes(lower)) {
      hits.push({ type: "law", article: a, snippet: makeSnippet(full, q) });
    }
    if (hits.length >= limit) break;
  }

  for (const i of interpretations) {
    const full = joinText(i.paragraphs);
    if (numQuery !== null && i.number === numQuery) {
      hits.push({ type: "interpretation", article: i, snippet: full });
      continue;
    }
    if (full.toLowerCase().includes(lower)) {
      hits.push({ type: "interpretation", article: i, snippet: makeSnippet(full, q) });
    }
    if (hits.length >= limit) break;
  }

  return hits;
}

function makeSnippet(text: string, query: string, ctx = 36): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text.slice(0, 100);
  const start = Math.max(0, idx - ctx);
  const end = Math.min(text.length, idx + query.length + ctx);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

export function highlight(text: string, query: string): { __html: string } {
  if (!query.trim()) return { __html: escapeHtml(text) };
  const safe = escapeHtml(text);
  const safeQ = escapeRegExp(query.trim());
  const re = new RegExp(`(${safeQ})`, "gi");
  return { __html: safe.replace(re, `<mark class="search-hit">$1</mark>`) };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
