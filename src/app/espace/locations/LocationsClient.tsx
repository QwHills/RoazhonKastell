"use client";

import { useState } from "react";
import type { LocationRequest, LocationRequestStatus } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

const STATUS_CONFIG: Record<LocationRequestStatus, { label: string; bg: string; text: string }> = {
  nouvelle: { label: "Nouvelle", bg: "bg-blue-50", text: "text-blue-700" },
  acceptee: { label: "Acceptée", bg: "bg-emerald-50", text: "text-emerald-700" },
  refusee: { label: "Refusée", bg: "bg-red-50", text: "text-red-700" },
  contrat_envoye: { label: "Contrat envoyé", bg: "bg-amber-50", text: "text-amber-700" },
  contrat_signe: { label: "Contrat signé", bg: "bg-emerald-50", text: "text-emerald-800" },
};

const FORMULE_LABELS: Record<string, string> = {
  "salle-reunion": "Salle de réunion — 150 €",
  "demi-journee": "Demi-journée — 200 €",
  journee: "Journée complète — 300 €",
  "week-end": "Week-end complet — 500 €",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function LocationsClient({ requests: initial }: { requests: LocationRequest[] }) {
  const [requests, setRequests] = useState(initial);
  const [selected, setSelected] = useState<LocationRequest | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<LocationRequestStatus | "toutes">("toutes");

  const filtered = filter === "toutes" ? requests : requests.filter((r) => r.status === filter);

  const counts = requests.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  async function updateStatus(id: string, status: LocationRequestStatus) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("location_requests")
      .update({ status, admin_note: note || null, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status, admin_note: note || null, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() } : r,
        ),
      );
      if (selected?.id === id) {
        setSelected((prev) => (prev ? { ...prev, status, admin_note: note || null } : null));
      }
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Demandes de location</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {requests.length} demande{requests.length > 1 ? "s" : ""} au total
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {(["nouvelle", "acceptee", "refusee", "contrat_envoye", "contrat_signe"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(filter === s ? "toutes" : s)}
                className={`px-4 py-3 rounded-xl border text-center transition-all ${
                  filter === s
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : `border-zinc-200 bg-white hover:border-zinc-300`
                }`}
              >
                <p className="text-2xl font-bold">{counts[s] || 0}</p>
                <p className={`text-[11px] font-medium ${filter === s ? "text-zinc-300" : cfg.text}`}>
                  {cfg.label}
                </p>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
            <p className="text-zinc-400 text-sm">Aucune demande{filter !== "toutes" ? ` avec le statut « ${STATUS_CONFIG[filter].label} »` : ""}.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((req) => {
              const cfg = STATUS_CONFIG[req.status];
              return (
                <div
                  key={req.id}
                  onClick={() => { setSelected(req); setNote(req.admin_note || ""); }}
                  className={`bg-white border rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all ${
                    selected?.id === req.id ? "border-zinc-900 shadow-md" : "border-zinc-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        {req.is_adherent && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
                            Adhérent
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-zinc-900">
                        {req.prenom} {req.nom}
                        {req.societe && <span className="text-zinc-400 font-normal"> — {req.societe}</span>}
                      </p>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        {FORMULE_LABELS[req.formule] || req.formule} · {formatDate(req.date_debut)}
                        {req.date_fin && ` → ${formatDate(req.date_fin)}`}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">{req.objet} · {req.nb_personnes} pers.</p>
                    </div>
                    <div className="text-xs text-zinc-400 shrink-0">
                      {formatDate(req.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail panel */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-900">Détail de la demande</h2>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[selected.status].bg} ${STATUS_CONFIG[selected.status].text}`}>
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                  {selected.is_adherent && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">Adhérent</span>
                  )}
                </div>

                {/* Reservation info */}
                <div>
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-3">Réservation</h3>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <Detail label="Formule" value={FORMULE_LABELS[selected.formule] || selected.formule} />
                    <Detail label="Date" value={`${formatDate(selected.date_debut)}${selected.date_fin ? ` → ${formatDate(selected.date_fin)}` : ""}`} />
                    <Detail label="Objet" value={selected.objet} />
                    <Detail label="Personnes" value={String(selected.nb_personnes)} />
                  </div>
                </div>

                {/* Identity */}
                <div>
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-3">Locataire</h3>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <Detail label="Nom" value={`${selected.prenom} ${selected.nom}`} />
                    <Detail label="Email" value={selected.email} />
                    <Detail label="Téléphone" value={selected.telephone} />
                    <Detail label="Adresse" value={`${selected.adresse}, ${selected.code_postal} ${selected.ville}`} />
                    {selected.societe && <Detail label="Société" value={selected.societe} />}
                    {selected.siret && <Detail label="SIRET" value={selected.siret} />}
                  </div>
                </div>

                {selected.besoins && (
                  <div>
                    <h3 className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2">Besoins particuliers</h3>
                    <p className="text-sm text-zinc-600 bg-zinc-50 rounded-xl p-4">{selected.besoins}</p>
                  </div>
                )}

                {/* Admin note */}
                <div>
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2">Note interne</h3>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Ajouter une note interne..."
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selected.status === "nouvelle" && (
                    <>
                      <button
                        onClick={() => updateStatus(selected.id, "acceptee")}
                        disabled={saving}
                        className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => updateStatus(selected.id, "refusee")}
                        disabled={saving}
                        className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        Refuser
                      </button>
                    </>
                  )}
                  {selected.status === "acceptee" && (
                    <button
                      onClick={() => updateStatus(selected.id, "contrat_envoye")}
                      disabled={saving}
                      className="px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                      Marquer contrat envoyé
                    </button>
                  )}
                  {selected.status === "contrat_envoye" && (
                    <button
                      onClick={() => updateStatus(selected.id, "contrat_signe")}
                      disabled={saving}
                      className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      Marquer contrat signé
                    </button>
                  )}
                  {(selected.status === "acceptee" || selected.status === "contrat_envoye" || selected.status === "contrat_signe") && (
                    <a
                      href={`/api/location/contrat?id=${selected.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      Générer le contrat
                    </a>
                  )}
                  {note !== (selected.admin_note || "") && (
                    <button
                      onClick={() => updateStatus(selected.id, selected.status)}
                      disabled={saving}
                      className="px-4 py-2.5 bg-zinc-200 text-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-300 transition-colors disabled:opacity-50"
                    >
                      Sauvegarder la note
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{label}</p>
      <p className="text-zinc-900 mt-0.5">{value}</p>
    </div>
  );
}
