"use client";

import { useState, useEffect, useCallback } from "react";

interface Property {
  id: string;
  city: string | null;
  price: number | null;
  living_area: number | null;
  rooms: number | null;
  photo_url: string | null;
  property_type: string | null;
}

interface PreparedProperty {
  id: string;
  property_id: string;
  status: string;
}

export default function MardiPreparation({
  properties,
  userId,
}: {
  properties: Property[];
  userId: string;
}) {
  const [sessionDate, setSessionDate] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("preparation");
  const [prepared, setPrepared] = useState<PreparedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    const res = await fetch("/api/mardi/session?role=conseiller");
    if (res.ok) {
      const data = await res.json();
      setSessionId(data.session.id);
      setSessionDate(data.session.session_date);
      setSessionStatus(data.session.status);
      const myProps = (data.properties || []).filter(
        (p: { owner_id: string }) => p.owner_id === userId,
      );
      setPrepared(myProps);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  async function addProperty(propertyId: string) {
    if (!sessionId || acting) return;
    setActing(propertyId);
    const res = await fetch("/api/mardi/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, propertyId }),
    });
    if (res.ok) await fetchSession();
    setActing(null);
  }

  async function removeProperty(propertyId: string) {
    if (!sessionId || acting) return;
    const sp = prepared.find((p) => p.property_id === propertyId);
    if (!sp) return;
    setActing(propertyId);
    const res = await fetch("/api/mardi/prepare", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionPropertyId: sp.id }),
    });
    if (res.ok) await fetchSession();
    setActing(null);
  }

  if (loading) return null;
  if (!sessionId || !sessionDate) return null;

  const preparedIds = new Set(prepared.map((p) => p.property_id));
  const available = properties.filter((p) => !preparedIds.has(p.id));
  const isLocked = sessionStatus !== "preparation";

  const formattedDate = new Date(sessionDate + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  });

  return (
    <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-6 mb-8 text-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span className="capitalize">{formattedDate}</span>
          </div>
          <h2 className="text-lg font-bold">Mes biens pour mardi</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {isLocked ? "La séance a démarré — modifications verrouillées" : "Sélectionne jusqu'à 3 biens à présenter"}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/10 text-white/60">
          {prepared.length}/3
        </span>
      </div>

      {/* Prepared properties */}
      {prepared.length > 0 && (
        <div className="space-y-2 mb-4">
          {prepared.map((pp) => {
            const prop = properties.find((p) => p.id === pp.property_id);
            return (
              <div key={pp.id} className="flex items-center gap-3 px-3 py-2 bg-white/10 rounded-xl">
                <div className="w-10 h-8 rounded-md bg-white/10 overflow-hidden flex-shrink-0">
                  {prop?.photo_url ? (
                    <img src={prop.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {prop?.city || "—"}
                    {prop?.rooms ? ` · ${prop.rooms}p` : ""}
                    {prop?.living_area ? ` · ${prop.living_area} m²` : ""}
                  </p>
                </div>
                {!isLocked && (
                  <button
                    onClick={() => removeProperty(pp.property_id)}
                    disabled={acting === pp.property_id}
                    className="p-1 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add property buttons */}
      {!isLocked && prepared.length < 3 && available.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-white/30 font-medium">Ajouter un bien</p>
          {available.map((prop) => (
            <button
              key={prop.id}
              onClick={() => addProperty(prop.id)}
              disabled={acting === prop.id}
              className="w-full flex items-center gap-3 px-3 py-2 border border-dashed border-white/20 rounded-xl hover:bg-white/5 disabled:opacity-50 transition-colors text-left"
            >
              <div className="w-10 h-8 rounded-md bg-white/10 overflow-hidden flex-shrink-0">
                {prop.photo_url ? (
                  <img src={prop.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">+</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70 truncate">
                  {prop.city || "—"}
                  {prop.rooms ? ` · ${prop.rooms}p` : ""}
                  {prop.living_area ? ` · ${prop.living_area} m²` : ""}
                </p>
              </div>
              <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {!isLocked && properties.length === 0 && (
        <p className="text-sm text-white/40 text-center py-4">Aucun bien partagé. Ajoute d&apos;abord un bien ci-dessous.</p>
      )}
    </div>
  );
}
