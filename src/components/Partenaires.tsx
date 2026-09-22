"use client";

import { useState } from "react";
import { partenaires, metiers } from "@/data/partenaires";
import type { Partenaire } from "@/data/partenaires";

function PartenaireCard({ p }: { p: Partenaire }) {
  const [open, setOpen] = useState(false);
  const firstContact = p.contacts[0];
  const firstEmail = p.contacts.find((c) => c.email)?.email;
  const firstTel = p.contacts.find((c) => c.telephone)?.telephone;

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          {p.logo ? (
            <img src={p.logo} alt={`Logo ${p.nom}`} className="w-full h-full object-contain p-1" />
          ) : (
            <span className="text-lg font-bold text-zinc-400">
              {p.nom.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-zinc-900">{p.nom}</h3>
            {p.remuneration && (
              <span className="text-xs font-medium bg-zinc-900 text-white px-2.5 py-0.5 rounded-full whitespace-nowrap">
                Rémunération dossier validé
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500">{p.secteur}</p>
        </div>
      </div>

      {/* Boutons Contacter / Appeler */}
      <div className="mt-5 flex items-center justify-center gap-3">
        {firstEmail ? (
          <a
            href={`mailto:${firstEmail}`}
            className="px-5 py-2.5 bg-zinc-900 text-white rounded-2xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
          >
            Contacter
          </a>
        ) : firstContact?.note ? (
          <span className="text-sm text-zinc-500 italic">{firstContact.note}</span>
        ) : null}
        {firstTel && (
          <a
            href={`tel:${firstTel}`}
            className="px-5 py-2.5 bg-zinc-100 text-zinc-900 rounded-2xl text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            Appeler
          </a>
        )}
      </div>

      {/* Déroulant contacts */}
      {p.contacts.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setOpen(!open)}
            className="w-full text-center text-sm text-zinc-400 hover:text-zinc-600 transition-colors flex items-center justify-center gap-1"
          >
            {open ? "Masquer les contacts" : "Voir tous les contacts"}
            <svg
              className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="mt-3 space-y-3">
              {p.contacts.map((c) => (
                <div
                  key={c.nom}
                  className="border-t border-zinc-100 pt-3"
                >
                  <p className="font-semibold text-zinc-800 text-sm">{c.nom}</p>
                  {c.telephone && (
                    <a href={`tel:${c.telephone}`} className="block mt-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                      📞 {c.telephone}
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="block mt-0.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors truncate">
                      ✉️ {c.email}
                    </a>
                  )}
                  {c.note && <p className="mt-0.5 text-sm italic text-zinc-400">{c.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const INITIAL_COUNT = 3;

export default function Partenaires() {
  const [filtre, setFiltre] = useState("Tous métiers");
  const [showAll, setShowAll] = useState(false);

  const filtered =
    filtre === "Tous métiers"
      ? partenaires
      : partenaires.filter((p) => p.metier === filtre);

  const isFiltering = filtre !== "Tous métiers";
  const visible = isFiltering || showAll ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hiddenCount = filtered.length - INITIAL_COUNT;

  return (
    <section id="partenaires" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">Partenaires</h2>
          <p className="mt-4 text-zinc-500 text-lg">Les professionnels du réseau Roazhon Kastell.</p>
        </div>

        {/* Pills filtre */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {metiers.map((m) => (
            <button
              key={m}
              onClick={() => { setFiltre(m); setShowAll(false); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filtre === m
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((p) => (
            <PartenaireCard key={p.nom} p={p} />
          ))}
        </div>

        {/* Bouton voir plus / voir moins */}
        {!isFiltering && hiddenCount > 0 && (
          <div className="text-center mt-10">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-8 py-3 bg-zinc-100 text-zinc-700 rounded-2xl text-sm font-semibold hover:bg-zinc-200 transition-colors"
            >
              {showAll ? "Voir moins" : `Voir plus (${hiddenCount} autres)`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
