"use client";

import { useState, useEffect, useCallback } from "react";
import PresentationMode from "./PresentationMode";

interface SessionProperty {
  id: string;
  property_id: string;
  owner_id: string;
  status: string;
  draw_order: number | null;
  presented_at: string | null;
  shared_properties: {
    id: string;
    iad_url: string | null;
    transaction_type: string | null;
    property_type: string | null;
    city: string | null;
    postal_code: string | null;
    price: number | null;
    living_area: number | null;
    rooms: number | null;
    bedrooms: number | null;
    description: string | null;
    photo_url: string | null;
    photos: string[];
    dpe_energy_class: string | null;
    dpe_energy_value: number | null;
    dpe_ges_class: string | null;
    dpe_ges_value: number | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    photo_url: string | null;
  } | null;
}

interface Session {
  id: string;
  session_date: string;
  status: string;
  current_property_id: string | null;
  timer_state: { status: string; remaining_ms: number; started_at: string | null };
  started_at: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  a_presenter: "À présenter",
  en_cours: "En cours",
  mis_de_cote: "Mis de côté",
  presente: "Présenté",
};

const STATUS_COLORS: Record<string, string> = {
  a_presenter: "bg-zinc-100 text-zinc-600",
  en_cours: "bg-blue-100 text-blue-700",
  mis_de_cote: "bg-amber-100 text-amber-700",
  presente: "bg-emerald-100 text-emerald-700",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

export default function MardiBiensClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [properties, setProperties] = useState<SessionProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchSession = useCallback(async () => {
    const res = await fetch("/api/mardi/session");
    if (res.ok) {
      const data = await res.json();
      setSession(data.session);
      setProperties(data.properties);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  async function startSession() {
    if (!session || acting) return;
    setActing(true);
    const res = await fetch("/api/mardi/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", sessionId: session.id }),
    });
    if (res.ok) {
      await fetchSession();
      setShowPresentation(true);
    }
    setActing(false);
  }

  async function resumeSession() {
    if (!session || acting) return;
    setActing(true);
    await fetch("/api/mardi/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resume", sessionId: session.id }),
    });
    await fetchSession();
    setShowPresentation(true);
    setActing(false);
  }

  async function resetSession() {
    if (!session || acting) return;
    if (!confirm("Remettre la séance en préparation ?\n\nTous les biens seront réinitialisés.")) return;
    setActing(true);
    await fetch("/api/mardi/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset", sessionId: session.id }),
    });
    await fetchSession();
    setActing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <p className="text-center text-zinc-400 py-16">Impossible de charger la séance.</p>;
  }

  if (showPreview && properties.length > 0) {
    return (
      <PresentationMode
        session={session}
        properties={properties}
        onExit={() => { setShowPreview(false); fetchSession(); }}
        onRefresh={fetchSession}
        previewMode
      />
    );
  }

  if (showPresentation && session.status === "active") {
    return (
      <PresentationMode
        session={session}
        properties={properties}
        onExit={() => { setShowPresentation(false); fetchSession(); }}
        onRefresh={fetchSession}
      />
    );
  }

  const toPresent = properties.filter((p) => p.status === "a_presenter");
  const presented = properties.filter((p) => p.status === "presente");
  const skipped = properties.filter((p) => p.status === "mis_de_cote");
  const counselors = new Set(properties.map((p) => p.owner_id));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Les biens du mardi</h1>
        <p className="text-sm text-zinc-500 mt-1 capitalize">{formatDate(session.session_date)}</p>
        <div className="flex flex-wrap gap-3 mt-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 rounded-full text-xs font-medium text-zinc-600">
            {counselors.size} conseiller{counselors.size > 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 rounded-full text-xs font-medium text-zinc-600">
            {properties.length} bien{properties.length > 1 ? "s" : ""}
          </span>
          {presented.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full text-xs font-medium text-emerald-700">
              {presented.length} présenté{presented.length > 1 ? "s" : ""}
            </span>
          )}
          {skipped.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full text-xs font-medium text-amber-700">
              {skipped.length} mis de côté
            </span>
          )}
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-2xl">
          <svg className="w-12 h-12 text-zinc-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
          </svg>
          <p className="text-zinc-400">Aucun bien inscrit pour cette séance.</p>
          <p className="text-xs text-zinc-400 mt-1">Les conseillers peuvent inscrire leurs biens depuis « Mes biens ».</p>
        </div>
      ) : (
        <>
          <div className="flex gap-3 mb-6">
            {session.status === "preparation" && (
              <>
                <button
                  onClick={startSession}
                  disabled={acting || properties.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                  </svg>
                  Lancer les présentations
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={properties.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Visionner les biens
                </button>
              </>
            )}
            {session.status === "active" && (
              <>
                <button
                  onClick={() => setShowPresentation(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                  </svg>
                  Reprendre la séance
                </button>
                <button
                  onClick={resetSession}
                  disabled={acting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                >
                  Reprendre du début
                </button>
              </>
            )}
            {session.status === "completed" && (
              <>
                <button
                  onClick={resumeSession}
                  disabled={acting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                  </svg>
                  Reprendre la séance
                </button>
                <button
                  onClick={resetSession}
                  disabled={acting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                >
                  Reprendre du début
                </button>
              </>
            )}
          </div>

          <div className="space-y-3">
            {properties.map((sp) => {
              const prop = sp.shared_properties;
              const owner = sp.profiles;
              if (!prop || !owner) return null;
              const initials = `${owner.first_name.charAt(0)}${owner.last_name.charAt(0)}`.toUpperCase();

              return (
                <div
                  key={sp.id}
                  className={`flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-xl ${sp.status === "presente" ? "opacity-60" : ""}`}
                >
                  <div className="w-16 h-14 rounded-lg bg-zinc-100 overflow-hidden flex-shrink-0">
                    {prop.photo_url ? (
                      <img src={prop.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {prop.city || "—"}
                      {prop.rooms ? ` · ${prop.rooms}p` : ""}
                      {prop.living_area ? ` · ${prop.living_area} m²` : ""}
                    </p>
                    {prop.price != null && (
                      <p className="text-sm font-semibold text-zinc-700">{prop.price.toLocaleString("fr-FR")} €</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden" title={`${owner.first_name} ${owner.last_name}`}>
                      {owner.photo_url ? (
                        <img src={owner.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-400">{initials}</span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[sp.status] || ""}`}>
                      {STATUS_LABELS[sp.status] || sp.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bilan si terminé */}
          {session.status === "completed" && (
            <div className="mt-8 bg-white border border-zinc-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-zinc-900 mb-4">Bilan de la séance</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{presented.length}</p>
                  <p className="text-xs text-zinc-500">Présentés</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{skipped.length}</p>
                  <p className="text-xs text-zinc-500">Mis de côté</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-zinc-400">{toPresent.length}</p>
                  <p className="text-xs text-zinc-500">Non présentés</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-zinc-900">{new Set(presented.map((p) => p.owner_id)).size}</p>
                  <p className="text-xs text-zinc-500">Conseillers ayant présenté</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
