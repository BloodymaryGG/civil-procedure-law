import type { RelateResult, KnowledgeItem, LawArticle } from "@/data/types";
import { lawChapters } from "@/data/law-articles";

/** 获取当前条文所在的目录分组 articleId 集合 */
function getChapterArticleIds(current: number): number[] {
  const ch = lawChapters.find(
    (c) => current >= c.articleStart && current <= c.articleEnd,
  );
  if (!ch) return [];
  const ids: number[] = [];
  for (let i = ch.articleStart; i <= ch.articleEnd; i++) ids.push(i);
  return ids;
}

/** 距离评分：0~100 */
function scoreByProximity(current: number, ids: number[]): number {
  if (ids.includes(current)) return 100;
  let best = 0;
  for (const id of ids) {
    const dist = Math.abs(id - current);
    if (dist === 0) return 100;
    if (dist <= 3) best = Math.max(best, 80 - dist * 10);
    else if (dist <= 10) best = Math.max(best, 50 - dist);
    else if (dist <= 30) best = Math.max(best, 20 - dist / 2);
  }
  return best;
}

/** 同篇章匹配 */
function samePartChapter(
  a: LawArticle,
  ids: number[],
  articleMap: Map<number, LawArticle>,
): boolean {
  return ids.some((id) => {
    const other = articleMap.get(id);
    return other && (other.partTitle === a.partTitle || other.chapterTitle === a.chapterTitle);
  });
}

/* ────────────── 知识点关联 ────────────── */

export function getRelatedKnowledge(
  current: number,
  article: LawArticle | undefined,
  allKnowledge: KnowledgeItem[],
  articleMap: Map<number, LawArticle>,
): RelateResult<KnowledgeItem> {
  const chapterIds = new Set(getChapterArticleIds(current));

  const scored = allKnowledge
    .map((k) => {
      let score = scoreByProximity(current, k.articleIds);
      if (k.relatedCaseIds?.length) score += 2;
      if (score < 100 && k.articleIds.some((id) => chapterIds.has(id))) {
        score = Math.max(score, 70);
      }
      if (article && score < 70 && samePartChapter(article, k.articleIds, articleMap)) {
        score = Math.max(score, 65);
      }
      if (article && k.scope) {
        const scopeMatch =
          k.scope.includes(article.partTitle) ||
          k.scope.includes(article.chapterTitle);
        if (scopeMatch) score = Math.max(score, 60);
      }
      // keyword matching
      if (article) {
        const text = `${k.title}${k.points.join("")}${k.memory}`;
        const articleText = article.paragraphs.join("");
        // Find shared keywords (words longer than 2 chars)
        const kwHits: string[] = [];
        const articleChars = new Set(articleText.replace(/[的了吧,，。：；""（）\(\)\d\s]/g, "").slice(0, 200));
        for (let i = 0; i < text.length - 1; i++) {
          const segment = text.slice(i, i + 4);
          if (segment.length >= 2 && articleText.includes(segment)) {
            kwHits.push(segment);
            if (kwHits.length >= 3) break;
          }
        }
        score = Math.max(score, kwHits.length * 15);
      }
      return { item: k, score };
    })
    .filter((x) => x.score >= 20)
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 4).map((x) => x.item);
  const bestScore = scored[0]?.score ?? 0;

  if (bestScore >= 100) {
    return {
      items: top.filter((k) => k.articleIds.includes(current)),
      mode: "exact",
      hint: "与本条直接关联的知识点",
    };
  }
  if (top.length > 0) {
    return {
      items: top,
      mode: "chapter",
      hint: "相关章节知识点",
    };
  }

  if (article) {
    return {
      items: [buildArticleInsight(article)],
      mode: "generated",
      hint: "本条学习提示",
    };
  }

  return { items: [], mode: "generated", hint: "" };
}

/* ────────────── 自动生成知识点 ────────────── */

function buildArticleInsight(article: LawArticle): KnowledgeItem {
  const lines = article.paragraphs;
  const lead = lines[0] ?? "";
  const bullets: string[] = [];

  if (lead) bullets.push(lead.length > 160 ? `${lead.slice(0, 160)}…` : lead);
  if (lines.length > 1) {
    const subs = lines
      .filter((l) => /^[（(][一二三四五六七八九十\d]+[）)]/.test(l))
      .slice(0, 3);
    subs.forEach((s) => bullets.push(s));
  }

  return {
    id: `gen-${article.number}`,
    title: `第${article.number}条 要点`,
    scope: article.chapterTitle,
    articleIds: [article.number],
    points: bullets.length
      ? bullets
      : ["仔细阅读条文，注意主体、条件、程序与法律后果。"],
    memory: "结合上下条文理解；注意与前后条文的衔接适用",
    exam: "关注法定期间、有权机关、救济途径三类考点",
  };
}
