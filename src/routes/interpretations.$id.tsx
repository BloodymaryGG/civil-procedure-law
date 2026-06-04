import { ChevronLeft, BookOpen } from "lucide-react";
import { SiteHeader, SiteFooter, ArticleBody, ArticleNav } from "@/components/site-chrome";
import { interpretations } from "@/data/interpretations";

export function InterpretationDetail({ id }: { id: string }) {
  const item = interpretations.find((i) => i.id === id);
  if (!item) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 grid place-items-center">
          <a href="#/interpretations" className="text-accent">← 返回司法解释列表</a>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // 同章节前后导航
  const sameDoc = interpretations.filter((i) => i.doc === item.doc);
  const idx = sameDoc.findIndex((i) => i.id === item.id);
  const prev = idx > 0 ? sameDoc[idx - 1] : null;
  const next = idx >= 0 && idx < sameDoc.length - 1 ? sameDoc[idx + 1] : null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-10">
        <a href="#/interpretations" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent">
          <ChevronLeft className="h-3.5 w-3.5" /> 返回司法解释列表
        </a>

        <article className="mt-4 overflow-hidden rounded-md border border-border bg-card shadow-card">
          <header className="relative border-b border-border bg-parchment px-8 py-7">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-gold to-gold/40" />
            <div className="text-xs text-muted-foreground">最高人民法院</div>
            <h1 className="mt-1 font-serif text-2xl text-foreground">
              《{item.doc}》 第 <span className="text-accent">{item.number}</span> 条
            </h1>
            {item.chapter && <div className="mt-1 text-sm text-muted-foreground">{item.chapter}</div>}
          </header>

          <div className="px-8 py-8">
            <ArticleBody paragraphs={item.paragraphs} />
          </div>

          <footer className="border-t border-border bg-parchment/50 px-8 py-4 text-sm">
            <ArticleNav
              prev={
                prev ? (
                  <a href={`#/interpretations/${prev.id}`} className="flex items-center gap-1 text-muted-foreground hover:text-accent">
                    <ChevronLeft className="h-4 w-4" /> 第 {prev.number} 条
                  </a>
                ) : null
              }
              center={
                <a href="#/interpretations" className="text-xs text-muted-foreground hover:text-accent">目录</a>
              }
              next={
                next ? (
                  <a href={`#/interpretations/${next.id}`} className="flex items-center gap-1 text-muted-foreground hover:text-accent">
                    第 {next.number} 条 →
                  </a>
                ) : null
              }
            />
          </footer>
        </article>

        {item.relatedLawArticles.length > 0 && (
          <section className="mt-8">
            <h2 className="flex items-center gap-2 font-serif text-lg text-foreground border-b border-border pb-2">
              <BookOpen className="h-4 w-4 text-gold" /> 解释对象 · 民事诉讼法条文
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {item.relatedLawArticles.map((n) => (
                <li key={n}>
                  <a
                    href={`#/law/${n}`}
                    className="block rounded-md border border-border bg-card p-3 text-sm hover:border-gold hover:text-accent"
                  >
                    → 民事诉讼法 第 {n} 条
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
