import { Scale } from "lucide-react";
import { paragraphClassName } from "@/lib/article-text";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-gold/30 bg-primary/95 text-primary-foreground shadow-elegant backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <a href="#/" className="flex items-center gap-3 group">
          <div className="grid h-10 w-10 place-items-center rounded-sm bg-gradient-to-br from-gold to-gold/70 text-gold-foreground shadow-md transition-transform group-hover:scale-105">
            <Scale className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-serif text-base font-semibold tracking-wider">民事诉讼法典</div>
            <div className="text-[11px] tracking-wide text-primary-foreground/70">查询与释义 · 2024</div>
          </div>
        </a>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-6 text-sm text-muted-foreground">
          <div className="max-w-md">
            <div className="font-serif text-base text-foreground">民事诉讼法查询系统</div>
            <p className="mt-2 text-xs leading-relaxed">
              法条原文以全国人大常委会公布文本、司法解释以最高人民法院公布文本为准。
              本站仅供学习研究使用，不作为执业或诉讼的最终依据。
            </p>
          </div>
          <div className="text-xs leading-relaxed sm:text-right">
            <div className="text-foreground">制作人　梨花开　SQH</div>
            <div className="mt-1">© 2024 · 仅供学习研究使用</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function ArticleBody({
  paragraphs,
  dangerouslyHtml,
  variant = "light",
  className,
}: {
  paragraphs: string[];
  dangerouslyHtml?: { __html: string }[];
  variant?: "light" | "dark";
  className?: string;
}) {
  return (
    <div className={cn("article-body", variant === "dark" && "article-body-dark", className)}>
      {paragraphs.map((p, i) =>
        dangerouslyHtml ? (
          <p
            key={i}
            className={paragraphClassName(p, variant === "light" ? "text-foreground" : undefined)}
            dangerouslySetInnerHTML={dangerouslyHtml[i]}
          />
        ) : (
          <p key={i} className={paragraphClassName(p, variant === "light" ? "text-foreground" : undefined)}>
            {p}
          </p>
        ),
      )}
    </div>
  );
}

export function ArticleNav({
  prev,
  center,
  next,
  className,
}: {
  prev: ReactNode;
  center: ReactNode;
  next: ReactNode;
  className?: string;
}) {
  return (
    <nav className={cn("article-nav", className)}>
      <div>{prev}</div>
      <div>{center}</div>
      <div>{next}</div>
    </nav>
  );
}
