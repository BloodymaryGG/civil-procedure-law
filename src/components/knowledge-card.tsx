import type { KnowledgeItem } from "@/data/types";
import { Hash, Lightbulb, GraduationCap } from "lucide-react";

interface KnowledgeCardProps {
  knowledge: KnowledgeItem;
  currentArticle: number;
  onGoToArticle: (n: number) => void;
}

export default function KnowledgeCard({
  knowledge: k,
  currentArticle,
  onGoToArticle,
}: KnowledgeCardProps) {
  return (
    <div className="rounded-md border border-[#3a4f6b] bg-[#243044] overflow-hidden">
      {/* Title */}
      <div className="border-b border-[#3a4f6b] px-4 py-3">
        <div className="flex items-center gap-2 text-xs">
          <Lightbulb className="h-3.5 w-3.5 text-[#d4a853]" />
          <span className="font-medium text-[#e8edf4]">{k.title}</span>
          {k.scope && (
            <span className="ml-auto text-[10px] text-[#94a3b8] truncate">
              {k.scope}
            </span>
          )}
        </div>
      </div>

      {/* Key points */}
      <div className="px-4 py-3 space-y-2">
        {k.points.map((pt, i) => (
          <p key={i} className="text-xs text-[#e8edf4]/80 leading-relaxed">
            {pt.startsWith("（") || pt.startsWith("(") ? (
              <>
                <span className="text-[#3b82f6]">{pt.match(/^[（(][^）)]*[）)]/)?.[0]}</span>
                {pt.replace(/^[（(][^）)]*[）)]/, "")}
              </>
            ) : (
              pt
            )}
          </p>
        ))}
      </div>

      {/* Memory rhyme */}
      {k.memory && (
        <div className="border-t border-[#3a4f6b]/60 px-4 py-2.5">
          <div className="flex items-start gap-2">
            <Hash className="mt-0.5 h-3 w-3 shrink-0 text-[#d4a853]" />
            <div>
              <div className="text-[10px] text-[#d4a853] font-medium">记忆口诀</div>
              <p className="text-xs text-[#e8edf4]/80 leading-relaxed mt-0.5">
                {k.memory}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Exam tip */}
      {k.exam && (
        <div className="border-t border-[#3a4f6b]/60 px-4 py-2.5">
          <div className="flex items-start gap-2">
            <GraduationCap className="mt-0.5 h-3 w-3 shrink-0 text-[#3b82f6]" />
            <div>
              <div className="text-[10px] text-[#3b82f6] font-medium">考试提示</div>
              <p className="text-xs text-[#e8edf4]/80 leading-relaxed mt-0.5">
                {k.exam}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Article links */}
      <div className="border-t border-[#3a4f6b] px-4 py-2.5">
        <div className="flex flex-wrap gap-1.5">
          {k.articleIds.map((n) => (
            <button
              key={n}
              onClick={() => onGoToArticle(n)}
              className={`inline-flex items-center gap-1 rounded px-1.5 py-1 text-[10px] transition-colors ${
                n === currentArticle
                  ? "bg-[#d4a853]/20 text-[#d4a853] border border-[#d4a853]/40"
                  : "bg-[#3b82f6]/15 text-[#3b82f6] hover:bg-[#3b82f6]/25"
              }`}
            >
              第{n}条
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
