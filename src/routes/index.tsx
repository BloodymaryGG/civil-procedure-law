import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Library, Scale, ShieldCheck, Sparkles, BookOpen, ChevronLeft, ChevronRight, ExternalLink, Hash, ListTree, ArrowLeftRight } from "lucide-react";
import { lawArticles, lawChapters, TOTAL_LAW_ARTICLES } from "@/data/law-articles";
import { interpretations, interpretationDocs, interpChapters, TOTAL_INTERP_ARTICLES } from "@/data/interpretations";
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

/* ─────────────────────── Search result type ─────────────────────── */
type SearchResult = {
  type: "law" | "interp";
  number: number;
  title: string;
  chapter: string;
  snippet: string;
  paragraphs: string[];
};

/* ─────────────────────── Workbench ─────────────────────── */
export function Workbench() {
  const [mode, setMode] = useState<"law" | "interpretation">("law");
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

  // Derived from mode
  const totalArticles = mode === "law" ? TOTAL_LAW_ARTICLES : TOTAL_INTERP_ARTICLES;
  const chapters = mode === "law" ? lawChapters : interpChapters;
  const articleMap = mode === "law" ? lawArticleMap : interpArticleMap;
  const currentArticle = articleMap.get(current) ?? null;
  const currentDoc = interpretationDocs[0];

  // Chapter for current article
  const chapter = useMemo(
    () => chapters.find((c) => current >= c.articleStart && current <= c.articleEnd),
    [current, chapters]
  );

  useEffect(() => {
    setMounted(true);
    const hash = decodeURIComponent(window.location.hash.replace("#", ""));
    // Check if hash indicates interpretation mode
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
  }, [current, mode, mounted]);

  /* ── Search: searches BOTH law articles and interpretations ── */
  const searchHits = useMemo((): SearchResult[] => {
    const q = search.trim();
    if (!q) return [];

    const results: SearchResult[] = [];

    // Try exact number match for law
    const lawNum = parseArticleQuery(q, TOTAL_LAW_ARTICLES);
    if (lawNum) {
      const a = lawArticleMap.get(lawNum);
      if (a) {
        results.push({
          type: "law",
          number: a.number,
          title: a.title ?? "",
          chapter: a.chapterTitle,
          snippet: a.paragraphs[0],
          paragraphs: a.paragraphs,
        });
      }
    }

    // Try exact number match for interpretation
    const interpNum = parseArticleQuery(q, TOTAL_INTERP_ARTICLES);
    if (interpNum) {
      const a = interpArticleMap.get(interpNum);
      if (a) {
        results.push({
          type: "interp",
          number: a.number,
          title: "民诉法解释",
          chapter: a.chapter ?? "",
          snippet: a.paragraphs[0],
          paragraphs: a.paragraphs,
        });
      }
    }

    // If exact number matched, return those first
    if (lawNum || interpNum) return results.slice(0, 20);

    // Full text search: law articles
    for (const a of lawArticles) {
      const inTitle = a.title?.includes(q);
      const inBody = a.paragraphs.some((p) => p.includes(q));
      if (inTitle || inBody) {
        results.push({
          type: "law",
          number: a.number,
          title: a.title ?? "",
          chapter: a.chapterTitle,
          snippet: a.paragraphs[0],
          paragraphs: a.paragraphs,
        });
      }
    }

    // Full text search: interpretations
    for (const a of interpretations) {
      if (a.paragraphs.some((p) => p.includes(q))) {
        results.push({
          type: "interp",
          number: a.number,
          title: "民诉法解释",
          chapter: a.chapter ?? "",
          snippet: a.paragraphs[0],
          paragraphs: a.paragraphs,
        });
      }
    }

    return results.slice(0, 30);
  }, [search]);

  const relatedInterps = useMemo(
    () => interpretations.filter((i) => i.relatedLawArticles.includes(current)),
    [current]
  );

  // For interpretation mode: find related law articles
  const relatedLaws = useMemo(
    () => {
      if (mode !== "interpretation" || !currentArticle) return [];
      const c = currentArticle as InterpretationArticle;
      return c.relatedLawArticles
        .map((n) => lawArticleMap.get(n))
        .filter(Boolean);
    },
    [current, mode, currentArticle]
  );

  const goTo = (n: number) => {
    if (n >= 1 && n <= totalArticles) {
      setCurrent(n);
      setSearch("");
    }
  };

  const toggleMode = () => {
    const newMode = mode === "law" ? "interpretation" : "law";
    setMode(newMode);
    setCurrent(1);
    setSearch("");
    setSidebarTab("toc");
  };

  const prev = current > 1 ? current - 1 : null;
  const next = current < totalArticles ? current + 1 : null;

  // ── Mobile Layout ──
  if (isMobile) {
    return <MobileLayout
      current={current} mode={mode} toggleMode={toggleMode}
      search={search} setSearch={setSearch}
      searchHits={searchHits} goTo={goTo}
      currentArticle={currentArticle} chapter={chapter} prev={prev} next={next}
      mobileTab={mobileTab} setMobileTab={setMobileTab}
      showMobileSearch={showMobileSearch} setShowMobileSearch={setShowMobileSearch}
      sidebarTab={sidebarTab} setSidebarTab={setSidebarTab}
      jumpInput={jumpInput} setJumpInput={setJumpInput}
      relatedInterps={relatedInterps} relatedLaws={relatedLaws}
      tocActiveRef={tocActiveRef}
      chapters={chapters} totalArticles={totalArticles}
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
            {mode === "law" ? "民事诉讼法及司法解释" : "民诉法司法解释"}
          </h1>
          <span className="hidden lg:inline rounded-full border border-[#d4a853]/30 bg-[#d4a853]/12 px-2 py-0.5 text-[11px] text-[#d4a853] whitespace-nowrap">
            {mode === "law" ? `民诉法 · ${TOTAL_LAW_ARTICLES} 条` : `司法解释 · ${TOTAL_INTERP_ARTICLES} 条`}
          </span>
        </div>

        {/* 搜索（法条 + 司法解释） */}
        <div className="relative w-full justify-self-center">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchHits[0]) {
                const h = searchHits[0];
                if (h.type === "law") {
                  if (mode !== "law") setMode("law");
                  goTo(h.number);
                } else {
                  if (mode !== "interpretation") setMode("interpretation");
                  goTo(h.number);
                }
              }
            }}
            placeholder="搜索条号或关键词（民诉法 + 司法解释）"
            className="w-full rounded-lg border border-[#3a4f6b] bg-[#0f1419] py-2 pl-9 pr-3 text-sm text-[#e8edf4] outline-none placeholder:text-[#94a3b8]/70 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/30"
          />
          {search && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-96 overflow-y-auto rounded-lg border border-[#3a4f6b] bg-[#1a2332] shadow-2xl">
              {searchHits.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[#94a3b8]">无匹配结果</div>
              ) : (
                searchHits.map((h, idx) => (
                  <button
                    key={`${h.type}-${h.number}-${idx}`}
                    onClick={() => {
                      if (h.type === "law" && mode !== "law") setMode("law");
                      if (h.type === "interp" && mode !== "interpretation") setMode("interpretation");
                      goTo(h.number);
                    }}
                    className="block w-full border-b border-[#3a4f6b]/50 px-4 py-2.5 text-left hover:bg-[#2d3d56] last:border-0"
                  >
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
          <button
            onClick={toggleMode}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#d4a853] bg-[#d4a853]/10 px-3 py-1.5 text-[#d4a853] hover:bg-[#d4a853]/20 transition-colors"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            {mode === "law" ? "司法解释库" : "民诉法条"}
          </button>

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
            chapters.map((c: any) => {
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
                  onKeyDown={(e) => { if (e.key === "Enter") { const n = parseArticleQuery(jumpInput, totalArticles); if (n) { goTo(n); setJumpInput(""); } } }}
                  placeholder="如 119"
                  className="flex-1 rounded border border-[#3a4f6b] bg-[#0f1419] px-2 py-1.5 text-sm outline-none focus:border-[#3b82f6]"
                />
                <button
                  onClick={() => { const n = parseArticleQuery(jumpInput, totalArticles); if (n) { goTo(n); setJumpInput(""); } }}
                  className="rounded bg-[#3b82f6] px-3 text-sm text-white hover:bg-[#2563eb]"
                >前往</button>
              </div>
              {mode === "law" && (
                <>
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
                        className="rounded border border-[#3a4f6b] bg-[#243044] px-2 py-1.5 text-[11px] text-left text-[#e8edf4]/80 hover:bg-[#2d3d56]"
                      >
                        <span className="font-mono text-[#3b82f6]">第 {n} 条</span>
                        <span className="ml-1.5 text-[#94a3b8]">· {label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {mode === "interpretation" && (
                <>
                  <div className="text-xs text-[#94a3b8] pt-2 border-t border-[#3a4f6b]">常用司法解释</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      [1, "重大涉外案件"],
                      [18, "合同履行地"],
                      [28, "不动产专属"],
                      [90, "举证责任"],
                      [108, "证明标准"],
                      [247, "重复起诉"],
                      [405, "再审改判"],
                      [521, "涉外送达"],
                    ].map(([n, label]) => (
                      <button
                        key={n}
                        onClick={() => goTo(n as number)}
                        className="rounded border border-[#3a4f6b] bg-[#243044] px-2 py-1.5 text-[11px] text-left text-[#e8edf4]/80 hover:bg-[#2d3d56]"
                      >
                        <span className="font-mono text-[#d4a853]">第 {n} 条</span>
                        <span className="ml-1.5 text-[#94a3b8]">· {label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ───── 中栏：法条 / 司法解释正文 ───── */}
      <main ref={centerScrollRef} className="flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {/* 面包屑 */}
          <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
            {mode === "law" && <span className="rounded bg-[#3b82f6]/20 px-1.5 py-0.5 text-[#3b82f6]">法条</span>}
            {mode === "interpretation" && <span className="rounded bg-[#d4a853]/20 px-1.5 py-0.5 text-[#d4a853]">司法解释</span>}
            {chapter && <span>· {(chapter as any).chapter || (chapter as any).chapterTitle}</span>}
            <span className="ml-auto">{mode === "law" ? "民事诉讼法" : "最高人民法院关于适用《中华人民共和国民事诉讼法》的解释"}</span>
          </div>

          {/* 条文标题 */}
          {mode === "law" && currentArticle && "title" in currentArticle && currentArticle.title && (
            <h2 className="mt-3 font-serif text-lg text-[#d4a853] border-b border-[#3a4f6b] pb-2">
              {(currentArticle as any).title}
            </h2>
          )}

          <h3 className="mt-4 text-sm text-[#94a3b8]">
            {mode === "law" ? `第 ${current} 条` : `《民诉法解释》第 ${current} 条`}
          </h3>

          {/* 正文 */}
          {currentArticle ? (
            <ArticleBody
              paragraphs={(currentArticle as any).paragraphs}
              variant="dark"
            />
          ) : (
            <div className="rounded border border-dashed border-[#3a4f6b] p-8 text-center text-[#94a3b8]">该条暂无内容</div>
          )}
        </div>

        {/* 翻页导航 - 固定在底部 */}
        <div className="border-t border-[#3a4f6b] bg-[#1a2332] px-8 py-4">
          <ArticleNav
            prev={
              <button disabled={!prev} onClick={() => prev && goTo(prev)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#3a4f6b] bg-[#0f1419] px-3 py-2 text-sm text-[#e8edf4] disabled:opacity-30 hover:border-[#3b82f6] max-sm:text-xs max-sm:px-2 max-sm:py-1.5">
                <ChevronLeft className="h-4 w-4" /> {prev ? `第 ${prev} 条` : "已是首条"}
              </button>
            }
            center={
              <span className="text-xs text-[#94a3b8]">第 {current} 条 / {totalArticles}</span>
            }
            next={
              <button disabled={!next} onClick={() => next && goTo(next)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#3a4f6b] bg-[#0f1419] px-3 py-2 text-sm text-[#e8edf4] disabled:opacity-30 hover:border-[#3b82f6] max-sm:text-xs max-sm:px-2 max-sm:py-1.5">
                {next ? `第 ${next} 条` : "已是末条"} <ChevronRight className="h-4 w-4" />
              </button>
            }
          />
        </div>
      </main>

      {/* ───── 右栏：关联信息 ───── */}
      <aside className="flex flex-col overflow-y-auto border-l border-[#3a4f6b] bg-[#1a2332] p-5">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-[#d4a853] border-b border-[#3a4f6b] pb-2 mb-3">
          <BookOpen className="h-3.5 w-3.5" />
          {mode === "law" ? "关联司法解释" : "关联法条"}
        </h4>

        {mode === "law" ? (
          relatedInterps.length === 0 ? (
            <div className="rounded border border-dashed border-[#3a4f6b] p-4 text-center text-xs text-[#94a3b8]">
              本条暂无直接关联的司法解释
            </div>
          ) : (
            <div className="space-y-2">
              {relatedInterps.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setMode("interpretation"); goTo(item.number); }}
                  className="block w-full text-left rounded-md border border-[#3a4f6b] bg-[#243044] p-3 transition-all hover:border-[#d4a853] hover:shadow-lg"
                >
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
            <div className="rounded border border-dashed border-[#3a4f6b] p-4 text-center text-xs text-[#94a3b8]">
              本条暂无直接关联的法条
            </div>
          ) : (
            <div className="space-y-2">
              {relatedLaws.map((a: any) => (
                <button
                  key={a.number}
                  onClick={() => { setMode("law"); goTo(a.number); }}
                  className="block w-full text-left rounded-md border border-[#3a4f6b] bg-[#243044] p-3 transition-all hover:border-[#3b82f6] hover:shadow-lg"
                >
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

/* ─────────────────────── Mobile Layout ─────────────────────── */
function MobileLayout({
  current, mode, toggleMode,
  search, setSearch, searchHits, goTo,
  currentArticle, chapter, prev, next,
  mobileTab, setMobileTab,
  showMobileSearch, setShowMobileSearch,
  sidebarTab, setSidebarTab,
  jumpInput, setJumpInput,
  relatedInterps, relatedLaws,
  tocActiveRef,
  chapters, totalArticles,
}: {
  current: number; mode: "law" | "interpretation"; toggleMode: () => void;
  search: string; setSearch: (v: string) => void; searchHits: SearchResult[]; goTo: (n: number) => void;
  currentArticle: any; chapter: any; prev: number | null; next: number | null;
  mobileTab: string; setMobileTab: (v: any) => void;
  showMobileSearch: boolean; setShowMobileSearch: (v: boolean) => void;
  sidebarTab: string; setSidebarTab: (v: any) => void;
  jumpInput: string; setJumpInput: (v: string) => void;
  relatedInterps: InterpretationArticle[]; relatedLaws: any[];
  tocActiveRef: any;
  chapters: any[]; totalArticles: number;
}) {
  return (
    <div className="h-screen flex flex-col bg-[#0f1419] text-[#e8edf4]">
      {/* Mobile header */}
      <header className="flex items-center gap-2 border-b border-[#3a4f6b] bg-[#1a2332] px-3 py-2">
        <button onClick={toggleMode} className="rounded border border-[#d4a853]/40 px-2 py-1 text-[11px] text-[#d4a853] whitespace-nowrap">
          {mode === "law" ? "司法解释" : "法条"}
        </button>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94a3b8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索法条 + 司法解释"
            className="w-full rounded border border-[#3a4f6b] bg-[#0f1419] py-1.5 pl-7 pr-2 text-xs outline-none placeholder:text-[#94a3b8]/60 focus:border-[#3b82f6]"
          />
          {search && searchHits.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-40 max-h-60 overflow-y-auto rounded border border-[#3a4f6b] bg-[#1a2332] shadow-xl">
              {searchHits.slice(0, 8).map((h, idx) => (
                <button
                  key={idx}
                  onClick={() => { if (h.type === "law" && mode !== "law") toggleMode(); if (h.type === "interp" && mode !== "interpretation") toggleMode(); goTo(h.number); setSearch(""); }}
                  className="block w-full border-b border-[#3a4f6b]/50 px-3 py-2 text-left hover:bg-[#2d3d56]"
                >
                  <span className={`text-[10px] ${h.type === "law" ? "text-[#3b82f6]" : "text-[#d4a853]"}`}>
                    {h.type === "law" ? `第${h.number}条` : `解释${h.number}条`}
                  </span>
                  <p className="text-xs truncate text-[#e8edf4]/70">{h.snippet}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-[#3a4f6b] bg-[#1a2332]">
        {[["article", "条文"], ["side", "目录"], ["panel", mode === "law" ? "关联解释" : "关联法条"]].map(([key, label]) => (
          <button key={key} onClick={() => setMobileTab(key)}
            className={`flex-1 py-2 text-xs font-medium ${mobileTab === key ? "text-[#3b82f6] border-b-2 border-[#3b82f6]" : "text-[#94a3b8]"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {mobileTab === "article" && (
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 text-xs text-[#94a3b8] mb-2">
              {chapter && <span>{(chapter as any).chapter || (chapter as any).chapterTitle}</span>}
            </div>
            <h3 className="text-sm text-[#d4a853]">
              {mode === "law" ? `民事诉讼法 第 ${current} 条` : `民诉法解释 第 ${current} 条`}
            </h3>
            {currentArticle ? (
              <ArticleBody paragraphs={(currentArticle as any).paragraphs} variant="dark" />
            ) : (
              <div className="rounded border border-dashed border-[#3a4f6b] p-6 text-center text-[#94a3b8] text-xs">暂无内容</div>
            )}
            <div className="mt-6 flex justify-between gap-2">
              <button disabled={!prev} onClick={() => prev && goTo(prev)}
                className="rounded border border-[#3a4f6b] bg-[#1a2332] px-3 py-1.5 text-xs disabled:opacity-30">
                ← 第 {prev ?? "-"} 条
              </button>
              <span className="text-xs text-[#94a3b8] self-center">{current}/{totalArticles}</span>
              <button disabled={!next} onClick={() => next && goTo(next)}
                className="rounded border border-[#3a4f6b] bg-[#1a2332] px-3 py-1.5 text-xs disabled:opacity-30">
                第 {next ?? "-"} 条 →
              </button>
            </div>
          </div>
        )}

        {mobileTab === "side" && (
          <div className="p-3">
            <div className="flex border-b border-[#3a4f6b] mb-2">
              <TabBtn active={sidebarTab === "toc"} onClick={() => setSidebarTab("toc")} icon={<ListTree className="h-3 w-3" />}>目录</TabBtn>
              <TabBtn active={sidebarTab === "jump"} onClick={() => setSidebarTab("jump")} icon={<Hash className="h-3 w-3" />}>跳转</TabBtn>
            </div>
            {sidebarTab === "toc" ? (
              chapters.map((c: any) => (
                <div key={c.id} className="mb-2">
                  <div className="text-[11px] text-[#94a3b8] mb-1">{(c as any).chapter || (c as any).chapterTitle}</div>
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
              ))
            ) : (
              <div className="flex gap-2">
                <input value={jumpInput} onChange={(e) => setJumpInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { const n = parseArticleQuery(jumpInput, totalArticles); if (n) goTo(n); setJumpInput(""); }}}
                  placeholder="条号" className="flex-1 rounded border border-[#3a4f6b] bg-[#0f1419] px-2 py-1 text-xs outline-none"
                />
                <button onClick={() => { const n = parseArticleQuery(jumpInput, totalArticles); if (n) { goTo(n); setJumpInput(""); }}}
                  className="rounded bg-[#3b82f6] px-3 text-xs text-white">跳转</button>
              </div>
            )}
          </div>
        )}

        {mobileTab === "panel" && (
          <div className="p-3 space-y-2">
            {(mode === "law" ? relatedInterps : relatedLaws).length === 0 ? (
              <div className="text-xs text-[#94a3b8] text-center py-6">无关联内容</div>
            ) : (
              (mode === "law" ? relatedInterps : relatedLaws).map((item: any, idx: number) => (
                <button key={item.id || item.number || idx}
                  onClick={() => { goTo(item.number); setMobileTab("article"); }}
                  className="block w-full text-left rounded border border-[#3a4f6b] bg-[#243044] p-3">
                  <div className="text-[10px] text-[#d4a853]">{item.doc || "法条"} 第 {item.number} 条</div>
                  <p className="text-xs text-[#e8edf4]/70 line-clamp-2 mt-1">{item.paragraphs[0]}</p>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── 辅助组件 ─────────────────────── */
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

/* ─────────────────────── 工具函数 ─────────────────────── */
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
