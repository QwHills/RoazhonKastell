"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { PartnerRow } from "./page";

export default function PartenairesClient({ partners }: { partners: PartnerRow[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    partners.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ["Tous", ...Array.from(cats).sort()];
  }, [partners]);

  const filtered = useMemo(() => {
    let list = partners;

    if (activeCategory !== "Tous") {
      list = list.filter((p) => p.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const searchable = [
          p.name,
          p.tagline,
          p.sector,
          p.services,
          p.description,
          p.category,
          ...(p.contact_situations || []).map((s) => `${s.title} ${s.description}`),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchable.includes(q);
      });
    }

    return list;
  }, [partners, search, activeCategory]);

  function resetFilters() {
    setSearch("");
    setActiveCategory("Tous");
  }

  return (
    <main className="min-h-screen bg-white pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-zinc-900">
        <Image
          src="/chateau.jpg"
          alt="Le château de Roazhon Kastell"
          fill
          className="object-cover opacity-40"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/80 to-zinc-900/40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            Le réseau du château
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-lg">
            Les bons experts,
            <br />
            au bon moment.
          </h1>
          <p className="mt-4 text-zinc-300 text-lg max-w-md">
            Des partenaires pour accompagner vos projets et ceux de vos clients.
          </p>
        </div>
      </section>

      {/* Recherche + Filtres */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-zinc-100 p-4 sm:p-5">
          {/* Barre de recherche */}
          <div className="relative mb-4">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Quel est votre besoin ?"
              aria-label="Rechercher un partenaire"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-zinc-200 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Filtres catégories */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par catégorie">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                role="tab"
                aria-selected={activeCategory === cat}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grille de cartes */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-lg mb-2">Aucun partenaire ne correspond à votre recherche.</p>
            <p className="text-zinc-400 text-sm mb-6">Essayez avec d&apos;autres mots-clés ou réinitialisez les filtres.</p>
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {filtered.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function PartnerCard({ partner }: { partner: PartnerRow }) {
  const specialties = partner.services
    ? partner.services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  const href = partner.slug ? `/partenaires/${partner.slug}` : null;

  const card = (
    <article className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-zinc-300 transition-all group">
      {/* Photo de couverture */}
      <div className="relative h-32 sm:h-44 bg-zinc-100">
        {partner.cover_photo ? (
          <img
            src={partner.cover_photo}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
            {partner.logo_url ? (
              <img
                src={partner.logo_url}
                alt=""
                className="w-20 h-20 object-contain opacity-60"
                loading="lazy"
              />
            ) : (
              <span className="text-4xl font-bold text-zinc-300">{partner.name[0]}</span>
            )}
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Logo + Nom + Métier */}
        <div className="flex items-start gap-3 mb-3">
          {partner.logo_url ? (
            <img
              src={partner.logo_url}
              alt=""
              className="w-10 h-10 object-contain flex-shrink-0 rounded-lg"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-sm font-bold text-zinc-400 flex-shrink-0">
              {partner.name[0]}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-900 leading-tight">{partner.name}</h3>
            {partner.sector && (
              <p className="text-sm text-zinc-500 truncate">{partner.sector}</p>
            )}
          </div>
        </div>

        {/* Tagline / Description courte */}
        {partner.tagline ? (
          <p className="text-sm text-zinc-600 mb-3 line-clamp-2">{partner.tagline}</p>
        ) : partner.description ? (
          <p className="text-sm text-zinc-600 mb-3 line-clamp-2">{partner.description}</p>
        ) : null}

        {/* Spécialités */}
        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {specialties.map((s) => (
              <span
                key={s}
                className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        {href && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">
            Découvrir le partenaire
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </div>
        )}
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl">
        {card}
      </Link>
    );
  }

  return card;
}
