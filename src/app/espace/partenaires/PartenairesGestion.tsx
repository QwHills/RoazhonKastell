"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PartenaireEdit from "./PartenaireEdit";
import type { Partner as FullPartner, PartnerContact as FullPartnerContact } from "@/lib/supabase/types";

interface PartnerContact {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  sort_order: number;
}

interface Partner {
  id: string;
  name: string;
  category: string | null;
  sector: string | null;
  description: string | null;
  services: string | null;
  logo_url: string | null;
  remuneration: boolean;
  cotisation_montant: number | null;
  cotisation_frequence: "mensuel" | "annuel" | null;
  cotisation_debut: string | null;
  jour_prelevement: number | null;
  status: string;
  partner_contacts: PartnerContact[];
}

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  soumis: "Soumis",
  valide: "Validé",
  refuse: "Refusé",
};

const STATUS_COLORS: Record<string, string> = {
  brouillon: "bg-zinc-100 text-zinc-500",
  soumis: "bg-amber-100 text-amber-700",
  valide: "bg-emerald-100 text-emerald-700",
  refuse: "bg-red-100 text-red-700",
};

export default function PartenairesGestion({
  partners: initialPartners,
}: {
  partners: Partner[];
}) {
  const [partners, setPartners] = useState(initialPartners);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editCotisation, setEditCotisation] = useState<{ id: string; montant: string; frequence: string; debut: string; jourPrelevement: string } | null>(null);
  const [grantingAccess, setGrantingAccess] = useState<string | null>(null);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantedPartners, setGrantedPartners] = useState<Set<string>>(new Set());
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const filtered = partners.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("partners")
      .update({ status, validated_by: null })
      .eq("id", id);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p)),
    );
  }

  async function saveCotisation(id: string) {
    if (!editCotisation) return;
    const supabase = createClient();
    const montant = editCotisation.montant ? parseFloat(editCotisation.montant) : null;
    const frequence = editCotisation.frequence || null;
    const debut = editCotisation.debut || null;
    const jourPrelevement = editCotisation.jourPrelevement ? parseInt(editCotisation.jourPrelevement) : null;
    const { error } = await supabase
      .from("partners")
      .update({ cotisation_montant: montant, cotisation_frequence: frequence, cotisation_debut: debut, jour_prelevement: jourPrelevement })
      .eq("id", id);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    setPartners((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, cotisation_montant: montant, cotisation_frequence: frequence as Partner["cotisation_frequence"], cotisation_debut: debut, jour_prelevement: jourPrelevement } : p,
      ),
    );
    setEditCotisation(null);
  }

  async function grantAccess(partnerId: string, email: string) {
    setGrantLoading(true);
    const nameParts = email.split("@")[0].split(".");
    const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : "";
    const lastName = nameParts.slice(1).join(" ").toUpperCase();

    const res = await fetch("/api/partners/grant-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId, email, firstName, lastName }),
    });
    const data = await res.json();
    setGrantLoading(false);

    if (data.error) {
      alert("Erreur : " + data.error);
      return;
    }

    setGrantedPartners((prev) => new Set([...prev, partnerId]));
    setGrantingAccess(null);
    setGrantEmail("");
  }

  if (editingPartner) {
    return (
      <div>
        <button
          onClick={() => setEditingPartner(null)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la liste
        </button>
        <PartenaireEdit
          partner={editingPartner as unknown as FullPartner}
          contacts={(editingPartner.partner_contacts || []) as unknown as FullPartnerContact[]}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Gestion des partenaires</h1>
          <p className="text-sm text-zinc-500 mt-1">{partners.length} partenaire{partners.length > 1 ? "s" : ""}</p>
          {(() => {
            const mensuel = partners.filter((p) => p.cotisation_montant && p.cotisation_frequence === "mensuel").reduce((s, p) => s + (p.cotisation_montant || 0), 0);
            const annuel = partners.filter((p) => p.cotisation_montant && p.cotisation_frequence === "annuel").reduce((s, p) => s + (p.cotisation_montant || 0), 0);
            if (mensuel === 0 && annuel === 0) return null;
            const parts = [];
            if (mensuel > 0) parts.push(`${mensuel.toLocaleString("fr-FR")} € / mois`);
            if (annuel > 0) parts.push(`${annuel.toLocaleString("fr-FR")} € / an`);
            return <p className="text-sm font-medium text-emerald-600 mt-1">{parts.join(" + ")}</p>;
          })()}
        </div>
      </div>

      <div className="max-w-md mb-6">
        <input
          type="text"
          placeholder="Rechercher un partenaire…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((partner) => (
          <div key={partner.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === partner.id ? null : partner.id)}
              className="w-full p-5 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-4">
                {partner.logo_url ? (
                  <img src={partner.logo_url} alt="" className="w-10 h-10 object-contain" />
                ) : (
                  <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-sm font-bold text-zinc-400">
                    {partner.name[0]}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-zinc-900">{partner.name}</span>
                  {partner.category && (
                    <span className="text-sm text-zinc-400 ml-2">{partner.category}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[partner.status] || ""}`}>
                  {STATUS_LABELS[partner.status] || partner.status}
                </span>
                <svg className={`w-4 h-4 text-zinc-400 transition-transform ${expandedId === partner.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {expandedId === partner.id && (
              <div className="px-5 pb-5 border-t border-zinc-100 pt-4">
                {partner.sector && (
                  <p className="text-sm text-zinc-600 mb-2"><strong>Secteur :</strong> {partner.sector}</p>
                )}
                {partner.services && (
                  <p className="text-sm text-zinc-600 mb-2"><strong>Prestations :</strong> {partner.services}</p>
                )}
                {partner.description && (
                  <p className="text-sm text-zinc-600 mb-4">{partner.description}</p>
                )}

                {/* Cotisation */}
                <div className="mb-4 p-3 bg-zinc-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-700">Cotisation</p>
                    {editCotisation?.id !== partner.id && (
                      <button
                        onClick={() => setEditCotisation({
                          id: partner.id,
                          montant: partner.cotisation_montant != null ? String(partner.cotisation_montant) : "",
                          frequence: partner.cotisation_frequence || "mensuel",
                          debut: partner.cotisation_debut || "",
                          jourPrelevement: partner.jour_prelevement != null ? String(partner.jour_prelevement) : "",
                        })}
                        className="text-xs text-zinc-400 hover:text-zinc-700"
                      >
                        Modifier
                      </button>
                    )}
                  </div>
                  {editCotisation?.id === partner.id ? (
                    <div className="space-y-2 mt-2">
                      <div className="flex flex-wrap items-end gap-2">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Montant (€)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editCotisation.montant}
                            onChange={(e) => setEditCotisation({ ...editCotisation, montant: e.target.value })}
                            placeholder="Ex : 50"
                            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm w-28"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Fréquence</label>
                          <select
                            value={editCotisation.frequence}
                            onChange={(e) => setEditCotisation({ ...editCotisation, frequence: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm bg-white"
                          >
                            <option value="mensuel">Par mois</option>
                            <option value="annuel">Par an</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Depuis le</label>
                          <input
                            type="date"
                            value={editCotisation.debut}
                            onChange={(e) => setEditCotisation({ ...editCotisation, debut: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Jour de prélèvement</label>
                          <select
                            value={editCotisation.jourPrelevement}
                            onChange={(e) => setEditCotisation({ ...editCotisation, jourPrelevement: e.target.value })}
                            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm bg-white"
                          >
                            <option value="">—</option>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <option key={d} value={String(d)}>Le {d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveCotisation(partner.id)}
                          className="px-3 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setEditCotisation(null)}
                          className="px-3 py-2 border border-zinc-200 rounded-lg text-xs hover:bg-zinc-50"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-600 mt-1">
                      {partner.cotisation_montant != null && partner.cotisation_montant > 0
                        ? `${partner.cotisation_montant.toLocaleString("fr-FR")} € / ${partner.cotisation_frequence === "annuel" ? "an" : "mois"}`
                        : "Non renseignée"}
                      {partner.cotisation_debut && (
                        <span className="text-xs text-zinc-400 ml-2">
                          (depuis le {new Date(partner.cotisation_debut).toLocaleDateString("fr-FR")})
                        </span>
                      )}
                      {partner.jour_prelevement && (
                        <span className="text-xs text-zinc-400 ml-1">
                          · prélevé le {partner.jour_prelevement}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {partner.partner_contacts.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-zinc-700 mb-2">Interlocuteurs</p>
                    <div className="space-y-2">
                      {partner.partner_contacts
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((c) => (
                          <div key={c.id} className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-medium text-zinc-800">{c.name}</span>
                            {c.note && <span className="text-zinc-400">({c.note})</span>}
                            {c.phone && <span className="text-zinc-500">{c.phone}</span>}
                            {c.email && <span className="text-zinc-500">{c.email}</span>}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Donner accès */}
                <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-700">Accès espace partenaire</p>
                  </div>
                  {grantedPartners.has(partner.id) ? (
                    <p className="text-sm text-emerald-600 mt-1 font-medium">Accès créé (mot de passe : Roazhonkastell35)</p>
                  ) : grantingAccess === partner.id ? (
                    <div className="mt-2 space-y-2">
                      {partner.partner_contacts.filter((c) => c.email).length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-zinc-500">Choisir un interlocuteur :</p>
                          {partner.partner_contacts
                            .filter((c) => c.email)
                            .map((c) => (
                              <button
                                key={c.id}
                                onClick={() => setGrantEmail(c.email!)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                  grantEmail === c.email
                                    ? "bg-zinc-900 text-white"
                                    : "bg-white border border-zinc-200 hover:bg-zinc-50"
                                }`}
                              >
                                {c.name} — {c.email}
                              </button>
                            ))}
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Ou saisir un autre email :</p>
                        <input
                          type="email"
                          value={grantEmail}
                          onChange={(e) => setGrantEmail(e.target.value)}
                          placeholder="email@exemple.fr"
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => grantAccess(partner.id, grantEmail)}
                          disabled={!grantEmail || grantLoading}
                          className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50"
                        >
                          {grantLoading ? "Création…" : "Créer le compte"}
                        </button>
                        <button
                          onClick={() => { setGrantingAccess(null); setGrantEmail(""); }}
                          className="px-4 py-2 border border-zinc-200 rounded-lg text-xs hover:bg-zinc-50"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setGrantingAccess(partner.id)}
                      className="mt-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Donner accès à un interlocuteur
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100">
                  <button
                    onClick={() => setEditingPartner(partner)}
                    className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 inline-flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                    Modifier la fiche
                  </button>
                  {partner.status === "soumis" && (
                    <>
                      <button
                        onClick={() => updateStatus(partner.id, "valide")}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => updateStatus(partner.id, "refuse")}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200"
                      >
                        Refuser
                      </button>
                    </>
                  )}
                  {partner.status === "valide" && (
                    <button
                      onClick={() => updateStatus(partner.id, "inactif" as string)}
                      className="px-4 py-2 border border-zinc-200 rounded-xl text-sm hover:bg-zinc-50"
                    >
                      Dépublier
                    </button>
                  )}
                  {(partner.status === "refuse" || partner.status === "brouillon") && (
                    <button
                      onClick={() => updateStatus(partner.id, "valide")}
                      className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800"
                    >
                      Publier
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
