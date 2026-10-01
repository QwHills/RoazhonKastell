import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Lieu from "@/components/Lieu";
import Adhesions from "@/components/Adhesions";
import Contact from "@/components/Contact";
import Videos from "@/components/Videos";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { staticArticles } from "@/lib/articles-data";

export const revalidate = 3600;

export default function Home() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main>
        <Hero />
        <DiscoverCards />
        <EventSection />
        <ActualitesSection />
        <Videos />
        <Lieu />
        <Adhesions />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

function DiscoverCards() {
  return (
    <section className="pt-10 sm:pt-12 pb-4 sm:pb-6 bg-white">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          <Link
            href="/conseillers"
            className="group flex flex-col overflow-hidden bg-white border border-zinc-200 rounded-2xl hover:shadow-lg hover:border-zinc-300 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          >
            <div className="relative overflow-hidden bg-zinc-100" style={{ aspectRatio: "16/9" }}>
              <Image
                src="/photo-conseillers.jpg"
                alt="Conseillers immobiliers"
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                style={{ objectPosition: "center 30%" }}
              />
            </div>
            <div className="p-4 sm:p-5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-zinc-900">
                  Les conseillers
                </h3>
                <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                  Découvrez les conseillers immobiliers du Roazhon Kastell.
                </p>
              </div>
              <div className="w-9 h-9 rounded-full border border-zinc-200 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-900 group-hover:border-zinc-900 group-hover:text-white transition-colors text-zinc-300">
                <svg
                  className="w-4 h-4"
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
          </Link>

          <Link
            href="/partenaires"
            className="group flex flex-col overflow-hidden bg-white border border-zinc-200 rounded-2xl hover:shadow-lg hover:border-zinc-300 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          >
            <div className="relative overflow-hidden bg-zinc-100" style={{ aspectRatio: "16/9" }}>
              <Image
                src="/photo-partenaires.webp"
                alt="Partenaires"
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                style={{ objectPosition: "center 40%" }}
              />
            </div>
            <div className="p-4 sm:p-5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-zinc-900">
                  Découvrir nos partenaires
                </h3>
                <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                  Des experts locaux pour vous accompagner dans toutes les
                  étapes de vos projets.
                </p>
              </div>
              <div className="w-9 h-9 rounded-full border border-zinc-200 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-900 group-hover:border-zinc-900 group-hover:text-white transition-colors text-zinc-300">
                <svg
                  className="w-4 h-4"
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
          </Link>
        </div>
      </div>
    </section>
  );
}

function EventSection() {
  return (
    <section className="pt-6 sm:pt-8 pb-6 sm:pb-8 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl sm:text-[28px] font-bold text-zinc-900 tracking-tight">
            Les rendez-vous du château
          </h2>
          <Link
            href="/agenda"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 hover:underline underline-offset-4 transition-colors flex-shrink-0"
          >
            Voir tous les événements
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
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <div className="flex flex-col sm:flex-row">
            {/* Photo zone */}
            <div className="event-photo flex-shrink-0 relative bg-zinc-100 overflow-hidden">
              <Image
                src="/photo-coworking.webp"
                alt="Mardi coworking au château"
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {/* Content */}
            <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">
                Chaque mardi
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 mb-1">
                Mardi coworking
              </h3>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mb-4">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                Roazhon Kastell, Rennes
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-3.5">
                  <p className="text-sm font-bold text-zinc-900">9h30 – 10h30</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Présentation des biens</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-3.5">
                  <p className="text-sm font-bold text-zinc-900">11h00 – 12h00</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Atelier thématique</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/agenda"
                  className="inline-flex items-center gap-2 py-3 px-6 bg-zinc-900 text-white rounded-full text-sm font-semibold hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
                >
                  Voir le programme
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/espace/biens"
                  className="inline-flex items-center gap-2 py-3 px-6 border border-zinc-300 text-zinc-900 rounded-full text-sm font-semibold hover:bg-zinc-100 transition-colors"
                >
                  Préparer ses biens
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile link to agenda */}
        <Link
          href="/agenda"
          className="sm:hidden flex items-center justify-center gap-1.5 mt-5 text-sm font-semibold text-zinc-900"
        >
          Voir tous les événements
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
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}

async function ActualitesSection() {
  let articles: {
    slug: string;
    title: string;
    category: string | null;
    excerpt: string | null;
    image_url: string | null;
    image_position?: string;
  }[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("articles")
      .select("slug, title, category, excerpt, image_url")
      .eq("status", "publie")
      .order("published_at", { ascending: false })
      .limit(3);

    if (data && data.length > 0) articles = data;
  } catch {
    // Supabase unavailable
  }

  if (articles.length === 0) {
    articles = staticArticles.slice(0, 3).map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      excerpt: a.excerpt,
      image_url: a.image_url,
      image_position: a.image_position,
    }));
  }

  return (
    <section className="py-6 sm:py-8 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-[28px] font-bold text-zinc-900 tracking-tight">
              Actualités &amp; conseils
            </h2>
            <p className="mt-1 text-sm text-zinc-500 hidden sm:block">
              Des conseils métier, des partages d'expérience et les actualités du collectif.
            </p>
          </div>
          <Link
            href="/actualites"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 hover:underline underline-offset-4 transition-colors flex-shrink-0"
          >
            Voir tous les articles
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
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/actualites/${article.slug}`}
              className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="relative bg-zinc-100 overflow-hidden" style={{ aspectRatio: "16/9" }}>
                {article.image_url && (
                  <Image
                    src={article.image_url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    style={article.image_position ? { objectPosition: article.image_position } : undefined}
                  />
                )}
              </div>
              <div className="p-5">
                {article.category && (
                  <span className="inline-block text-[11px] font-medium text-zinc-500 border border-zinc-200 rounded-full px-2.5 py-0.5 mb-3">
                    {article.category}
                  </span>
                )}
                <h3 className="text-base font-bold text-zinc-900 mb-1.5">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-sm text-zinc-500 leading-relaxed mb-3">
                    {article.excerpt}
                  </p>
                )}
                <div className="flex justify-end">
                  <div className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-300 group-hover:bg-zinc-900 group-hover:border-zinc-900 group-hover:text-white transition-colors">
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
      </div>
    </section>
  );
}
