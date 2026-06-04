import type { CaseItem } from "@/data/types";
import { ExternalLink } from "lucide-react";

interface CaseCardProps {
  caseItem: CaseItem;
  currentArticle: number;
  onGoToArticle: (n: number) => void;
}

export default function CaseCard({
  caseItem: c,
  currentArticle,
  onGoToArticle,
}: CaseCardProps) {
  const linksForCurrent = c.articleLinks.filter(
    (l) => l.articleId === currentArticle,
  );
  const linksOther = c.articleLinks.filter(
    (l) => l.articleId !== currentArticle,
  );

  return (
    <article className="rounded-md border border-[#3a4f6b] bg-[#243044] overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#3a4f6b] px-4 py-3">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="rounded bg-[#d4a853]/15 px-1.5 py-0.5 text-[#d4a853]">
            {c.type}
          </span>
          <span className="text-[#94a3b8]">
            {c.court} · {c.year}
          </span>
        </div>
        <h3 className="mt-1.5 text-sm font-medium text-[#e8edf4] leading-snug">
          {c.title}
        </h3>
        <p className="mt-1 text-xs text-[#94a3b8] leading-relaxed line-clamp-2">
          {c.summary}
        </p>
      </div>

      {/* Collapsible sections */}
      <details className="border-b border-[#3a4f6b]/60 last:border-0">
        <summary className="cursor-pointer px-4 py-2 text-xs font-semibold text-[#d4a853] hover:text-[#e8edf4] transition-colors select-none">
          基本案情
        </summary>
        <div className="px-4 pb-3 text-xs text-[#e8edf4]/80 leading-relaxed">
          {c.facts}
        </div>
      </details>

      <details className="border-b border-[#3a4f6b]/60 last:border-0">
        <summary className="cursor-pointer px-4 py-2 text-xs font-semibold text-[#d4a853] hover:text-[#e8edf4] transition-colors select-none">
          争议焦点
        </summary>
        <div className="px-4 pb-3 text-xs text-[#e8edf4]/80 leading-relaxed">
          {c.dispute}
        </div>
      </details>

      <details className="border-b border-[#3a4f6b]/60 last:border-0">
        <summary className="cursor-pointer px-4 py-2 text-xs font-semibold text-[#d4a853] hover:text-[#e8edf4] transition-colors select-none">
          诉讼进程
        </summary>
        <ol className="px-4 pb-3 list-decimal list-inside space-y-1">
          {c.procedure.map((step, i) => (
            <li key={i} className="text-xs text-[#e8edf4]/80 leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      </details>

      <details className="border-b border-[#3a4f6b]/60 last:border-0">
        <summary className="cursor-pointer px-4 py-2 text-xs font-semibold text-[#d4a853] hover:text-[#e8edf4] transition-colors select-none">
          裁判要旨
        </summary>
        <div className="px-4 pb-3 text-xs text-[#e8edf4]/80 leading-relaxed">
          {c.ruling}
        </div>
      </details>

      {/* Article links */}
      {(linksForCurrent.length > 0 || linksOther.length > 0) && (
        <div className="border-t border-[#3a4f6b] px-4 py-2.5">
          <div className="text-[10px] text-[#94a3b8] mb-1.5">相关法条</div>
          <div className="flex flex-wrap gap-1.5">
            {[...linksForCurrent, ...linksOther].map((l) => (
              <button
                key={`${l.articleId}`}
                onClick={() => onGoToArticle(l.articleId)}
                className={`inline-flex items-center gap-1 rounded px-1.5 py-1 text-[10px] transition-colors ${
                  l.articleId === currentArticle
                    ? "bg-[#d4a853]/20 text-[#d4a853] border border-[#d4a853]/40"
                    : "bg-[#3b82f6]/15 text-[#3b82f6] hover:bg-[#3b82f6]/25"
                }`}
              >
                第{l.articleId}条
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lessons */}
      <details className="border-t border-[#3a4f6b]">
        <summary className="cursor-pointer px-4 py-2 text-xs font-semibold text-[#d4a853] hover:text-[#e8edf4] transition-colors select-none">
          学习启示
        </summary>
        <ul className="px-4 pb-3 space-y-1">
          {c.lessons.map((lesson, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-[#e8edf4]/80 leading-relaxed">
              <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-[#d4a853] flex-shrink-0" />
              {lesson}
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}
