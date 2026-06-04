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

  // Scored hits for relevance ranking
  interface Scored {
    hit: SearchHit;
    score: number;
  }
  const scored: Scored[] = [];

  for (const a of lawArticles) {
    const full = joinText(a.paragraphs);

    // Exact article number match = highest priority
    if (numQuery !== null && a.number === numQuery) {
      scored.push({ hit: { type: "law", article: a, snippet: full }, score: 1000 });
      continue;
    }

    const inTitle = a.title?.toLowerCase().includes(lower);
    const inBody = full.toLowerCase().includes(lower);

    if (inTitle || inBody) {
      let score = 0;
      // Title match = much more relevant
      if (inTitle) score += 500;
      // Exact phrase match boosts score
      if (inBody) {
        score += 100;
        // Multi-keyword: each match adds score
        const keywords = q.split(/[\s,，、]+/).filter(Boolean);
        for (const kw of keywords) {
          if (full.toLowerCase().includes(kw.toLowerCase())) score += 10;
          if (a.title?.toLowerCase().includes(kw.toLowerCase())) score += 50;
        }
      }
      scored.push({ hit: { type: "law", article: a, snippet: makeSnippet(full, q) }, score });
    }
  }

  for (const i of interpretations) {
    const full = joinText(i.paragraphs);

    if (numQuery !== null && i.number === numQuery) {
      scored.push({ hit: { type: "interpretation", article: i, snippet: full }, score: 1000 });
      continue;
    }

    if (full.toLowerCase().includes(lower)) {
      let score = 50;
      const keywords = q.split(/[\s,，、]+/).filter(Boolean);
      for (const kw of keywords) {
        if (full.toLowerCase().includes(kw.toLowerCase())) score += 10;
      }
      scored.push({ hit: { type: "interpretation", article: i, snippet: makeSnippet(full, q) }, score });
    }
  }

  // Sort by score descending, then return top hits
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.hit);
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
