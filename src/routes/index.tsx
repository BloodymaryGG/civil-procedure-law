import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Library, Scale, Sparkles, ChevronLeft, ChevronRight, ExternalLink, Hash, ListTree } from "lucide-react";
import { lawArticles, lawChapters, TOTAL_LAW_ARTICLES } from "@/data/law-articles";
import { interpretations } from "@/data/interpretations";
import type { InterpretationArticle } from "@/data/types";
import { ArticleBody, ArticleNav } from "@/components/site-chrome";
import { useIsMobile } from "@/hooks/use-mobile";

/* ─────────────────────── 中文条号解析 ─────────────────────── */
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
export function parseArticleQuery(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  const d = parseInt(s.replace(/[^\d]/g, ""), 10);
  if (!isNaN(d) && d >= 1 && d <= TOTAL_LAW_ARTICLES) return d;
  const m = s.match(/第?([一二三四五六七八九十百零]+)条?/);
  if (m) { const n = cnToNum(m[1]); if (n >= 1 && n <= TOTAL_LAW_ARTICLES) return n; }
  return null;
}

const articleMap = new Map(lawArticles.map((a) => [a.number, a]));

/* ─────────────────────── Workbench ─────────────────────── */
export function Workbench() {
  const [current, setCurrent] = useState(1);
  const [search, setSearch] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"toc" | "jump">("toc");

  const [jumpInput, setJumpInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [mobileTab, setMobileTab] = useState<"article" | "side" | "panel">("article");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const centerScrollRef = useRef<HTMLDivElement>(null);
  const tocActiveRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
    const hash = decodeURIComponent(window.location.hash.replace("#", ""));
    const n = parseArticleQuery(hash);
    if (n) setCurrent(n);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.history.replaceState(null, "", `#第${current}条`);
    centerScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    tocActiveRef.current?.scrollIntoView({ block: "nearest" });
  }, [current, mounted]);

  const article = articleMap.get(current);
  const chapter = useMemo(() => lawChapters.find((c) => current >= c.articleStart && current <= c.articleEnd), [current]);

  const searchHits = useMemo(() => {
    const q = search.trim();
    if (!q) return [];
    const n = parseArticleQuery(q);
    if (n) {
      const a = articleMap.get(n);
      return a ? [a] : [];
    }
    // 全文搜索（包含所有匹配）：标题匹配优先
    return lawArticles
      .filter((a) => a.title?.includes(q) || a.paragraphs.some((p) => p.includes(q)))
      .sort((a, b) => {
        const aTitle = a.title?.includes(q) ? 1 : 0;
        const bTitle = b.title?.includes(q) ? 1 : 0;
        return bTitle - aTitle;
      })
      .slice(0, 30);
  }, [search]);

  const relatedInterps = useMemo(
    () => interpretations.filter((i) => i.relatedLawArticles.includes(current)),
    [current]
  );

  const goTo = (n: number) => {
    if (!articleMap.get(n)) return;
    setCurrent(n);
    setSearch("");
  };

  const prev = current > 1 ? current - 1 : null;
  const next = current < TOTAL_LAW_ARTICLES ? current + 1 : null;

  // ── Mobile Layout ──
  if (isMobile) {
    return <MobileLayout
      current={current} search={search} setSearch={setSearch}
      searchHits={searchHits} goTo={goTo} parseArticleQuery={parseArticleQuery}
      article={article} chapter={chapter} prev={prev} next={next}
      mobileTab={mobileTab} setMobileTab={setMobileTab}
      showMobileSearch={showMobileSearch} setShowMobileSearch={setShowMobileSearch}
      sidebarTab={sidebarTab} setSidebarTab={setSidebarTab}
      jumpInput={jumpInput} setJumpInput={setJumpInput}
      relatedInterps={relatedInterps}
      tocActiveRef={tocActiveRef}
    />;
  }

  // ── Desktop Layout ──
  return (
    <div className="h-screen w-full grid overflow-hidden bg-[#0f1419] text-[#e8edf4]"
         style={{ gridTemplateColumns: "280px 1fr minmax(360px, 420px)", gridTemplateRows: "auto 1fr" }}>
      {/* ───── Header ───── */}
      <header
        className="col-span-3 grid items-center gap-x-4 gap-y-2 border-b border-[#3a4f6b] px-5 py-3"
        style={{
          background: "linear-gradient(135deg, #1a2332 0%, #0f1419 100%)",
          gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 36rem) minmax(0, 1fr)",
        }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-[#d4a853]/15 border border-[#d4a853]/30">
            <Scale className="h-4 w-4 text-[#d4a853]" />
          </div>
          <h1 className="font-serif text-lg font-bold text-[#d4a853] whitespace-nowrap">
            民事诉讼法及司法解释
          </h1>
          <span className="hidden lg:inline rounded-full border border-[#d4a853]/30 bg-[#d4a853]/12 px-2 py-0.5 text-[11px] text-[#d4a853]">
            民诉法 · 司法解释 · {TOTAL_LAW_ARTICLES} 条
          </span>
        </div>

        {/* 搜索 */}
        <div className="relative w-full justify-self-center">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const n = parseArticleQuery(search);
                if (n) goTo(n);
                else if (searchHits[0]) goTo(searchHits[0].number);
              }
            }}
            placeholder="搜索条号或关键词"
            className="w-full rounded-lg border border-[#3a4f6b] bg-[#0f1419] py-2 pl-9 pr-3 text-sm text-[#e8edf4] outline-none placeholder:text-[#94a3b8]/70 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/30"
          />
          {search && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-96 overflow-y-auto rounded-lg border border-[#3a4f6b] bg-[#1a2332] shadow-2xl">
              {searchHits.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[#94a3b8]">无匹配结果</div>
              ) : (
                searchHits.map((a) => (
                  <button
                    key={a.number}
                    onClick={() => goTo(a.number)}
                    className="block w-full border-b border-[#3a4f6b]/50 px-4 py-2.5 text-left hover:bg-[#2d3d56] last:border-0"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded bg-[#3b82f6]/20 px-1.5 py-0.5 text-[#3b82f6]">第 {a.number} 条</span>
                      <span className="text-[#94a3b8] truncate">{a.chapterTitle.trim()}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm text-[#e8edf4]/90" dangerouslySetInnerHTML={{
                      __html: highlight(a.paragraphs[0] ?? "", search)
                    }} />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex min-w-0 items-center justify-end gap-3 text-xs">
          <a href="#/interpretations" className="inline-flex items-center gap-1 rounded-md border border-[#3a4f6b] bg-[#0f1419]/60 px-2.5 py-1.5 text-[#e8edf4] hover:border-[#d4a853] hover:text-[#d4a853]">
            <Library className="h-3.5 w-3.5" /> 司法解释库 <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
          <div className="hidden xl:flex flex-col items-end leading-tight text-[#94a3b8]">
            <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-[#d4a853]" /> 制作人　梨花开　SQH</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-[#d4a853]" /> 仅供学习研究使用</span>
          </div>
        </div>
      </header>

      {/* ───── 左栏：目录 / 跳转 ───── */}
      <aside className="flex flex-col overflow-hidden border-r border-[#3a4f6b] bg-[#1a2332]">
        <div className="flex border-b border-[#3a4f6b]">
          <TabBtn active={sidebarTab === "toc"} onClick={() => setSidebarTab("toc")} icon={<ListTree className="h-3.5 w-3.5" />}>目录</TabBtn>
          <TabBtn active={sidebarTab === "jump"} onClick={() => setSidebarTab("jump")} icon={<Hash className="h-3.5 w-3.5" />}>跳转</TabBtn>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {sidebarTab === "toc" ? (
            lawChapters.map((c) => {
              const isActiveChapter = chapter?.id === c.id;
              return (
                <div key={c.id} className="mb-1.5">
                  <div className={`px-2 py-1.5 text-[11px] leading-snug rounded ${isActiveChapter ? "text-[#d4a853]" : "text-[#94a3b8]"}`}>
                    <div className="opacity-70">{c.partTitle.trim()}</div>
                    <div className="font-medium">{c.chapterTitle.trim()}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 px-1 pb-2">
                    {range(c.articleStart, c.articleEnd).map((n) => {
                      const active = n === current;
                      return (
                        <button
                          key={n}
                          ref={active ? tocActiveRef : undefined}
                          onClick={() => goTo(n)}
                          className={`min-w-[2rem] rounded px-1.5 py-1 text-[11px] font-mono transition-colors ${
                            active
                              ? "bg-[#3b82f6] text-white shadow-sm"
                              : "bg-[#243044] text-[#e8edf4]/80 hover:bg-[#2d3d56] hover:text-white"
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-3 space-y-3">
              <div className="text-xs text-[#94a3b8]">
                输入条号快速定位（支持「119」「第一百一十九条」）
              </div>
              <div className="flex gap-2">
                <input
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { const n = parseArticleQuery(jumpInput); if (n) { goTo(n); setJumpInput(""); } } }}
                  placeholder="如 119"
                  className="flex-1 rounded border border-[#3a4f6b] bg-[#0f1419] px-2 py-1.5 text-sm outline-none focus:border-[#3b82f6]"
                />
                <button
                  onClick={() => { const n = parseArticleQuery(jumpInput); if (n) { goTo(n); setJumpInput(""); } }}
                  className="rounded bg-[#3b82f6] px-3 text-sm text-white hover:bg-[#2563eb]"
                >前往</button>
              </div>
              <div className="text-xs text-[#94a3b8] pt-2 border-t border-[#3a4f6b]">常用条文</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  [55, "代表人诉讼"],
                  [67, "举证责任"],
                  [122, "起诉条件"],
                  [128, "答辩"],
                  [171, "二审范围"],
                  [200, "再审事由"],
                  [236, "执行依据"],
                  [266, "执行竞合"],
                ].map(([n, label]) => (
                  <button
                    key={n}
                    onClick={() => goTo(n as number)}
                    className="rounded border border-[#3a4f6b] bg-[#243044] px-2 py-1.5 text-left text-xs hover:border-[#d4a853] hover:text-[#d4a853]"
                  >
                    <div className="font-mono text-[#3b82f6]">第 {n} 条</div>
                    <div className="text-[#94a3b8]">{label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#3a4f6b] px-3 py-2 text-[10px] text-[#94a3b8]">
          共 {TOTAL_LAW_ARTICLES} 条 · 27 章 · 4 编
        </div>
      </aside>

      {/* ───── 中栏：当前条文 ───── */}
      <section className="flex flex-col bg-[#0f1419] overflow-hidden">
        <div ref={centerScrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-8 py-8 pb-4">
            <Breadcrumb chapter={chapter} />
            <ArticleTitle current={current} article={article} />
            <ArticleContent article={article} />
          </div>
        </div>
        <div className="shrink-0 border-t border-[#3a4f6b] bg-[#1a2332] px-8 py-3">
          <div className="mx-auto max-w-3xl">
            <ArticleBottomNav
              current={current} prev={prev} next={next} goTo={goTo}
            />
          </div>
        </div>
      </section>

      {/* ───── 右栏：关联面板 ───── */}
      <aside className="flex flex-col overflow-hidden border-l border-[#3a4f6b] bg-[#1a2332]">
        <div className="flex items-center gap-2 border-b border-[#3a4f6b] px-4 py-2.5">
          <Library className="h-3.5 w-3.5 text-[#3b82f6]" />
          <span className="text-xs font-semibold text-[#e8edf4]">司法解释</span>
          <span className="ml-auto rounded bg-[#3b82f6]/20 px-1.5 text-[10px] text-[#3b82f6]">{relatedInterps.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {relatedInterps.length === 0 ? (
              <EmptyState
                title="暂无直接关联的司法解释"
                hint="该条文在《民诉法解释》《证据规定》中尚未检索到明确引用。"
              />
            ) : (
              relatedInterps.map((i) => <InterpCard key={i.id} item={i} />)
            )}
        </div>
      </aside>
    </div>
  );
}

/* ────────────── Mobile Layout ────────────── */
function MobileLayout({
  current, search, setSearch, searchHits, goTo, parseArticleQuery,
  article, chapter, prev, next,
  mobileTab, setMobileTab, showMobileSearch, setShowMobileSearch,
  sidebarTab, setSidebarTab, jumpInput, setJumpInput,
  relatedInterps, tocActiveRef,
}: {
  current: number; search: string; setSearch: (v: string) => void;
  searchHits: typeof lawArticles; goTo: (n: number) => void; parseArticleQuery: (s: string) => number | null;
  article: typeof lawArticles[number] | undefined; chapter: typeof lawChapters[number] | undefined;
  prev: number | null; next: number | null;
  mobileTab: "article" | "side" | "panel"; setMobileTab: (t: "article" | "side" | "panel") => void;
  showMobileSearch: boolean; setShowMobileSearch: (v: boolean) => void;
  sidebarTab: "toc" | "jump"; setSidebarTab: (t: "toc" | "jump") => void;
  jumpInput: string; setJumpInput: (s: string) => void;
  relatedInterps: InterpretationArticle[];
  tocActiveRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const centerScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    centerScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [current]);

  return (
    <div className="h-screen w-full flex flex-col bg-[#0f1419] text-[#e8edf4]">
      {/* Mobile header */}
      <header className="flex items-center gap-2 border-b border-[#3a4f6b] bg-[#1a2332] px-3 py-2.5 shrink-0">
        <div className="grid h-7 w-7 place-items-center rounded bg-[#d4a853]/15">
          <Scale className="h-3.5 w-3.5 text-[#d4a853]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-sm font-bold text-[#d4a853] truncate">民诉法查询</div>
          <div className="text-[10px] text-[#94a3b8]">第 {current} 条 / {TOTAL_LAW_ARTICLES}</div>
        </div>

        {/* Search toggle */}
        <button onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="rounded-md border border-[#3a4f6b] px-2.5 py-1.5 text-[11px] text-[#e8edf4]">
          <Search className="h-3.5 w-3.5" />
        </button>
        <a href="#/interpretations"
          className="rounded-md border border-[#3a4f6b] px-2.5 py-1.5 text-[11px] text-[#94a3b8]">
          <Library className="h-3.5 w-3.5" />
        </a>
      </header>

      {/* Mobile search bar (expandable) */}
      {showMobileSearch && (
        <div className="relative border-b border-[#3a4f6b] bg-[#0f1419] px-3 py-2 shrink-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const n = parseArticleQuery(search);
                if (n) goTo(n);
                else if (searchHits[0]) goTo(searchHits[0].number);
              }
            }}
            placeholder="搜索条号或关键词"
            autoFocus
            className="w-full rounded-lg border border-[#3a4f6b] bg-[#1a2332] px-3 py-2 text-sm text-[#e8edf4] outline-none placeholder:text-[#94a3b8]/70 focus:border-[#3b82f6]"
          />
          {search && (
            <div className="absolute left-3 right-3 top-full z-40 max-h-72 overflow-y-auto rounded-lg border border-[#3a4f6b] bg-[#1a2332] shadow-2xl">
              {searchHits.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[#94a3b8]">无匹配结果</div>
              ) : (
                searchHits.map((a) => (
                  <button key={a.number} onClick={() => { goTo(a.number); setShowMobileSearch(false); }}
                    className="block w-full border-b border-[#3a4f6b]/50 px-3 py-2 text-left hover:bg-[#2d3d56] last:border-0">
                    <span className="rounded bg-[#3b82f6]/20 px-1.5 py-0.5 text-[11px] text-[#3b82f6]">第 {a.number} 条</span>
                    <p className="mt-1 text-xs text-[#e8edf4]/80 line-clamp-1">{a.paragraphs[0]}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Main content area */}
      <div ref={centerScrollRef} className="flex-1 overflow-y-auto">
        <div className="px-4 py-5">
          <Breadcrumb chapter={chapter} />
          <ArticleTitle current={current} article={article} />
          <ArticleContent article={article} variant="dark" />
          <ArticleBottomNav
            current={current} prev={prev} next={next} goTo={goTo}
          />
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="flex shrink-0 border-t border-[#3a4f6b] bg-[#1a2332]">
        <MobileTab active={mobileTab === "article"} onClick={() => setMobileTab("article")} icon={<Scale className="h-4 w-4" />}>
          条文
        </MobileTab>
        <MobileTab active={mobileTab === "side"} onClick={() => setMobileTab("side")} icon={<ListTree className="h-4 w-4" />}>
          目录 · 跳转
        </MobileTab>
        <MobileTab active={mobileTab === "panel"} onClick={() => setMobileTab("panel")} icon={<BookOpen className="h-4 w-4" />}>
          关联 <span className="text-[10px] text-[#3b82f6]">{relatedInterps.length}</span>
        </MobileTab>
      </nav>

      {/* Mobile bottom panel */}
      {mobileTab === "side" && (
        <div className="flex flex-col border-t border-[#3a4f6b] bg-[#1a2332]" style={{ maxHeight: "45vh" }}>
          <div className="flex border-b border-[#3a4f6b] shrink-0">
            <TabBtn active={sidebarTab === "toc"} onClick={() => setSidebarTab("toc")} icon={<ListTree className="h-3.5 w-3.5" />}>目录</TabBtn>
            <TabBtn active={sidebarTab === "jump"} onClick={() => setSidebarTab("jump")} icon={<Hash className="h-3.5 w-3.5" />}>跳转</TabBtn>
          </div>
          <div className="overflow-y-auto p-2">
            {sidebarTab === "toc" ? (
              lawChapters.map((c) => (
                <div key={c.id} className="mb-1.5">
                  <div className={`px-2 py-1 text-[10px] leading-snug rounded ${chapter?.id === c.id ? "text-[#d4a853]" : "text-[#94a3b8]"}`}>
                    <div className="opacity-70">{c.partTitle.trim()}</div>
                    <div className="font-medium">{c.chapterTitle.trim()}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 px-1 pb-2">
                    {range(c.articleStart, c.articleEnd).map((n) => (
                      <button key={n}
                        onClick={() => { goTo(n); setMobileTab("article"); }}
                        className={`min-w-[1.75rem] rounded px-1 py-0.5 text-[10px] font-mono ${
                          n === current ? "bg-[#3b82f6] text-white" : "bg-[#243044] text-[#e8edf4]/80"
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-2 space-y-2">
                <div className="flex gap-2">
                  <input value={jumpInput} onChange={(e) => setJumpInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { const n = parseArticleQuery(jumpInput); if (n) { goTo(n); setJumpInput(""); } } }}
                    placeholder="条号如 119"
                    className="flex-1 rounded border border-[#3a4f6b] bg-[#0f1419] px-2 py-1.5 text-xs outline-none" />
                  <button onClick={() => { const n = parseArticleQuery(jumpInput); if (n) { goTo(n); setJumpInput(""); } }}
                    className="rounded bg-[#3b82f6] px-3 text-xs text-white">前往</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mobileTab === "panel" && (
        <div className="flex flex-col border-t border-[#3a4f6b] bg-[#1a2332]" style={{ maxHeight: "45vh" }}>
          <div className="flex border-b border-[#3a4f6b] shrink-0">
            <TabBtn active={true} icon={<Library className="h-3.5 w-3.5" />}>
              司法解释 <span className="text-[#3b82f6]">{relatedInterps.length}</span>
            </TabBtn>
          </div>
          <div className="overflow-y-auto p-2 space-y-2">
            {relatedInterps.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#94a3b8]">暂无关联司法解释</div>
              ) : (
                relatedInterps.map((i) => <InterpCard key={i.id} item={i} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileTab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
        active ? "text-[#d4a853] border-t-2 border-[#d4a853] bg-[#d4a853]/5" : "text-[#94a3b8]"
      }`}>
      {icon}{children}
    </button>
  );
}

/* ────────────── Shared sub-components ────────────── */
function Breadcrumb({ chapter }: { chapter: typeof lawChapters[number] | undefined }) {
  return (
    <div className="text-xs text-[#94a3b8]">
      <span>民事诉讼法</span>
      {chapter && (
        <>
          <span className="mx-2 opacity-50">›</span>
          <span>{chapter.partTitle.trim()}</span>
          <span className="mx-2 opacity-50">›</span>
          <span className="text-[#d4a853]">{chapter.chapterTitle.trim()}</span>
        </>
      )}
    </div>
  );
}

function ArticleTitle({ current, article }: { current: number; article?: typeof lawArticles[number] }) {
  return (
    <div className="mt-4 pb-6 border-b border-[#3a4f6b]">
      <div className="flex items-baseline gap-3 max-sm:flex-col max-sm:gap-1">
        <h2 className="font-serif text-4xl font-bold text-[#d4a853] max-sm:text-2xl">第 {current} 条</h2>
        {article?.title && (
          <span className="text-sm font-medium text-[#e8edf4] max-sm:ml-0.5">
            · {article.title}
          </span>
        )}
        <span className="text-xs text-[#94a3b8] ml-auto max-sm:ml-0">/ 共 {TOTAL_LAW_ARTICLES} 条</span>
      </div>
    </div>
  );
}

function ArticleContent({ article, variant }: { article: typeof lawArticles[number] | undefined; variant?: "light" | "dark" }) {
  return (
    <article className="mt-6">
      {article ? (
        <ArticleBody paragraphs={article.paragraphs} variant={variant ?? "dark"} />
      ) : (
        <div className="rounded border border-dashed border-[#3a4f6b] p-8 text-center text-[#94a3b8]">该条暂无内容</div>
      )}
    </article>
  );
}

function ArticleBottomNav({ current, prev, next, goTo }: { current: number; prev: number | null; next: number | null; goTo: (n: number) => void }) {
  return (
    <ArticleNav
      className="mt-10 border-t border-[#3a4f6b] pt-5"
      prev={
        <button disabled={!prev} onClick={() => prev && goTo(prev)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#3a4f6b] bg-[#1a2332] px-3 py-2 text-sm text-[#e8edf4] disabled:opacity-30 hover:border-[#3b82f6] max-sm:text-xs max-sm:px-2 max-sm:py-1.5">
          <ChevronLeft className="h-4 w-4" /> {prev ? `第 ${prev} 条` : "已是首条"}
        </button>
      }
      center={
        <span className="text-xs text-[#94a3b8]">第 {current} 条 / {TOTAL_LAW_ARTICLES}</span>
      }
      next={
        <button disabled={!next} onClick={() => next && goTo(next)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#3a4f6b] bg-[#1a2332] px-3 py-2 text-sm text-[#e8edf4] disabled:opacity-30 hover:border-[#3b82f6] max-sm:text-xs max-sm:px-2 max-sm:py-1.5">
          {next ? `第 ${next} 条` : "已是末条"} <ChevronRight className="h-4 w-4" />
        </button>
      }
    />
  );
}

/* ─────────────────────── 通用子组件 ─────────────────────── */
function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex-1 inline-flex items-center justify-start gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors ${
        active
          ? "text-[#3b82f6] bg-[#3b82f6]/10 border-b-2 border-[#3b82f6]"
          : "text-[#94a3b8] hover:text-[#e8edf4]"
      }`}
    >
      {icon}{children}
    </button>
  );
}

function InterpCard({ item }: { item: InterpretationArticle }) {
  return (
    <a href={`#/interpretations/${item.id}`}
      className="block rounded-md border border-[#3a4f6b] bg-[#243044] p-3 transition-all hover:border-[#d4a853] hover:shadow-lg">
      <div className="flex items-center gap-2 text-[11px]">
        <span className="rounded bg-[#d4a853]/15 px-1.5 py-0.5 text-[#d4a853]">{item.doc}</span>
        <span className="font-mono text-[#3b82f6]">第 {item.number} 条</span>
        {item.chapter && <span className="truncate text-[#94a3b8]">· {item.chapter}</span>}
      </div>
      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#e8edf4]/85">{item.paragraphs[0]}</p>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-[#94a3b8]">
        查看全文 <ExternalLink className="h-2.5 w-2.5" />
      </div>
    </a>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-md border border-dashed border-[#3a4f6b] bg-[#0f1419]/40 p-6 text-center">
      <div className="text-sm text-[#e8edf4]/80">{title}</div>
      <div className="mt-2 text-xs leading-relaxed text-[#94a3b8]">{hint}</div>
    </div>
  );
}

function range(a: number, b: number) {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

function highlight(text: string, q: string) {
  const t = text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
  const k = q.trim();
  if (!k || k.length < 1) return t;
  try {
    return t.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), `<mark style="background:#d4a853;color:#0f1419;padding:0 2px;border-radius:2px">$&</mark>`);
  } catch { return t; }
}
