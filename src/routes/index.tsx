import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Scale, ShieldCheck, Sparkles, BookOpen, ChevronLeft, ChevronRight, ArrowLeftRight } from "lucide-react";
import { lawArticles, lawChapters, TOTAL_LAW_ARTICLES } from "@/data/law-articles";
import { interpretations, interpChapters, TOTAL_INTERP_ARTICLES } from "@/data/interpretations";
import type { InterpretationArticle } from "@/data/types";
import { ArticleBody, ArticleNav } from "@/components/site-chrome";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import { searchAll, highlight as searchHighlight } from "@/lib/search";

/* ─────────────────── 中文条号解析 ─────────────────── */
const CN: Record<string, number> = { 零:0, 一:1, 二:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9, 十:10, 百:100 };
function cnToNum(s: string) {
  let r = 0, cur = 0;
  for (const ch of s) {
    const n = CN[ch];
    if (n === undefined) continue;
    if (n === 10 || n === 100) { cur = cur === 0 ? 1 : cur; r += cur * n; cur = 0; }
    else cur = cur * 10 + n;
  }
  return r + cur;
}
function parseArticleQuery(raw: string, max: number): number | null {
  const s = raw.trim();
  if (!s) return null;
  const d = parseInt(s.replace(/[^\d]/g, ""), 10);
  if (!isNaN(d) && d >= 1 && d <= max) return d;
  const m = s.match(/第?([一二三四五六七八九十百零]+)条?/);
  if (m) { const n = cnToNum(m[1]); if (n >= 1 && n <= max) return n; }
  return null;
}

const lawArticleMap = new Map(lawArticles.map((a) => [a.number, a]));
const interpArticleMap = new Map(interpretations.map((a) => [a.number, a]));

type SearchResult = {
  type: "law" | "interp";
  number: number;
  title: string;
  chapter: string;
  snippet: string;
};

/* ─────────────────── Workbench ─────────────────── */
export function Workbench() {
  const [theme, setTheme] = useState<"dark" | "white" | "green">("dark");
  const [mode, setMode] = useState<"law" | "interpretation">("law");
  const [current, setCurrent] = useState(1);
  const [search, setSearch] = useState("");

  const [mounted, setMounted] = useState(false);
  const [mobileTab, setMobileTab] = useState<"article" | "side">("article");
  const centerScrollRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const tocActiveRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const totalArticles = mode === "law" ? TOTAL_LAW_ARTICLES : TOTAL_INTERP_ARTICLES;
  const chapters = mode === "law" ? lawChapters : interpChapters;
  const articleMap = mode === "law" ? lawArticleMap : interpArticleMap;
  const currentArticle = articleMap.get(current) ?? null;

  const chapter = useMemo(
    () => chapters.find((c: any) => current >= c.articleStart && current <= c.articleEnd),
    [current, chapters]
  );

  useEffect(() => {
    setMounted(true);
    const hash = decodeURIComponent(window.location.hash.replace("#", ""));
    if (hash.startsWith("interpretation/")) {
      setMode("interpretation");
      const n = parseInt(hash.replace("interpretation/", ""), 10);
      if (!isNaN(n) && n >= 1 && n <= TOTAL_INTERP_ARTICLES) setCurrent(n);
    } else {
      const n = parseArticleQuery(hash, TOTAL_LAW_ARTICLES);
      if (n) setCurrent(n);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const prefix = mode === "interpretation" ? "interpretation/" : "第";
    const suffix = mode === "interpretation" ? current : `${current}条`;
    window.history.replaceState(null, "", `#${prefix}${suffix}`);
    centerScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    tocActiveRef.current?.scrollIntoView({ block: "nearest" });
    rightPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [current, mode, mounted]);

  /* ── 搜索：法条 + 司法解释（使用 lib/search.ts 的多关键词检索） ── */
  const searchHits = useMemo((): SearchResult[] => {
    const q = search.trim();
    if (!q) return [];
    return searchAll(q, 999).map((h) => ({
      type: h.type === "law" ? "law" as const : "interp" as const,
      number: h.article.number,
      title: h.type === "law" ? h.article.title ?? "" : "民诉法解释",
      chapter: h.type === "law" ? h.article.chapterTitle : (h.article as InterpretationArticle).chapter ?? "",
      snippet: h.snippet,
    }));
  }, [search]);

  const relatedInterps = useMemo(
    () => interpretations.filter((i) => i.relatedLawArticles.includes(current)),
    [current]
  );

  const relatedLaws = useMemo(() => {
    if (mode !== "interpretation" || !currentArticle) return [];
    const c = currentArticle as InterpretationArticle;
    return c.relatedLawArticles.map((n) => lawArticleMap.get(n)).filter(Boolean);
  }, [current, mode, currentArticle]);

  const goTo = (n: number, targetMode?: "law" | "interpretation") => {
    const max = targetMode === "interpretation" ? TOTAL_INTERP_ARTICLES
      : targetMode === "law" ? TOTAL_LAW_ARTICLES
      : totalArticles;
    if (n >= 1 && n <= max) {
      if (targetMode) setMode(targetMode);
      setCurrent(n);
      setSearch("");
    }
  };

  const toggleMode = () => {
    setMode(mode === "law" ? "interpretation" : "law");
    setCurrent(1);
    setSearch("");
  };

  const cycleTheme = () => {
    setTheme(t => t === "dark" ? "white" : t === "white" ? "green" : "dark");
  };

  const prev = current > 1 ? current - 1 : null;
  const next = current < totalArticles ? current + 1 : null;

  /* ── Mobile ── */
  if (isMobile) {
    return (
      <div className="h-dvh grid grid-rows-[auto_1fr_auto] overflow-hidden" data-theme={theme}>
        {/* 页眉 */}
        <header className="border-b border-[#3a4f6b]"
          style={{padding: '0.5rem 0.75rem', paddingTop: 'max(0.5rem, env(safe-area-inset-top))', background: 'var(--theme-bg)'}}>
          <div className="flex items-center justify-between mb-1.5">
            <button onClick={() => setMobileTab(mobileTab === "article" ? "side" : "article")}
              className="rounded border border-[#3a4f6b] bg-[#1a2332] px-2.5 py-1.5 text-xs text-[#e8edf4]">📑 目录</button>
            <div className="flex items-center gap-1.5">
              <button onClick={cycleTheme} title="切换主题"
                className="grid h-7 w-7 place-items-center rounded border border-[#d4a853]/30 bg-[#d4a853]/10 text-xs text-[#d4a853]">⚖</button>
              <button onClick={toggleMode}
                className="rounded border border-[#d4a853]/40 px-2 py-1.5 text-[11px] text-[#d4a853]">{mode === "law" ? "⇄ 司法解释" : "⇄ 法条"}</button>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94a3b8]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索 用空格分隔多词"
              className="w-full rounded border border-[#3a4f6b] bg-[#0f1419] py-1.5 pl-8 pr-2 text-xs outline-none placeholder:text-[#94a3b8]/60 focus:border-[#3b82f6]" />
            {search && searchHits.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-40 max-h-60 overflow-y-auto rounded border border-[#3a4f6b] bg-[#1a2332] shadow-xl">
                {searchHits.map((h, idx) => (
                  <button key={idx}
                    onClick={() => { goTo(h.number, h.type === "law" ? "law" : "interpretation"); setSearch(""); }}
                    className="block w-full border-b border-[#3a4f6b]/50 px-3 py-2 text-left hover:bg-[#2d3d56]">
                    <span className={`text-[10px] ${h.type === "law" ? "text-[#3b82f6]" : "text-[#d4a853]"}`}>
                      {h.type === "law" ? `第${h.number}条` : `解释${h.number}条`}
                    </span>
                    <p className="text-xs truncate text-[#e8edf4]/70" dangerouslySetInnerHTML={{__html: highlight(h.snippet, search)}} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* 正文 */}
        <main className="overflow-y-auto">
          {mobileTab === "article" ? (
            <div className="px-4 py-4">
              <div className="article-chapter-badge">
                {chapter && <span>{(chapter as any).chapter || (chapter as any).chapterTitle}</span>}
              </div>
              <h3 className="article-section-title">
                {mode === "law" ? `第 ${current} 条` : `民诉法解释 第 ${current} 条`}
              </h3>
              {currentArticle ? (
                <>
                  <ArticleBody paragraphs={(currentArticle as any).paragraphs} variant="dark" />
                  {mode === "law" ? (
                    relatedInterps.length > 0 && (
                      <div className="related-card mt-6">
                        <div className="related-card-header">⚖️ 关联司法解释</div>
                        <div className="space-y-2">
                          {relatedInterps.map((item) => (
                            <button key={item.id}
                              onClick={() => { goTo(item.number, "interpretation"); }}
                              className="related-card-item">
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="text-[#d4a853]">解释</span>
                                <span className="font-mono text-[#3b82f6]">第{item.number}条</span>
                                {item.chapter && <span className="text-[#94a3b8] truncate">· {item.chapter}</span>}
                              </div>
                              <p className="mt-1 text-[11px] leading-relaxed text-[#e8edf4]/70 line-clamp-2">{item.paragraphs[0]}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  ) : (
                    relatedLaws.length > 0 && (
                      <div className="related-card mt-6" style={{borderColor: 'rgba(59,130,246,0.25)'}}>
                        <div className="related-card-header" style={{color: '#3b82f6'}}>📜 关联法条</div>
                        <div className="space-y-2">
                          {relatedLaws.map((a: any) => (
                            <button key={a.number}
                              onClick={() => { goTo(a.number, "law"); }}
                              className="related-card-item">
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="text-[#3b82f6]">法条</span>
                                <span className="font-mono text-[#3b82f6]">第{a.number}条</span>
                                {a.title && <span className="text-[#94a3b8] truncate">· {a.title}</span>}
                              </div>
                              <p className="mt-1 text-[11px] leading-relaxed text-[#e8edf4]/70 line-clamp-2">{a.paragraphs[0]}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </>
              ) : (
                <div className="rounded border border-dashed border-[#3a4f6b] p-6 text-center text-[#94a3b8] text-xs">暂无内容</div>
              )}
            </div>
          ) : (
            <div className="p-3">
              {(chapters as any[]).map((c: any) => {
                const isActiveChapter = chapter?.id === c.id;
                return (
                  <div key={c.id} className="mb-2">
                    <div className={`text-[11px] ${isActiveChapter ? "text-[#d4a853]" : "text-[#94a3b8]"} mb-1`}>
                      {c.chapter || c.chapterTitle}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {range(c.articleStart, c.articleEnd).map((n) => (
                        <button key={n} ref={n === current ? tocActiveRef : undefined}
                          onClick={() => { goTo(n); setMobileTab("article"); }}
                          className={`min-w-[1.8rem] rounded px-1 py-0.5 text-[10px] font-mono ${
                            n === current ? "bg-[#3b82f6] text-white" : "bg-[#243044] text-[#e8edf4]/70"
                          }`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* 页脚 */}
        <footer className="border-t border-[#3a4f6b]"
          style={{padding: '0.5rem 0.75rem', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))', background: 'var(--theme-panel)'}}>
          <div className="flex items-center justify-between">
            <button disabled={!prev} onClick={() => prev && goTo(prev)}
              className="rounded border border-[#3a4f6b] bg-[#0f1419] px-3 py-1.5 text-xs text-[#e8edf4] disabled:opacity-30">← 上一条</button>
            <span className="text-xs text-[#94a3b8]">{current} / {totalArticles}</span>
            <button disabled={!next} onClick={() => next && goTo(next)}
              className="rounded border border-[#3a4f6b] bg-[#0f1419] px-3 py-1.5 text-xs text-[#e8edf4] disabled:opacity-30">下一条 →</button>
          </div>
        </footer>
      </div>
    );
  }

  /* ── Tablet ── */
  if (isTablet) {
    return (
      <div className="h-screen w-full grid overflow-hidden" data-theme={theme}
           style={{ gridTemplateColumns: "220px 1fr", gridTemplateRows: "auto 1fr" }}>
        {/* ── Header ── */}
        <header className="col-span-2 grid items-center gap-x-3 gap-y-2 px-4 py-2.5"
          style={{ borderBottom: '1px solid var(--theme-border)', background: 'linear-gradient(135deg, var(--theme-header-bg) 0%, var(--theme-bg) 100%)', gridTemplateColumns: "minmax(0,auto) 1fr auto" }}>
          <div className="flex items-center gap-2">
            <button onClick={cycleTheme} title="切换主题" className="grid h-7 w-7 place-items-center rounded-md bg-[#d4a853]/15 border border-[#d4a853]/30 cursor-pointer hover:bg-[#d4a853]/25 transition-colors">
              <Scale className="h-3.5 w-3.5 text-[#d4a853]" />
            </button>
            <h1 className="font-serif text-base font-bold text-[#d4a853] whitespace-nowrap">
              {mode === "law" ? "民事诉讼法" : "民诉法司法解释"}
            </h1>
            <span className="rounded-full border border-[#d4a853]/30 bg-[#d4a853]/12 px-1.5 py-0.5 text-[10px] text-[#d4a853] whitespace-nowrap">
              {mode === "law" ? `${TOTAL_LAW_ARTICLES}条` : `${TOTAL_INTERP_ARTICLES}条`}
            </span>
          </div>

          <div className="relative w-full justify-self-center max-w-md">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94a3b8]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && searchHits[0]) { const h = searchHits[0]; goTo(h.number, h.type === "law" ? "law" : "interpretation"); } }}
              placeholder="搜索 空格分隔多词"
              className="w-full rounded-lg border border-[#3a4f6b] bg-[#0f1419] py-1.5 pl-8 pr-2 text-xs text-[#e8edf4] outline-none placeholder:text-[#94a3b8]/60 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30" />
            {search && (
              <div className="absolute left-0 right-0 top-full z-40 max-h-72 overflow-y-auto rounded-lg border border-[#3a4f6b] bg-[#1a2332] shadow-2xl">
                {searchHits.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-[#94a3b8]">无匹配结果</div>
                ) : (
                  searchHits.map((h, idx) => (
                    <button key={`${h.type}-${h.number}-${idx}`}
                      onClick={() => { goTo(h.number, h.type === "law" ? "law" : "interpretation"); }}
                      className="block w-full border-b border-[#3a4f6b]/50 px-3 py-2 text-left hover:bg-[#2d3d56] last:border-0">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className={`rounded px-1 py-0.5 ${h.type === "law" ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "bg-[#d4a853]/20 text-[#d4a853]"}`}>
                          {h.type === "law" ? `法条 ${h.number}` : `解释 ${h.number}`}
                        </span>
                        <span className="text-[#94a3b8] truncate">{h.chapter}</span>
                      </div>
                      <div className="mt-0.5 line-clamp-1 text-xs text-[#e8edf4]/80" dangerouslySetInnerHTML={{ __html: highlight(h.snippet, search) }} />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleMode}
              className="inline-flex items-center gap-1 rounded border border-[#d4a853]/40 bg-[#d4a853]/10 px-2 py-1 text-[10px] text-[#d4a853] hover:bg-[#d4a853]/20 transition-colors whitespace-nowrap">
              <ArrowLeftRight className="h-3 w-3" />
              {mode === "law" ? "司法解释" : "法条"}
            </button>
          </div>
        </header>

        {/* ── 左栏：目录 ── */}
        <aside className="flex flex-col overflow-hidden min-h-0 border-r border-[#3a4f6b] bg-[#1a2332]">
          <div className="flex-1 overflow-y-auto p-1.5">
            {(chapters as any[]).map((c: any) => {
              const isActiveChapter = chapter?.id === c.id;
              const chapterLabel = c.chapter || c.chapterTitle;
              const partLabel = c.partTitle || "";
              return (
                <div key={c.id} className="mb-1">
                  <div className={`px-1.5 py-1 text-[10px] leading-tight rounded ${isActiveChapter ? "text-[#d4a853]" : "text-[#94a3b8]"}`}>
                    {partLabel && <div className="opacity-70">{partLabel}</div>}
                    <div className="font-medium">{chapterLabel}</div>
                  </div>
                  <div className="flex flex-wrap gap-0.5 px-1 pb-1.5">
                    {range(c.articleStart, c.articleEnd).map((n) => {
                      const active = n === current;
                      return (
                        <button key={n} ref={active ? tocActiveRef : undefined} onClick={() => goTo(n)}
                          className={`min-w-[1.6rem] rounded px-1 py-0.5 text-[10px] font-mono transition-colors ${active ? "bg-[#3b82f6] text-white shadow-sm" : "bg-[#243044] text-[#e8edf4]/70 hover:bg-[#2d3d56] hover:text-white"}`}>
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── 中栏：正文 + 关联内容 ── */}
        <main ref={centerScrollRef} className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="flex items-center gap-2 text-[11px] text-[#94a3b8]">
              {mode === "law" && <span className="rounded bg-[#3b82f6]/20 px-1.5 py-0.5 text-[#3b82f6]">法条</span>}
              {mode === "interpretation" && <span className="rounded bg-[#d4a853]/20 px-1.5 py-0.5 text-[#d4a853]">司法解释</span>}
              {chapter && <span>· {(chapter as any).chapter || (chapter as any).chapterTitle}</span>}
              <span className="ml-auto text-[10px]">{mode === "law" ? "民事诉讼法" : "《民诉法解释》"}</span>
            </div>

            {mode === "law" && currentArticle && "title" in currentArticle && currentArticle.title && (
              <h2 className="mt-2 font-serif text-base text-[#d4a853] border-b border-[#3a4f6b] pb-1.5">{(currentArticle as any).title}</h2>
            )}

            <h3 className="mt-3 text-xs text-[#94a3b8]">
              {mode === "law" ? `第 ${current} 条` : `《民诉法解释》第 ${current} 条`}
            </h3>

            {currentArticle ? (
              <ArticleBody paragraphs={(currentArticle as any).paragraphs} variant="dark" />
            ) : (
              <div className="rounded border border-dashed border-[#3a4f6b] p-6 text-center text-[#94a3b8] text-xs">该条暂无内容</div>
            )}

            {/* 关联内容（集成到正文下方） */}
            {mode === "law" ? (
              relatedInterps.length > 0 && (
                <div className="related-card mt-6">
                  <div className="related-card-header">⚖️ 关联司法解释</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {relatedInterps.map((item) => (
                      <button key={item.id}
                        onClick={() => { goTo(item.number, "interpretation"); }}
                        className="related-card-item">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-[#d4a853]">解释</span>
                          <span className="font-mono text-[#3b82f6]">第{item.number}条</span>
                          {item.chapter && <span className="text-[#94a3b8] truncate">· {item.chapter}</span>}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-[#e8edf4]/70 line-clamp-2">{item.paragraphs[0]}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )
            ) : (
              relatedLaws.length > 0 && (
                <div className="related-card mt-6" style={{borderColor: 'rgba(59,130,246,0.25)'}}>
                  <div className="related-card-header" style={{color: '#3b82f6'}}>📜 关联法条</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {relatedLaws.map((a: any) => (
                      <button key={a.number}
                        onClick={() => { goTo(a.number, "law"); }}
                        className="related-card-item">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-[#3b82f6]">法条</span>
                          <span className="font-mono text-[#3b82f6]">第{a.number}条</span>
                          {a.title && <span className="text-[#94a3b8] truncate">· {a.title}</span>}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-[#e8edf4]/70 line-clamp-2">{a.paragraphs[0]}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          {/* 翻页导航 */}
          <div className="border-t border-[#3a4f6b] bg-[#1a2332] px-6 py-3">
            <ArticleNav
              prev={
                <button disabled={!prev} onClick={() => prev && goTo(prev)}
                  className="inline-flex items-center gap-1 rounded border border-[#3a4f6b] bg-[#0f1419] px-2.5 py-1.5 text-xs text-[#e8edf4] disabled:opacity-30 hover:border-[#3b82f6]">
                  <ChevronLeft className="h-3.5 w-3.5" /> {prev ? `第 ${prev} 条` : "已是首条"}
                </button>
              }
              center={<span className="text-[11px] text-[#94a3b8]">第 {current} 条 / {totalArticles}</span>}
              next={
                <button disabled={!next} onClick={() => next && goTo(next)}
                  className="inline-flex items-center gap-1 rounded border border-[#3a4f6b] bg-[#0f1419] px-2.5 py-1.5 text-xs text-[#e8edf4] disabled:opacity-30 hover:border-[#3b82f6]">
                  {next ? `第 ${next} 条` : "已是末条"} <ChevronRight className="h-3.5 w-3.5" />
                </button>
              }
            />
          </div>
        </main>
      </div>
    );
  }

  /* ── Desktop ── */
  return (
    <div className="h-screen w-full grid overflow-hidden" data-theme={theme}
         style={{ gridTemplateColumns: "280px 1fr minmax(360px, 420px)", gridTemplateRows: "auto 1fr" }}>
      {/* ── Header ── */}
      <header className="col-span-3 grid items-center gap-x-4 gap-y-2 px-5 py-3"
        style={{ borderBottom: '1px solid var(--theme-border)', background: 'linear-gradient(135deg, var(--theme-header-bg) 0%, var(--theme-bg) 100%)', gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 36rem) minmax(0, 1fr)" }}>
        <div className="flex min-w-0 items-center gap-2.5">
          <button onClick={cycleTheme} title="切换主题" className="grid h-8 w-8 place-items-center rounded-md bg-[#d4a853]/15 border border-[#d4a853]/30 cursor-pointer hover:bg-[#d4a853]/25 transition-colors">
            <Scale className="h-4 w-4 text-[#d4a853]" />
          </button>
          <h1 className="font-serif text-lg font-bold text-[#d4a853] whitespace-nowrap">
            {mode === "law" ? "民事诉讼法及司法解释" : "民诉法司法解释"}
          </h1>
          <span className="hidden lg:inline rounded-full border border-[#d4a853]/30 bg-[#d4a853]/12 px-2 py-0.5 text-[11px] text-[#d4a853] whitespace-nowrap">
            {mode === "law" ? `民诉法 · ${TOTAL_LAW_ARTICLES} 条` : `司法解释 · ${TOTAL_INTERP_ARTICLES} 条`}
          </span>
        </div>

        {/* 搜索 */}
        <div className="relative w-full justify-self-center">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchHits[0]) {
                const h = searchHits[0];
                goTo(h.number, h.type === "law" ? "law" : "interpretation");
              }
            }}
            placeholder="搜索 用空格隔开多个关键词"
            className="w-full rounded-lg border border-[#3a4f6b] bg-[#0f1419] py-2 pl-9 pr-3 text-sm text-[#e8edf4] outline-none placeholder:text-[#94a3b8]/70 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/30" />
          {search && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-96 overflow-y-auto rounded-lg border border-[#3a4f6b] bg-[#1a2332] shadow-2xl">
              {searchHits.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[#94a3b8]">无匹配结果</div>
              ) : (
                searchHits.map((h, idx) => (
                  <button key={`${h.type}-${h.number}-${idx}`}
                    onClick={() => { goTo(h.number, h.type === "law" ? "law" : "interpretation"); }}
                    className="block w-full border-b border-[#3a4f6b]/50 px-4 py-2.5 text-left hover:bg-[#2d3d56] last:border-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`rounded px-1.5 py-0.5 ${h.type === "law" ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "bg-[#d4a853]/20 text-[#d4a853]"}`}>
                        {h.type === "law" ? `法条 第 ${h.number} 条` : `司法解释 第 ${h.number} 条`}
                      </span>
                      <span className="text-[#94a3b8] truncate">{h.chapter}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm text-[#e8edf4]/90" dangerouslySetInnerHTML={{
                      __html: highlight(h.snippet, search)
                    }} />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex min-w-0 items-center justify-end gap-3 text-xs">
          <button onClick={toggleMode}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#d4a853] bg-[#d4a853]/10 px-3 py-1.5 text-[#d4a853] hover:bg-[#d4a853]/20 transition-colors">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            {mode === "law" ? "司法解释库" : "民诉法条"}
          </button>
          <div className="hidden xl:flex flex-col items-end leading-tight text-[#94a3b8]">
            <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-[#d4a853]" /> 制作人　梨花开　SQH</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-[#d4a853]" /> 仅供学习研究使用</span>
          </div>
        </div>
      </header>

      {/* ── 左栏：目录 ── */}
      <aside className="flex flex-col overflow-hidden min-h-0 border-r border-[#3a4f6b] bg-[#1a2332]">
        <div className="flex-1 overflow-y-auto p-2">
          {(chapters as any[]).map((c: any) => {
            const isActiveChapter = chapter?.id === c.id;
            const chapterLabel = c.chapter || c.chapterTitle;
            const partLabel = c.partTitle || "";
            return (
              <div key={c.id} className="mb-1.5">
                <div className={`px-2 py-1.5 text-[11px] leading-snug rounded ${isActiveChapter ? "text-[#d4a853]" : "text-[#94a3b8]"}`}>
                  {partLabel && <div className="opacity-70">{partLabel}</div>}
                  <div className="font-medium">{chapterLabel}</div>
                </div>
                <div className="flex flex-wrap gap-1 px-1 pb-2">
                  {range(c.articleStart, c.articleEnd).map((n) => {
                    const active = n === current;
                    return (
                      <button key={n} ref={active ? tocActiveRef : undefined} onClick={() => goTo(n)}
                        className={`min-w-[2rem] rounded px-1.5 py-1 text-[11px] font-mono transition-colors ${
                          active ? "bg-[#3b82f6] text-white shadow-sm" : "bg-[#243044] text-[#e8edf4]/80 hover:bg-[#2d3d56] hover:text-white"
                        }`}>
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── 中栏：正文 ── */}
      <main ref={centerScrollRef} className="flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
            {mode === "law" && <span className="rounded bg-[#3b82f6]/20 px-1.5 py-0.5 text-[#3b82f6]">法条</span>}
            {mode === "interpretation" && <span className="rounded bg-[#d4a853]/20 px-1.5 py-0.5 text-[#d4a853]">司法解释</span>}
            {chapter && <span>· {(chapter as any).chapter || (chapter as any).chapterTitle}</span>}
            <span className="ml-auto">{mode === "law" ? "民事诉讼法" : "最高人民法院关于适用《中华人民共和国民事诉讼法》的解释"}</span>
          </div>

          {mode === "law" && currentArticle && "title" in currentArticle && currentArticle.title && (
            <h2 className="mt-3 font-serif text-lg text-[#d4a853] border-b border-[#3a4f6b] pb-2">
              {(currentArticle as any).title}
            </h2>
          )}

          <h3 className="mt-4 text-sm text-[#94a3b8]">
            {mode === "law" ? `第 ${current} 条` : `《民诉法解释》第 ${current} 条`}
          </h3>

          {currentArticle ? (
            <ArticleBody paragraphs={(currentArticle as any).paragraphs} variant="dark" />
          ) : (
            <div className="rounded border border-dashed border-[#3a4f6b] p-8 text-center text-[#94a3b8]">该条暂无内容</div>
          )}
        </div>

        {/* 翻页导航 - 固定在底部 */}
        <div className="border-t border-[#3a4f6b] bg-[#1a2332] px-8 py-4">
          <ArticleNav
            prev={
              <button disabled={!prev} onClick={() => prev && goTo(prev)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#3a4f6b] bg-[#0f1419] px-3 py-2 text-sm text-[#e8edf4] disabled:opacity-30 hover:border-[#3b82f6]">
                <ChevronLeft className="h-4 w-4" /> {prev ? `第 ${prev} 条` : "已是首条"}
              </button>
            }
            center={<span className="text-xs text-[#94a3b8]">第 {current} 条 / {totalArticles}</span>}
            next={
              <button disabled={!next} onClick={() => next && goTo(next)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#3a4f6b] bg-[#0f1419] px-3 py-2 text-sm text-[#e8edf4] disabled:opacity-30 hover:border-[#3b82f6]">
                {next ? `第 ${next} 条` : "已是末条"} <ChevronRight className="h-4 w-4" />
              </button>
            }
          />
        </div>
      </main>

      {/* ── 右栏：关联信息 ── */}
      <aside ref={rightPanelRef as React.RefObject<HTMLDivElement>} className="flex flex-col overflow-y-auto border-l border-[#3a4f6b] bg-[#1a2332] p-5">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-[#d4a853] border-b border-[#3a4f6b] pb-2 mb-3">
          <BookOpen className="h-3.5 w-3.5" />
          {mode === "law" ? "关联司法解释" : "关联法条"}
        </h4>

        {mode === "law" ? (
          relatedInterps.length === 0 ? (
            <div className="rounded border border-dashed border-[#3a4f6b] p-4 text-center text-xs text-[#94a3b8]">本条暂无直接关联的司法解释</div>
          ) : (
            <div className="space-y-2">
              {relatedInterps.map((item) => (
                <button key={item.id}
                  onClick={() => { goTo(item.number, "interpretation"); }}
                  className="block w-full text-left rounded-md border border-[#3a4f6b] bg-[#243044] p-3 transition-all hover:border-[#d4a853] hover:shadow-lg">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="rounded bg-[#d4a853]/15 px-1.5 py-0.5 text-[#d4a853]">{item.doc}</span>
                    <span className="font-mono text-[#3b82f6]">第 {item.number} 条</span>
                    {item.chapter && <span className="truncate text-[#94a3b8]">· {item.chapter}</span>}
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#e8edf4]/85">{item.paragraphs[0]}</p>
                </button>
              ))}
            </div>
          )
        ) : (
          relatedLaws.length === 0 ? (
            <div className="rounded border border-dashed border-[#3a4f6b] p-4 text-center text-xs text-[#94a3b8]">本条暂无直接关联的法条</div>
          ) : (
            <div className="space-y-2">
              {relatedLaws.map((a: any) => (
                <button key={a.number}
                  onClick={() => { goTo(a.number, "law"); }}
                  className="block w-full text-left rounded-md border border-[#3a4f6b] bg-[#243044] p-3 transition-all hover:border-[#3b82f6] hover:shadow-lg">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="rounded bg-[#3b82f6]/15 px-1.5 py-0.5 text-[#3b82f6]">法条</span>
                    <span className="font-mono text-[#3b82f6]">第 {a.number} 条</span>
                    {a.title && <span className="truncate text-[#94a3b8]">· {a.title}</span>}
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#e8edf4]/85">{a.paragraphs[0]}</p>
                </button>
              ))}
            </div>
          )
        )}
      </aside>
    </div>
  );
}

function range(a: number, b: number) {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

function highlight(text: string, q: string) {
  const t = text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
  const k = q.trim();
  if (!k || k.length < 1) return t;
  const keywords = k.split(/[\s,，、]+/).filter(Boolean);
  let result = t;
  for (const kw of keywords) {
    if (kw.length < 1) continue;
    try {
      const re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      result = result.replace(re, `<mark style="background:#d4a853;color:#0f1419;padding:0 2px;border-radius:2px">$&</mark>`);
    } catch {}
  }
  return result;
}
