import { ChevronLeft, BookOpen } from "lucide-react";
import { interpretations } from "@/data/interpretations";
import { lawArticles } from "@/data/law-articles";

export function InterpretationDetail({ id }: { id: string }) {
  const item = interpretations.find((i) => i.id === id);
  if (!item) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0f1419] text-[#e8edf4]">
        <main className="flex-1 grid place-items-center">
          <a href="#/" className="text-[#d4a853] hover:underline">← 返回首页</a>
        </main>
      </div>
    );
  }

  const relatedLaws = item.relatedLawArticles
    .map((n) => lawArticles.find((a) => a.number === n))
    .filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1419] text-[#e8edf4]">
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-10">
        <a href="#/" className="inline-flex items-center gap-1 text-xs text-[#94a3b8] hover:text-[#d4a853]">
          <ChevronLeft className="h-3.5 w-3.5" /> 返回首页
        </a>

        <article className="mt-4 overflow-hidden rounded-md border border-[#3a4f6b] bg-[#1a2332]">
          <header className="relative border-b border-[#3a4f6b] bg-[#243044] px-8 py-7">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#d4a853] to-[#d4a853]/40" />
            <div className="text-xs text-[#94a3b8]">最高人民法院</div>
            <h1 className="mt-1 font-serif text-2xl text-[#e8edf4]">
              《{item.doc}》 第 <span className="text-[#d4a853]">{item.number}</span> 条
            </h1>
            {item.chapter && <div className="mt-1 text-sm text-[#94a3b8]">{item.chapter}</div>}
          </header>

          <div className="px-8 py-8">
            {item.paragraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-[#e8edf4]/90 mb-3 last:mb-0">{p}</p>
            ))}
          </div>

          <footer className="border-t border-[#3a4f6b] bg-[#243044]/50 px-8 py-4 text-sm">
            <nav className="flex items-center justify-between">
              <div />
              <a href="#/" className="text-xs text-[#94a3b8] hover:text-[#d4a853]">目录</a>
              <div />
            </nav>
          </footer>
        </article>

        {relatedLaws.length > 0 && (
          <section className="mt-8">
            <h2 className="flex items-center gap-2 font-serif text-lg text-[#d4a853] border-b border-[#3a4f6b] pb-2">
              <BookOpen className="h-4 w-4 text-[#d4a853]" /> 解释对象 · 民事诉讼法条文
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {relatedLaws.map((a: any) => (
                <li key={a.number}>
                  <a
                    href={`#/law/${a.number}`}
                    className="block rounded-md border border-[#3a4f6b] bg-[#243044] p-3 text-sm hover:border-[#d4a853]"
                  >
                    <span className="text-[#94a3b8]">→ 民事诉讼法 第 {a.number} 条</span>
                    {a.title && <span className="ml-2 text-[#d4a853]">{a.title}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
