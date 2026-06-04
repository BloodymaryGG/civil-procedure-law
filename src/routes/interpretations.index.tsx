import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { interpretations, interpretationDocs } from "@/data/interpretations";
import { useMemo, useState } from "react";
import { Search, BookOpen, Library } from "lucide-react";

export function InterpretationsIndex() {
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState<string>("全部");

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return interpretations.filter((i) => {
      if (doc !== "全部" && i.doc !== doc) return false;
      if (!ql) return true;
      const numMatch = ql.match(/^\d+$/);
      if (numMatch && i.number === parseInt(ql, 10)) return true;
      return i.paragraphs.some((p) => p.toLowerCase().includes(ql));
    });
  }, [q, doc]);

  const showCards = doc === "全部" && !q;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-10">
        <div className="border-b border-border pb-5">
          <div className="text-xs uppercase tracking-widest text-gold">Judicial Interpretations</div>
          <h1 className="font-serif text-3xl text-foreground mt-1">司法解释查询系统</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            收录最高人民法院现行有效的民事诉讼法配套司法解释，支持全文检索与按文件筛选。
          </p>
        </div>

        {/* Doc selector */}
        <div className="mt-6 flex flex-wrap gap-2">
          {["全部", ...interpretationDocs.map((d) => d.key)].map((k) => (
            <button
              key={k}
              onClick={() => setDoc(k)}
              className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
                doc === k
                  ? "border-gold bg-gold text-gold-foreground shadow-sm"
                  : "border-border bg-card text-foreground hover:border-accent"
              }`}
            >
              {k}
              {k !== "全部" && (
                <span className="ml-1.5 text-xs opacity-70">
                  {interpretationDocs.find((d) => d.key === k)?.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mt-4 flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 shadow-card">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索司法解释条文内容或条号"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <span className="text-xs text-muted-foreground">{filtered.length} 条</span>
        </div>

        {/* Doc cards */}
        {showCards && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {interpretationDocs.map((d) => (
              <button
                key={d.key}
                onClick={() => setDoc(d.key)}
                className="group text-left rounded-md border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-elegant"
              >
                <div className="flex items-start justify-between gap-3">
                  <Library className="h-6 w-6 text-gold" />
                  <span className="text-xs text-muted-foreground">{d.year}</span>
                </div>
                <div className="mt-3 font-serif text-base leading-snug text-foreground group-hover:text-accent">{d.title}</div>
                <div className="mt-2 text-xs text-muted-foreground">共 {d.count} 条</div>
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {!showCards && (
          <ul className="mt-6 space-y-3">
            {filtered.slice(0, 200).map((i) => (
              <li key={i.id}>
                <a
                  href={`#/interpretations/${i.id}`}
                  className="block rounded-md border border-border bg-card p-5 transition-all hover:border-gold hover:shadow-card"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-sm bg-primary px-2 py-0.5 text-primary-foreground">{i.doc}</span>
                    <span className="text-accent">第 {i.number} 条</span>
                    {i.chapter && <span className="text-muted-foreground">· {i.chapter}</span>}
                    {i.relatedLawArticles.length > 0 && (
                      <span className="ml-auto text-muted-foreground">
                        <BookOpen className="inline h-3 w-3 mr-1" />
                        释民诉法第 {i.relatedLawArticles.join("、")} 条
                      </span>
                    )}
                  </div>
                  <p className="mt-2 article-text text-sm text-foreground line-clamp-3">{i.paragraphs[0]}</p>
                </a>
              </li>
            ))}
            {filtered.length > 200 && (
              <li className="py-3 text-center text-xs text-muted-foreground">仅显示前 200 条，请细化关键词</li>
            )}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
