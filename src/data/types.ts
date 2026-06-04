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
