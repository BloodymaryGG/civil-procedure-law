import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { searchAll, highlight } from "@/lib/search";
import { useMemo, useState, useEffect } from "react";
import { Search, BookOpen, Library } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "精确检索 · 民事诉讼法与司法解释" },
      { name: "description", content: "在民事诉讼法全文及配套司法解释中精确检索关键词或条号。" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q: initialQ } = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(initialQ);
  const [filter, setFilter] = useState<"all" | "law" | "interpretation">("all");

  useEffect(() => { setQ(initialQ); }, [initialQ]);

  const hits = useMemo(() => searchAll(q), [q]);
  const filtered = filter === "all" ? hits : hits.filter((h) => h.type === filter);

  const lawCount = hits.filter((h) => h.type === "law").length;
  const interpCount = hits.filter((h) => h.type === "interpretation").length;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="font-serif text-3xl text-foreground">精确检索</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          支持关键词、条号（如「第119条」或「119」）跨文档检索；结果自动高亮。
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q } }); }}
          className="mt-6 flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 shadow-card"
        >
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="输入关键词或条号"
            className="flex-1 bg-transparent py-1 text-base outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" className="rounded-sm bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-accent">
            检索
          </button>
        </form>

        {q && (
          <>
            <div className="mt-6 flex items-center gap-2 border-b border-border pb-2">
              <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>全部 {hits.length}</FilterChip>
              <FilterChip active={filter === "law"} onClick={() => setFilter("law")}>
                <BookOpen className="h-3.5 w-3.5" /> 法条 {lawCount}
              </FilterChip>
              <FilterChip active={filter === "interpretation"} onClick={() => setFilter("interpretation")}>
                <Library className="h-3.5 w-3.5" /> 司法解释 {interpCount}
              </FilterChip>
            </div>

            {filtered.length === 0 ? (
              <div className="mt-12 text-center text-muted-foreground">
                未找到与「{q}」匹配的内容。
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {filtered.map((h, idx) => (
                  <li key={idx}>
                    {h.type === "law" ? (
                      <Link
                        to="/law/$articleNumber"
                        params={{ articleNumber: String(h.article.number) }}
                        className="block rounded-md border border-border bg-card p-5 transition-all hover:border-gold hover:shadow-card"
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <span className="rounded-sm bg-primary px-2 py-0.5 text-primary-foreground">法条</span>
                          <span className="text-accent">民事诉讼法 第 {h.article.number} 条</span>
                          <span className="text-muted-foreground">· {h.article.chapterTitle}</span>
                        </div>
                        <p className="mt-2 article-text text-sm" dangerouslySetInnerHTML={highlight(h.snippet, q)} />
                      </Link>
                    ) : (
                      <Link
                        to="/interpretations/$id"
                        params={{ id: h.article.id }}
                        className="block rounded-md border border-border bg-card p-5 transition-all hover:border-gold hover:shadow-card"
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <span className="rounded-sm bg-gold px-2 py-0.5 text-gold-foreground">司法解释</span>
                          <span className="text-accent">《{h.article.doc}》 第 {h.article.number} 条</span>
                          {h.article.relatedLawArticles.length > 0 && (
                            <span className="text-muted-foreground">· 释 民诉法第 {h.article.relatedLawArticles.join("、")} 条</span>
                          )}
                        </div>
                        <p className="mt-2 article-text text-sm" dangerouslySetInnerHTML={highlight(h.snippet, q)} />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-sm border px-3 py-1 text-xs transition-colors ${
        active ? "border-gold bg-gold text-gold-foreground" : "border-border bg-card text-muted-foreground hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}
