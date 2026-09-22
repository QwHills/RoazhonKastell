"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchMembersFromSheet } from "@/lib/sheets";
import type { SheetMember } from "@/lib/sheets";
import { buildIadMiniSiteUrl, getIadSlug, getInitials } from "@/lib/iad-utils";
import PROFILES from "@/data/conseillers-profiles";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Adherents() {
  const [members, setMembers] = useState<SheetMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [letterFilter, setLetterFilter] = useState("");
  const [showAll, setShowAll] = useState(false);
  const INITIAL_COUNT = 3;

  /* ── Fetch Google Sheet ── */
  useEffect(() => {
    let cancelled = false;
    fetchMembersFromSheet()
      .then((data) => {
        if (!cancelled) {
          setMembers(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Erreur chargement adhérents:", err);
          setError("Impossible de charger la liste des adhérents.");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  /* ── Dev checks ── */
  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || loading) return;
    console.assert(Array.isArray(members), "members doit être un array");
    members.forEach((m) => {
      console.assert(m.firstName || m.lastName, "Chaque membre doit avoir un nom ou prénom");
    });
    console.log(`Adherents: ${members.length} membres chargés depuis la sheet.`);
  }, [members, loading]);

  /* ── Filtrage + tri alphabétique par prénom ── */
  const filtered = useMemo(() => {
    return members
      .filter((m) => {
        const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
        const matchesSearch = search === "" || fullName.includes(search.toLowerCase());
        const matchesLetter =
          letterFilter === "" || m.firstName.charAt(0).toUpperCase() === letterFilter;
        return matchesSearch && matchesLetter;
      })
      .sort((a, b) =>
        a.firstName.localeCompare(b.firstName, "fr", { sensitivity: "base" })
      );
  }, [members, search, letterFilter]);

  /* ── Affichage limité ou complet ── */
  const isFiltering = search !== "" || letterFilter !== "";
  const visible = isFiltering || showAll ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hasMore = !isFiltering && !showAll && filtered.length > INITIAL_COUNT;

  return (
    <section id="adherents" className="py-20 sm:py-28 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
            Nos adhérents
          </h2>
          <p className="mt-4 text-zinc-500 text-lg">
            Les conseillers IAD du réseau Roazhon Kastell.
          </p>
          {!loading && !error && (
            <p className="mt-2 text-sm text-zinc-400">
              {members.length} conseiller{members.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-center text-red-500 py-12">{error}</p>
        )}

        {!loading && !error && (
          <>
            {/* Search */}
            <div className="max-w-md mx-auto mb-6">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher par nom ou prénom…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Alphabet filter */}
            <div className="flex flex-wrap items-center justify-center gap-1 mb-10">
              <button
                onClick={() => setLetterFilter("")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  letterFilter === ""
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                Tous
              </button>
              {alphabet.map((letter) => (
                <button
                  key={letter}
                  onClick={() =>
                    setLetterFilter(letterFilter === letter ? "" : letter)
                  }
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    letterFilter === letter
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>

            {/* Conseillers IAD */}
            {visible.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visible.map((member) => (
                  <MemberCard key={`${member.firstName}-${member.lastName}`} member={member} />
                ))}
              </div>
            )}

            {/* Bouton Voir plus / Voir moins */}
            {filtered.length > INITIAL_COUNT && !isFiltering && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-8 py-3 rounded-2xl border border-zinc-300 text-zinc-700 font-semibold hover:bg-zinc-100 transition-colors flex items-center gap-2"
                >
                  {showAll ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                      Voir moins
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      Voir plus ({filtered.length - INITIAL_COUNT} autres)
                    </>
                  )}
                </button>
              </div>
            )}

            {filtered.length === 0 && (
              <p className="text-center text-zinc-400 py-12">
                Aucun adhérent trouvé.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ── Carte membre ── */

function MemberCard({ member }: { member: SheetMember }) {
  const slug = getIadSlug(member.firstName, member.lastName);
  const miniSiteUrl =
    member.miniSiteUrl || buildIadMiniSiteUrl(member.firstName, member.lastName);
  const initials = getInitials(member.firstName, member.lastName);
  const profile = PROFILES[slug];
  const rawPhoto = profile?.photo || member.photoUrl;
  const photoUrl = rawPhoto ? `${rawPhoto}?format=auto&width=160` : null;
  const city = profile?.city;

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 hover:shadow-lg transition-shadow flex flex-col items-center text-center">
      {/* Photo de profil */}
      <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden mb-4">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`${member.firstName} ${member.lastName}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-2xl font-bold text-zinc-400">${initials}</span>`;
            }}
          />
        ) : (
          <span className="text-2xl font-bold text-zinc-400">{initials}</span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-zinc-900">
        {member.firstName} {member.lastName}
      </h3>

      <p className="text-sm text-zinc-500 mt-1">Conseiller IAD</p>

      {city && (
        <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {city}
        </p>
      )}

      {/* Actions */}
      <div className="mt-5 flex items-center gap-3">
        <a
          href={miniSiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-2xl text-sm font-semibold hover:bg-zinc-800 transition-colors flex items-center gap-2"
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
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Mini-site IAD
        </a>
      </div>
    </div>
  );
}
