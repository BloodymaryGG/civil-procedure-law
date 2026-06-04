// 民事诉讼法 / 司法解释 数据类型

export type LawChapter = {
  id: string;
  partTitle: string;     // 第一编 总则
  chapterTitle: string;  // 第一章 任务、适用范围和基本原则
  articleStart: number;
  articleEnd: number;
};

export type LawArticle = {
  number: number;
  title: string;       // 条文主旨
  partTitle: string;
  chapterTitle: string;
  sectionTitle?: string;
  paragraphs: string[];
};

export type InterpretationDoc = "民诉法解释" | "证据规定";

export type InterpretationArticle = {
  id: string;
  doc: InterpretationDoc;
  number: number;
  chapter?: string;
  paragraphs: string[];
  relatedLawArticles: number[];
};

/* ─────── 知识点系统 ─────── */
export interface KnowledgeItem {
  id: string;
  title: string;
  scope: string;
  articleIds: number[];
  points: string[];
  memory: string;
  exam?: string;
  relatedCaseIds?: string[];
}

/* ─────── 案例系统 ─────── */
export interface CaseArticleLink {
  articleId: number;
  label: string;
}

export type CaseType = "指导案例" | "典型案例" | "公报案例" | "教学示例";

export interface CaseItem {
  id: string;
  title: string;
  court: string;
  year: string;
  type: CaseType;
  summary: string;
  focus: string;
  articleIds: number[];
  knowledgeIds: string[];
  facts: string;
  dispute: string;
  procedure: string[];
  ruling: string;
  lessons: string[];
  articleLinks: CaseArticleLink[];
}

/* ─────── 关联引擎 ─────── */
export type RelateMode = "exact" | "chapter" | "keyword" | "generated";

export interface RelateResult<T> {
  items: T[];
  mode: RelateMode;
  hint: string;
}
