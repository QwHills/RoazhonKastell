import { Suspense } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { staticArticles } from "@/lib/articles-data";

export const revalidate = 3600;

interface ArticleCard {
  slug: string;
  title: string;
  category: string | null;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
}

async function getArticles(): Promise<ArticleCard[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("articles")
      .select("slug, title, category, excerpt, image_url, published_at")
      .eq("status", "publie")
      .order("published_at", { ascending: false });

    if (data && data.length > 0) return data;
  } catch {
    // Supabase unavailable — use static data
  }

  return staticArticles.map((a) => ({
    slug: a.slug,
    title: a.title,
    category: a.category,
    excerpt: a.excerpt,
    image_url: a.image_url,
    published_at: a.published_at,
  }));
}

export default async function ActualitesPage() {
  const articles = await getArticles();

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-zinc-50 pt-16">
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                Actualités &amp; conseils
              </h1>
              <p className="mt-4 text-zinc-500 text-lg max-w-2xl mx-auto">
                Des conseils métier, des partages d'expérience et les actualités
                du collectif.
              </p>
            </div>

            {articles.length === 0 ? (
              <p className="text-center text-zinc-400 py-16">
                Aucun article publié pour le moment.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/actualites/${article.slug}`}
                    className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div
                      className="relative bg-zinc-100 overflow-hidden"
                      style={{ aspectRatio: "16/9" }}
                    >
                      {article.image_url && (
                        <img
                          src={article.image_url}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                    </div>
                    <div className="p-5">
                      {article.category && (
                        <span className="inline-block text-[11px] font-medium text-zinc-500 border border-zinc-200 rounded-full px-2.5 py-0.5 mb-3">
                          {article.category}
                        </span>
                      )}
                      <h2 className="text-base font-bold text-zinc-900 mb-1.5 group-hover:text-zinc-700 transition-colors">
                        {article.title}
                      </h2>
                      {article.excerpt && (
                        <p className="text-sm text-zinc-500 leading-relaxed mb-3">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        {article.published_at && (
                          <span className="text-xs text-zinc-400">
                            {new Date(article.published_at).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </span>
                        )}
                        <div className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-300 group-hover:bg-zinc-900 group-hover:border-zinc-900 group-hover:text-white transition-colors ml-auto">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
