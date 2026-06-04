// 搜索与高亮工具
import { lawArticles } from "@/data/law-articles";
import { interpretations } from "@/data/interpretations";
import type { LawArticle, InterpretationArticle } from "@/data/types";

export type SearchHit =
  | { type: "law"; article: LawArticle; snippet: string }
  | { type: "interpretation"; article: InterpretationArticle; snippet: string };

const joinText = (paras: string[]) => paras.join("\n");

/** 判断关键词在文本中的出现是否为独立词（不是其他词的一部分） */
function isExactKeywordMatch(text: string, keyword: string): boolean {
  const kw = keyword.toLowerCase();
  let startIdx = 0;
  while (true) {
    const idx = text.toLowerCase().indexOf(kw, startIdx);
    if (idx < 0) return false;

    const charBefore = text[idx - 1] || "";
    const charAfter = text[idx + kw.length] || "";

    // 常见组词用字：如果在关键词前/后有这些字，说明是复合词的一部分
    const compounds = "法定被原被上受申委代诉请应的负请举";
    
    const hasPrefix = compounds.includes(charBefore);
    const hasSuffix = compounds.includes(charAfter);

    // 如果前后都不是组词用字 → 精确匹配
    if (!hasPrefix && !hasSuffix) return true;

    // 但如果是标题中的精确匹配（title field），应该排除
    // 继续找下一个出现位置
    startIdx = idx + 1;
  }
}

/** 计算精确匹配得分：优先标题匹配，次优正文独立词匹配 */
function calcMatchScore(
  text: string,
  title: string | undefined,
  keyword: string,
  arts: { number: number; title?: string }[],
): number {
  const kw = keyword.toLowerCase();
  let score = 0;

  // 标题匹配：最高分
  if (title?.toLowerCase().includes(kw)) {
    // 标题中独立词匹配加分更高
    if (isExactKeywordMatch(title, kw)) {
      score += 500;
    } else {
      score += 300;
    }
  }

  // 正文独立词匹配
  if (isExactKeywordMatch(text, kw)) {
    score += 100;
  }

  // 多关键词匹配（逗号/空格分隔）
  const keywords = keyword.split(/[\s,，、]+/).filter(Boolean);
  if (keywords.length > 1) {
    let exactHits = 0;
    let partialHits = 0;
    for (const subKw of keywords) {
      if (title?.toLowerCase().includes(subKw.toLowerCase())) {
        if (isExactKeywordMatch(title, subKw)) {
          exactHits++;
          score += 80;
        } else {
          partialHits++;
          score += 40;
        }
      }
      if (isExactKeywordMatch(text, subKw)) {
        exactHits++;
        score += 30;
      } else if (text.toLowerCase().includes(subKw.toLowerCase())) {
        partialHits++;
        score += 5; // 子串匹配仅得极低分
      }
    }
  }

  return score;
}

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

    const score = calcMatchScore(full, a.title, q, lawArticles);
    if (score > 0) {
      scored.push({ hit: { type: "law", article: a, snippet: makeSmartSnippet(a, q) }, score });
    }
  }

  for (const i of interpretations) {
    const full = joinText(i.paragraphs);

    if (numQuery !== null && i.number === numQuery) {
      scored.push({ hit: { type: "interpretation", article: i, snippet: full }, score: 1000 });
      continue;
    }

    const score = calcMatchScore(full, i.doc, q, []);
    if (score > 0) {
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
      if (isExactKeywordMatch(p, kw) || p.toLowerCase().includes(kw)) {
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
