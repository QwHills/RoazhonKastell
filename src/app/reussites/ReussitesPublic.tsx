"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PublicSuccess } from "./page";

const TYPE_LABELS: Record<string, string> = {
  vente_partage: "Vente en partage",
  dossier_partenaire: "Dossier partenaire",
  coup_de_pouce: "Coup de pouce",
};

const STAGE_LABELS: Record<string, string> = {
  en_cours: "En cours",
  compromis: "Compromis signé",
  vente_definitive: "Vente définitive",
  finalise: "Finalisé",
  annule: "Annulé",
};

interface Props {
  successes: PublicSuccess[];
  counts: { total: number; ventes: number; partenaires: number; coups: number; membres: number };
}

export default function ReussitesPublic({ successes, counts }: Props) {
  const [filter, setFilter] = useState<string>("all");

  const featured = successes.find((s) => s.featured);
  const filtered =
    filter === "all"
      ? successes
      : filter === "vente_partage"
        ? successes.filter((s) => s.type === "vente_partage")
        : successes.filter((s) => s.type === "dossier_partenaire" || s.type === "coup_de_pouce");

  const filters = [
    { key: "all", label: "Toutes" },
    { key: "vente_partage", label: "Ventes en partage" },
    { key: "other", label: "Avec nos partenaires" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-zinc-900">
        <Image
          src="/chateau-drone.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-40"
          priority
        />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-20 sm:py-28">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
            Les réussites<br />du Kastell
          </h1>
          <p className="mt-4 text-base sm:text-lg text-zinc-300 max-w-lg">
            Des rencontres le mardi. Des projets qui aboutissent.
          </p>
          <Link
            href="#histoires"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold rounded-full hover:bg-white/20 transition-colors"
          >
            La force du collectif
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Counters */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="max-w-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 whitespace-nowrap">
                Les mardis portent leurs fruits
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Des ventes en partage et des collaborations avec nos partenaires.
              </p>
            </div>
            <div className="flex gap-6 sm:gap-10">
              <CounterCard value={counts.ventes} label="Ventes en partage" />
              <CounterCard value={counts.partenaires} label="Dossiers partenaires" />
              <CounterCard value={counts.membres} label="Membres impliqués" />
            </div>
          </div>
        </div>
      </section>

      {/* ROI Banner */}
      <section className="pb-8 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden bg-zinc-900">
            <Image
              src="/chateau-drone.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-30"
            />
            <div className="relative flex flex-col lg:flex-row items-center gap-6 lg:gap-8 p-6 sm:p-8 lg:p-10">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">
                  Et si un mardi rentabilisait votre adhésion&nbsp;?
                </h2>
                <p className="text-sm text-zinc-300 mb-5 max-w-md">
                  Un lieu, un réseau et des opportunités concrètes de collaboration.
                </p>
                <ul className="space-y-2.5">
                  {["Des rencontres chaque mardi", "Des projets construits ensemble", "Un réseau pour avancer"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-white">
                      <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-8 py-6 text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-white">19,99&nbsp;€ <span className="text-lg font-normal text-zinc-300">/ mois</span></p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-2 text-center">
                  <p className="text-sm font-semibold text-white">239,88&nbsp;€ / an</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-lg max-w-xs w-full border border-zinc-100">
                <div className="border border-emerald-200 rounded-xl px-4 py-3 mb-4 bg-emerald-50/50">
                  <p className="text-xs text-zinc-500 mb-0.5">Exemple illustratif</p>
                  <p className="text-2xl sm:text-3xl font-bold text-zinc-900">2&nbsp;760&nbsp;€</p>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Part calculée par conseiller pour 10&nbsp;000&nbsp;€ d&apos;honoraires
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-zinc-900">11,5&nbsp;×</p>
                  <p className="text-xs text-zinc-500 mt-0.5">la cotisation annuelle</p>
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-100 text-center">
                  <p className="text-[10px] text-zinc-400">
                    Selon les déductions indiquées,<br />hors autres charges éventuelles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stories list */}
      <section id="histoires" className="py-10 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2 className="text-2xl sm:text-[28px] font-bold text-zinc-900 tracking-tight">
              De belles histoires à partager
            </h2>
            <div className="flex gap-2">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === f.key
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-zinc-400 py-16">
              Aucune réussite publiée pour le moment.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((s) => (
                <SuccessCard key={s.id} success={s} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured story */}
      {featured && (
        <section className="pb-10 sm:pb-14 bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200 overflow-hidden flex flex-col sm:flex-row">
              {featured.photo_url && (
                <div className="relative sm:w-2/5 flex-shrink-0 bg-zinc-200" style={{ minHeight: 220 }}>
                  <img
                    src={featured.photo_url}
                    alt=""
                    className="w-full h-full object-cover absolute inset-0"
                  />
                </div>
              )}
              {!featured.photo_url && (
                <div className="relative sm:w-2/5 flex-shrink-0 bg-zinc-200" style={{ minHeight: 220 }}>
                  <Image
                    src="/photo-coworking.webp"
                    alt=""
                    fill
                    sizes="40vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6 sm:p-8 flex flex-col justify-center flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
                  La belle histoire du mois
                </p>
                {featured.story && (
                  <blockquote className="text-lg sm:text-xl font-semibold text-zinc-900 leading-relaxed text-justify">
                    &laquo;&nbsp;{featured.story}&nbsp;&raquo;
                  </blockquote>
                )}
                {!featured.story && (
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-900">{featured.title}</h3>
                )}
                <div className="mt-4 flex items-center gap-2">
                  {featured.participants.slice(0, 2).map((p, i) => (
                    <span key={i} className="text-sm text-zinc-500">
                      {p.first_name} {p.last_name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Two CTA cards */}
      <section className="pb-14 sm:pb-20 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Déclarer */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-900">
                  Vous avez une réussite à partager&nbsp;?
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Déclarez votre collaboration depuis votre espace membre.
                </p>
              </div>
              <Link
                href="/espace/reussites"
                className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-full hover:bg-zinc-800 transition-colors w-fit"
              >
                Déclarer une réussite
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Adhésion */}
            <div className="rounded-2xl bg-zinc-900 p-6 sm:p-8 flex flex-col justify-between text-white">
              <div>
                <h3 className="text-lg sm:text-xl font-bold">
                  Et si la prochaine était la vôtre&nbsp;?
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Rejoignez les conseillers et partenaires du Kastell.
                </p>
              </div>
              <Link
                href="/#adhesions"
                className="mt-5 inline-flex items-center gap-2 px-6 py-3 border border-white/30 text-white text-sm font-semibold rounded-full hover:bg-white/10 transition-colors w-fit"
              >
                Découvrir l&apos;adhésion
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function CounterCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center border border-zinc-200 rounded-xl px-5 py-4 min-w-[100px]">
      <p className="text-2xl sm:text-3xl font-bold text-zinc-900">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function SuccessCard({ success }: { success: PublicSuccess }) {
  const participantNames = success.participants
    .slice(0, 2)
    .map((p) => p.first_name)
    .join(" & ");

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow group">
      {success.photo_url && (
        <div className="relative bg-zinc-100 overflow-hidden" style={{ aspectRatio: "16/9" }}>
          <img
            src={success.photo_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600">
            {TYPE_LABELS[success.type] || success.type}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-50 text-zinc-400">
            {STAGE_LABELS[success.stage] || success.stage}
          </span>
        </div>
        <h3 className="text-base font-bold text-zinc-900 mb-1">{success.title}</h3>
        {participantNames && (
          <p className="text-sm text-zinc-500 mb-3">{participantNames}</p>
        )}
        {success.stage_date && (
          <p className="text-xs text-zinc-400">
            {new Date(success.stage_date).toLocaleDateString("fr-FR")}
          </p>
        )}
      </div>
    </div>
  );
}
