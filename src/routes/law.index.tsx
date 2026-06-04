import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { lawChapters, lawArticles, TOTAL_LAW_ARTICLES } from "@/data/law-articles";
import { useMemo, useState } from "react";

export function LawIndex() {
  const [filter, setFilter] = useState("");
  const grouped = useMemo(() => {
    const byPart = new Map<string, typeof lawChapters>();
    for (const c of lawChapters) {
      if (!byPart.has(c.partTitle)) byPart.set(c.partTitle, []);
      byPart.get(c.partTitle)!.push(c);
    }
    return Array.from(byPart.entries());
  }, []);

  const articleSet = useMemo(() => new Set(lawArticles.map((a) => a.number)), []);
  const f = filter.trim();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-10">
        <div className="border-b border-border pb-5">
          <div className="text-xs uppercase tracking-widest text-gold">Civil Procedure Law of the PRC</div>
          <h1 className="font-serif text-3xl text-foreground mt-1">中华人民共和国民事诉讼法</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            2023年9月1日第五次修正 · 2024年1月1日起施行 · 共 {TOTAL_LAW_ARTICLES} 条
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="跳转条号，如：119"
            className="w-56 rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-gold"
          />
          {f && (
            <a
              href={`#/law/${f}`}
              className="text-sm text-accent hover:text-gold"
            >
              → 跳转至第 {f} 条
            </a>
          )}
        </div>

        <div className="mt-10 space-y-12">
          {grouped.map(([part, chapters]) => (
            <section key={part}>
              <h2 className="font-serif text-xl text-accent border-l-4 border-gold pl-3">{part}</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {chapters.map((c) => (
                  <div key={c.id} className="rounded-md border border-border bg-card p-4 shadow-card">
                    <div className="font-serif text-base text-foreground">{c.chapterTitle}</div>
                    <div className="mt-1 text-xs text-muted-foreground">第 {c.articleStart}–{c.articleEnd} 条</div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {Array.from({ length: c.articleEnd - c.articleStart + 1 }, (_, i) => c.articleStart + i).map((n) => {
                        const has = articleSet.has(n);
                        return (
                          <a
                            key={n}
                            href={`#/law/${n}`}
                            className={`inline-flex h-7 min-w-[2.25rem] items-center justify-center rounded-sm border px-1.5 text-xs transition-colors ${
                              has
                                ? "border-gold/40 bg-gold-soft/50 text-foreground hover:bg-gold hover:text-gold-foreground"
                                : "border-border text-muted-foreground hover:border-accent hover:text-accent"
                            }`}
                            title={`第${n}条`}
                          >
                            {n}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
