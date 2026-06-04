import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader, SiteFooter, ArticleBody, ArticleNav } from "@/components/site-chrome";
import { lawArticles, lawChapters, TOTAL_LAW_ARTICLES } from "@/data/law-articles";
import { interpretations } from "@/data/interpretations";
import { ChevronLeft, ChevronRight, BookOpen, Link2 } from "lucide-react";

export const Route = createFileRoute("/law/$articleNumber")({
  head: ({ params }) => ({
    meta: [
      { title: `民事诉讼法 第${params.articleNumber}条 · 全文与司法解释` },
      { name: "description", content: `中华人民共和国民事诉讼法第${params.articleNumber}条条文原文及配套司法解释。` },
    ],
  }),
  component: ArticleDetail,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 grid place-items-center px-4">
        <div className="text-center">
          <div className="font-serif text-5xl text-muted-foreground">404</div>
          <p className="mt-2 text-muted-foreground">未找到该条文</p>
          <Link to="/law" className="mt-4 inline-block text-accent hover:text-gold">← 返回法条目录</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  ),
});

function ArticleDetail() {
  const { articleNumber } = Route.useParams();
  const num = parseInt(articleNumber, 10);
  if (isNaN(num) || num < 1 || num > TOTAL_LAW_ARTICLES) throw notFound();

  const article = lawArticles.find((a) => a.number === num);
  const chapter = lawChapters.find((c) => num >= c.articleStart && num <= c.articleEnd);
  const relatedInterps = interpretations.filter((i) => i.relatedLawArticles.includes(num));

  const prevNum = num > 1 ? num - 1 : null;
  const nextNum = num < TOTAL_LAW_ARTICLES ? num + 1 : null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground">
          <Link to="/law" className="hover:text-accent">民事诉讼法</Link>
          {chapter && (
            <>
              <span className="mx-2">/</span>
              <span>{chapter.partTitle}</span>
              <span className="mx-2">/</span>
              <span>{chapter.chapterTitle}</span>
            </>
          )}
        </nav>

        {/* Article card */}
        <article className="mt-6 overflow-hidden rounded-md border border-border bg-card shadow-card">
          <header className="relative border-b border-border bg-parchment px-8 py-7">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-gold to-gold/40" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" /> 中华人民共和国民事诉讼法
            </div>
            <h1 className="mt-2 font-serif text-3xl text-foreground">
              第 <span className="text-accent">{num}</span> 条
            </h1>
            {chapter && (
              <div className="mt-1 text-sm text-muted-foreground">
                {chapter.partTitle} · {chapter.chapterTitle}
                {article?.sectionTitle ? ` · ${article.sectionTitle}` : ""}
              </div>
            )}
          </header>

          <div className="px-8 py-8">
            {article ? (
              <ArticleBody paragraphs={article.paragraphs} />
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                第 {num} 条暂无内容。
              </div>
            )}
          </div>

          <footer className="border-t border-border bg-parchment/50 px-8 py-4 text-sm">
            <ArticleNav
              prev={
                prevNum ? (
                  <Link to="/law/$articleNumber" params={{ articleNumber: String(prevNum) }} className="flex items-center gap-1 text-muted-foreground hover:text-accent">
                    <ChevronLeft className="h-4 w-4" /> 第 {prevNum} 条
                  </Link>
                ) : null
              }
              center={
                <Link to="/law" className="text-xs text-muted-foreground hover:text-accent">目录</Link>
              }
              next={
                nextNum ? (
                  <Link to="/law/$articleNumber" params={{ articleNumber: String(nextNum) }} className="flex items-center gap-1 text-muted-foreground hover:text-accent">
                    第 {nextNum} 条 <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : null
              }
            />
          </footer>
        </article>

        {/* Related interpretations */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-serif text-xl text-foreground border-b border-border pb-2">
            <Link2 className="h-5 w-5 text-gold" />
            关联司法解释
            <span className="text-sm font-sans text-muted-foreground">（{relatedInterps.length}）</span>
          </h2>

          {relatedInterps.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">暂无直接关联的司法解释。</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {relatedInterps.map((i) => (
                <li key={i.id}>
                  <Link
                    to="/interpretations/$id"
                    params={{ id: i.id }}
                    className="block rounded-md border border-border bg-card p-4 transition-all hover:border-gold hover:shadow-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-accent">《{i.doc}》 第 {i.number} 条</div>
                      {i.chapter && <div className="text-xs text-muted-foreground">{i.chapter}</div>}
                    </div>
                    <p className="mt-2 article-text text-sm text-foreground line-clamp-3">{i.paragraphs[0]}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
