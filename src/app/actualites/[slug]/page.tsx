import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import {
  staticArticles,
  type StaticArticle,
  type ArticleTip,
} from "@/lib/articles-data";

export const revalidate = 3600;

interface ArticleFull {
  slug: string;
  title: string;
  category: string | null;
  excerpt: string | null;
  image_url: string | null;
  content: string;
  published_at: string | null;
  cta?: { label: string; href: string };
  image_alt?: string;
}

interface ParsedSection {
  id: string;
  title: string;
  content: string;
}

function parseContent(html: string): {
  intro: string;
  sections: ParsedSection[];
} {
  const parts = html.split(/<h2[^>]*>/);
  const intro = parts[0].trim();
  const sections = parts.slice(1).map((part) => {
    const closingIndex = part.indexOf("</h2>");
    const title = part.slice(0, closingIndex).trim();
    const content = part.slice(closingIndex + 5).trim();
    const id = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/ /g, " ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return { id, title, content };
  });
  return { intro, sections };
}

async function getArticle(slug: string): Promise<ArticleFull | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("articles")
      .select(
        "slug, title, category, excerpt, image_url, content, published_at",
      )
      .eq("slug", slug)
      .eq("status", "publie")
      .single();
    if (data) return data;
  } catch {
    // Supabase unavailable
  }
  const found = staticArticles.find((a) => a.slug === slug);
  if (!found) return null;
  return {
    slug: found.slug,
    title: found.title,
    category: found.category,
    excerpt: found.excerpt,
    image_url: found.image_url,
    image_alt: found.image_alt,
    content: found.content,
    published_at: found.published_at,
    cta: found.cta,
  };
}

export async function generateStaticParams() {
  return staticArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} — Roazhon Kastell`,
    description: article.excerpt,
  };
}

function SectionNumber({ n }: { n: number }) {
  return (
    <span
      className="block text-2xl font-bold text-zinc-200 mb-1.5 select-none"
      aria-hidden
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

function TipBox({ tip }: { tip: ArticleTip }) {
  return (
    <div
      className="mt-8 rounded-xl p-5 sm:p-6"
      style={{ backgroundColor: "#fffbeb", borderLeft: "4px solid #f59e0b" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <svg
          className="w-5 h-5 flex-shrink-0"
          style={{ color: "#f59e0b" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
          />
        </svg>
        <span className="text-sm font-bold" style={{ color: "#92400e" }}>
          {tip.title}
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "#78350f" }}>
        {tip.text}
      </p>
    </div>
  );
}

function HighlightIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="12" r="4" />
        <path d="M14 28c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <circle cx="10" cy="16" r="3" />
        <path d="M4 30c0-2.8 2.2-5 5-5" />
        <circle cx="30" cy="16" r="3" />
        <path d="M36 30c0-2.8-2.2-5-5-5" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6l12 7v14l-12 7-12-7V13z" />
        <path d="M20 6v14" />
        <path d="M20 20l12-7" />
        <path d="M20 20L8 13" />
      </svg>
    );
  }
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="22" width="6" height="12" rx="1" />
      <rect x="17" y="16" width="6" height="18" rx="1" />
      <rect x="28" y="10" width="6" height="24" rx="1" />
      <path d="M9 8l9 4 10-6" />
      <circle cx="9" cy="8" r="1.5" fill="currentColor" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
      <circle cx="28" cy="6" r="1.5" fill="currentColor" />
    </svg>
  );
}

function RelatedCard({ article }: { article: StaticArticle }) {
  return (
    <Link
      href={`/actualites/${article.slug}`}
      className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
    >
      <div
        className="relative bg-zinc-100 overflow-hidden"
        style={{ aspectRatio: "16/9" }}
      >
        <img
          src={article.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-5">
        <span className="inline-block text-[11px] font-medium text-zinc-500 border border-zinc-200 rounded-full px-2.5 py-0.5 mb-3">
          {article.category}
        </span>
        <h3 className="text-base font-bold text-zinc-900 mb-1.5">
          {article.title}
        </h3>
        <p className="text-sm text-zinc-500 leading-relaxed">
          {article.excerpt}
        </p>
      </div>
    </Link>
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const staticData = staticArticles.find((a) => a.slug === slug);
  const { intro, sections } = parseContent(article.content);
  const cta = article.cta ?? staticData?.cta;
  const ctaPhrase =
    staticData?.ctaPhrase ?? "Et si on se retrouvait au château ?";
  const imageAlt =
    article.image_alt ?? staticData?.image_alt ?? article.title;
  const relatedArticles = staticArticles
    .filter((a) => a.slug !== slug)
    .slice(0, 2);

  const getTip = (sectionIndex: number): ArticleTip | undefined =>
    staticData?.tips.find((t) => t.sectionIndex === sectionIndex);

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-white" style={{ paddingTop: "64px" }}>
        <article>
          {/* ── Header ── */}
          <div className="max-w-[780px] mx-auto px-5 sm:px-8">
            <nav className="pt-6 pb-6 flex items-center gap-2 text-sm text-zinc-400">
              <Link
                href="/actualites"
                className="hover:text-zinc-600 transition-colors"
              >
                Actualités &amp; conseils
              </Link>
              {article.category && (
                <>
                  <span>/</span>
                  <span className="text-zinc-500">{article.category}</span>
                </>
              )}
            </nav>

            <div className="flex items-start gap-6 sm:gap-10">
              <div className="flex-1 min-w-0">
                {article.category && (
                  <span className="inline-block text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 border border-zinc-300 rounded px-2.5 py-1 mb-5">
                    {article.category}
                  </span>
                )}

                <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-zinc-900 tracking-tight leading-[1.15] mb-4">
                  {article.title}
                </h1>

                {article.excerpt && (
                  <p className="text-lg text-zinc-500 leading-relaxed mb-5">
                    {article.excerpt}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-900">
                    Roazhon Kastell
                  </span>
                  <span className="text-zinc-300">·</span>
                  <span className="text-sm text-zinc-400">Le collectif</span>
                </div>
              </div>

              {article.image_url && (
                <div className="hidden sm:block flex-shrink-0 rounded-xl overflow-hidden" style={{ width: "200px", height: "150px" }}>
                  <img
                    src={article.image_url}
                    alt={imageAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Highlights ── */}
          {staticData?.highlights && staticData.highlights.length > 0 && (
            <div className="max-w-[780px] mx-auto px-5 sm:px-8 mt-10">
              <div className="bg-zinc-50 rounded-2xl p-6 sm:p-10">
                <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 mb-8" style={{ fontStyle: "italic" }}>
                  L&apos;essentiel en un coup d&apos;œil
                </h2>
                <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
                  {staticData.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-zinc-400">
                        <HighlightIcon index={i} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-zinc-900 mb-1">
                          {h.title}
                        </h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                          {h.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Content ── */}
          <div className="max-w-[620px] mx-auto px-5 sm:px-8 mt-12">
            {/* TOC — collapsible on all screens */}
            {sections.length > 1 && (
              <details className="mb-10 bg-zinc-50 rounded-xl">
                <summary className="article-toc-summary px-5 py-3.5 text-sm font-semibold text-zinc-900 cursor-pointer select-none flex items-center justify-between">
                  Dans cet article
                  <svg
                    className="w-4 h-4 text-zinc-400 transition-transform article-toc-chevron"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </summary>
                <ul className="px-5 pb-4 space-y-1.5">
                  {sections.map((s, i) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="block text-sm py-1 transition-colors"
                        style={{
                          borderLeft: i === 0 ? "3px solid #18181b" : "3px solid transparent",
                          paddingLeft: "12px",
                          color: i === 0 ? "#18181b" : "#71717a",
                          fontWeight: i === 0 ? 600 : 400,
                        }}
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {/* Intro title */}
            {staticData?.introTitle && (
              <p className="text-xl sm:text-[1.35rem] font-bold text-zinc-900 leading-snug mb-5">
                {staticData.introTitle}
              </p>
            )}

            {/* Lead paragraph */}
            <div
              className="article-lead"
              dangerouslySetInnerHTML={{ __html: intro }}
            />

            {/* Sections */}
            {sections.map((s, i) => {
              const tip = getTip(i);
              return (
                <section
                  key={s.id}
                  className="mt-10 pt-10 border-t border-zinc-100"
                >
                  <h2
                    id={s.id}
                    className="text-xl sm:text-[1.35rem] font-bold text-zinc-900 mb-5"
                    style={{ scrollMarginTop: "96px" }}
                  >
                    {s.title}
                  </h2>
                  <div
                    className="article-body"
                    dangerouslySetInnerHTML={{ __html: s.content }}
                  />
                  {tip && <TipBox tip={tip} />}
                </section>
              );
            })}
          </div>

          {/* ── CTA ── */}
          {cta && (
            <div className="max-w-[620px] mx-auto px-5 sm:px-8 mt-14 mb-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 mb-5">
                {ctaPhrase}
              </p>
              <Link
                href={cta.href}
                className="inline-flex items-center bg-zinc-900 text-white rounded-full px-9 py-3.5 text-base font-semibold hover:bg-zinc-800 transition-colors"
              >
                {cta.label}
              </Link>
            </div>
          )}

          {/* ── Related articles ── */}
          {relatedArticles.length > 0 && (
            <div className="max-w-[780px] mx-auto px-5 sm:px-8 py-14 sm:py-16">
              <h2 className="text-xl font-bold text-zinc-900 mb-8">
                À lire aussi
              </h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {relatedArticles.map((ra) => (
                  <RelatedCard key={ra.slug} article={ra} />
                ))}
              </div>
            </div>
          )}

          {/* ── Back link ── */}
          <div className="max-w-[780px] mx-auto px-5 sm:px-8 pb-12">
            <Link
              href="/actualites"
              className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Tous les articles
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
