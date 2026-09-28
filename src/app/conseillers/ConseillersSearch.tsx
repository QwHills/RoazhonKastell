"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import type { SheetMember } from "@/lib/sheets";
import { getIadSlug, getInitials } from "@/lib/iad-utils";
import PROFILES from "@/data/conseillers-profiles";
import {
  type Commune,
  getCoordsFromCityString,
  searchCommunes,
  haversineKm,
} from "@/data/communes-geo";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type EnrichedMember = SheetMember & {
  slug: string;
  city: string | undefined;
  coords: { lat: number; lng: number } | null;
};

export default function ConseillersSearch({
  members,
}: {
  members: SheetMember[];
}) {
  const [search, setSearch] = useState("");
  const [letterFilter, setLetterFilter] = useState("");
  const [selectedCity, setSelectedCity] = useState<Commune | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const enriched = useMemo<EnrichedMember[]>(
    () =>
      members.map((m) => {
        const slug = getIadSlug(m.firstName, m.lastName);
        const profile = PROFILES[slug];
        const city = profile?.city || undefined;
        const coords = city ? getCoordsFromCityString(city) : null;
        return { ...m, slug, city, coords };
      }),
    [members],
  );

  const citySuggestions = useMemo(() => {
    if (selectedCity || search.length < 2) return [];
    return searchCommunes(search);
  }, [search, selectedCity]);

  const filtered = useMemo(() => {
    let result = enriched;

    if (search && !selectedCity) {
      const q = search
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
      result = result.filter((m) => {
        const fullName = `${m.firstName} ${m.lastName}`
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "");
        const cityNorm = (m.city || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "");
        return fullName.includes(q) || cityNorm.includes(q);
      });
    }

    if (letterFilter) {
      result = result.filter(
        (m) => m.firstName.charAt(0).toUpperCase() === letterFilter,
      );
    }

    if (selectedCity) {
      return result
        .map((m) => ({
          ...m,
          distance: m.coords
            ? haversineKm(
                selectedCity.lat,
                selectedCity.lng,
                m.coords.lat,
                m.coords.lng,
              )
            : 9999,
        }))
        .sort((a, b) => a.distance - b.distance);
    }

    return result.map((m) => ({ ...m, distance: undefined as number | undefined }));
  }, [enriched, search, letterFilter, selectedCity]);

  function selectCity(commune: Commune) {
    setSelectedCity(commune);
    setSearch("");
    setShowSuggestions(false);
    setLetterFilter("");
  }

  function clearCity() {
    setSelectedCity(null);
    setSearch("");
  }

  return (
    <>
      {/* Search bar */}
      <div className="max-w-md mx-auto mb-6" ref={wrapperRef}>
        <div className="relative">
          {selectedCity ? (
            <div className="flex items-center gap-2 w-full pl-4 pr-4 py-3 rounded-2xl border border-zinc-200 bg-white">
              <svg
                className="w-5 h-5 text-zinc-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 rounded-full text-sm font-medium text-zinc-700">
                {selectedCity.name} ({selectedCity.postalCode})
                <button
                  onClick={clearCity}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-zinc-300 transition-colors"
                  aria-label="Effacer la ville"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            </div>
          ) : (
            <>
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
                placeholder="Rechercher par nom ou ville…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder:text-zinc-400"
              />
            </>
          )}

          {showSuggestions && citySuggestions.length > 0 && (
            <div className="absolute z-20 top-full mt-2 w-full bg-white border border-zinc-200 rounded-2xl shadow-lg overflow-hidden">
              <div className="px-4 py-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">
                Villes
              </div>
              {citySuggestions.map((commune) => (
                <button
                  key={`${commune.name}-${commune.postalCode}`}
                  onClick={() => selectCity(commune)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-zinc-50 transition-colors text-left"
                >
                  <svg
                    className="w-4 h-4 text-zinc-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-sm text-zinc-700">{commune.name}</span>
                  <span className="text-xs text-zinc-400 ml-auto">
                    {commune.postalCode}
                  </span>
                </button>
              ))}
            </div>
          )}
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

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((member) => (
            <ConseillerCard
              key={`${member.firstName}-${member.lastName}`}
              member={member}
              distance={member.distance}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-zinc-400 py-12">
          Aucun conseiller trouvé.
        </p>
      )}
    </>
  );
}

function ConseillerCard({
  member,
  distance,
}: {
  member: EnrichedMember;
  distance?: number;
}) {
  const initials = getInitials(member.firstName, member.lastName);
  const profile = PROFILES[member.slug];
  const rawPhoto = profile?.photo || member.photoUrl;
  const photoUrl = rawPhoto ? `${rawPhoto}?format=auto&width=160` : null;

  return (
    <Link
      href={`/conseillers/${member.slug}`}
      className="bg-white border border-zinc-200 rounded-3xl p-6 hover:shadow-lg transition-shadow flex flex-col items-center text-center group"
    >
      <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden mb-4">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`${member.firstName} ${member.lastName}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (
                e.target as HTMLImageElement
              ).parentElement!.innerHTML = `<span class="text-2xl font-bold text-zinc-400">${initials}</span>`;
            }}
          />
        ) : (
          <span className="text-2xl font-bold text-zinc-400">{initials}</span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors">
        {member.firstName} {member.lastName}
      </h3>

      <p className="text-sm text-zinc-500 mt-1">Conseiller IAD</p>

      {member.city && (
        <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {member.city}
        </p>
      )}

      {distance !== undefined && distance < 9999 && (
        <p className="text-xs text-zinc-400 mt-1">
          à {distance < 1 ? "moins de 1" : Math.round(distance)} km
        </p>
      )}

      <span className="mt-4 text-sm text-zinc-900 font-medium group-hover:underline">
        Voir la fiche &rarr;
      </span>
    </Link>
  );
}
