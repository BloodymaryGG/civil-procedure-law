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

  interface Scored {
    hit: SearchHit;
    score: number;
  }
  const scored: Scored[] = [];

  for (const a of lawArticles) {
    const full = joinText(a.paragraphs);

    // 精确条号查询
    if (numQuery !== null && a.number === numQuery) {
      scored.push({ hit: { type: "law", article: a, snippet: a.title ? `[${a.title}] ${a.paragraphs[0]}` : full }, score: 1000 });
      continue;
    }

    // 标题匹配优先，正文匹配其次，按得分排序
    let score = 0;
    const inTitle = a.title?.toLowerCase().includes(lower);
    const inBody = full.toLowerCase().includes(lower);

    if (inTitle || inBody) {
      if (inTitle) score += 500;
      if (inBody) {
        score += 100;
        // 多关键词：每个命中加5分
        const keywords = q.split(/[\s,，、]+/).filter(Boolean);
        for (const kw of keywords) {
          if (full.toLowerCase().includes(kw.toLowerCase())) score += 5;
          if (a.title?.toLowerCase().includes(kw.toLowerCase())) score += 50;
        }
      }
      scored.push({ hit: { type: "law", article: a, snippet: makeSmartSnippet(a, q) }, score });
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

  // 按得分降序排列
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.hit);
}

/** 智能摘要：优先展示标题+匹配段落 */
function makeSmartSnippet(article: LawArticle, query: string): string {
  const kw = query.toLowerCase();
  if (article.title?.toLowerCase().includes(kw)) {
    for (const p of article.paragraphs) {
      if (p.toLowerCase().includes(kw)) {
        return `[${article.title}] ${p.slice(0, 150)}`;
      }
    }
    return `[${article.title}] ${article.paragraphs[0]?.slice(0, 150) ?? ""}`;
  }
  return makeSnippet(joinText(article.paragraphs), query);
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
