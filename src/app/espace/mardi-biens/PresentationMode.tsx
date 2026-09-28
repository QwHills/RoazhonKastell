"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import TimerRing from "./TimerRing";

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
    land_area?: number | null;
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

interface Props {
  session: Session;
  properties: SessionProperty[];
  onExit: () => void;
  onRefresh: () => Promise<void>;
  previewMode?: boolean;
}

const PROMPTS = [
  "Localisation et cadre de vie",
  "Points forts et potentiel",
  "Profil acquéreur idéal",
];

const DPE_COLORS: Record<string, string> = {
  A: "bg-[#319834]", B: "bg-[#33a357]", C: "bg-[#cbdb2a]",
  D: "bg-[#f3ec02]", E: "bg-[#f0b40e]", F: "bg-[#ec6927]", G: "bg-[#e12726]",
};

function PropertyMap({ lat, lng }: { lat: number; lng: number }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js";
    script.onload = () => {
      const L = (window as unknown as Record<string, unknown>).L as {
        map: (el: HTMLElement, opts: Record<string, unknown>) => {
          setView: (coords: [number, number], zoom: number) => unknown;
          invalidateSize: () => void;
        };
        tileLayer: (url: string, opts: Record<string, unknown>) => { addTo: (map: unknown) => void };
        marker: (coords: [number, number]) => { addTo: (map: unknown) => void };
      };
      if (!L || !mapRef.current) return;
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([lat, lng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);
      L.marker([lat, lng]).addTo(map);
      leafletRef.current = map;
      setTimeout(() => (map as { invalidateSize: () => void }).invalidateSize(), 100);
    };
    document.head.appendChild(script);

    return () => {
      link.remove();
      script.remove();
    };
  }, [lat, lng]);

  return <div ref={mapRef} className="w-full h-full rounded-xl" />;
}

export default function PresentationMode({ session: initialSession, properties: initialProps, onExit, onRefresh, previewMode = false }: Props) {
  const [session, setSession] = useState(initialSession);
  const [properties, setProperties] = useState(initialProps);
  const [currentProp, setCurrentProp] = useState<SessionProperty | null>(previewMode && initialProps.length > 0 ? initialProps[0] : null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [noEligible, setNoEligible] = useState(false);
  const [skippedCount, setSkippedCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const presented = properties.filter((p) => p.status === "presente");
  const toPresent = properties.filter((p) => p.status === "a_presenter");
  const skipped = properties.filter((p) => p.status === "mis_de_cote");
  const total = properties.length;
  const doneCount = presented.length;

  useEffect(() => {
    if (session.current_property_id) {
      const found = properties.find((p) => p.id === session.current_property_id && p.status === "en_cours");
      setCurrentProp(found || null);
    }
  }, [session.current_property_id, properties]);

  const refreshData = useCallback(async () => {
    const res = await fetch("/api/mardi/session");
    if (res.ok) {
      const data = await res.json();
      setSession(data.session);
      setProperties(data.properties);
    }
  }, []);

  async function drawNext() {
    if (drawing) return;
    setDrawing(true);
    setNoEligible(false);
    const res = await fetch("/api/mardi/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.error === "no_eligible") {
        setNoEligible(true);
        setSkippedCount(data.remaining_skipped || 0);
      } else if (data.drawn) {
        setCurrentProp(data.drawn);
        setPhotoIndex(0);
        await refreshData();
      }
    }
    setDrawing(false);
  }

  async function decide(decision: "presente" | "mis_de_cote") {
    if (!currentProp || deciding) return;
    setDeciding(true);
    const res = await fetch("/api/mardi/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, propertyId: currentProp.id, decision }),
    });
    if (res.ok) {
      setCurrentProp(null);
      await refreshData();
    }
    setDeciding(false);
  }

  async function undoSkip(propId: string) {
    await fetch("/api/mardi/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, propertyId: propId, decision: "a_presenter" }),
    });
    setNoEligible(false);
    await refreshData();
  }

  async function completeSession() {
    await fetch("/api/mardi/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", sessionId: session.id }),
    });
    await onRefresh();
    onExit();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }

  useEffect(() => {
    function onFsChange() { setIsFullscreen(!!document.fullscreenElement); }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const prop = currentProp?.shared_properties;
  const owner = currentProp?.profiles;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-50 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-zinc-200">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {previewMode ? "Quitter l'aperçu" : "Retour"}
        </button>

        {previewMode ? (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">Aperçu — aucune modification</span>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span className="font-semibold text-zinc-900">{doneCount}</span>
              <span>/</span>
              <span>{total}</span>
              <span>présentés</span>
            </div>
            <div className="w-32 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-900 rounded-full transition-all duration-500"
                style={{ width: total > 0 ? `${(doneCount / total) * 100}%` : "0%" }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!previewMode && (
            <button
              onClick={() => { if (confirm("Terminer la séance ?")) completeSession(); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              Terminer
            </button>
          )}
          <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
          {isFullscreen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          )}
        </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {currentProp && prop && owner ? (
          <>
            {/* Left: Property */}
            <div className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto">
              <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                {(() => {
                  const allPhotos = prop.photos?.length > 0 ? prop.photos : prop.photo_url ? [prop.photo_url] : [];
                  if (allPhotos.length > 0) {
                    return (
                      <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-zinc-200 relative group">
                        <img src={allPhotos[photoIndex] || allPhotos[0]} alt="" className="w-full h-full object-cover transition-opacity" />
                        {allPhotos.length > 1 && (
                          <>
                            <button
                              onClick={() => setPhotoIndex((i) => (i - 1 + allPhotos.length) % allPhotos.length)}
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setPhotoIndex((i) => (i + 1) % allPhotos.length)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                              </svg>
                            </button>
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-xs rounded-full">
                              {photoIndex + 1} / {allPhotos.length}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div className="w-full aspect-[4/3] rounded-2xl mb-6 bg-zinc-100 flex items-center justify-center">
                      <svg className="w-20 h-20 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                      </svg>
                    </div>
                  );
                })()}

                <div className="w-full">
                  <div className="flex items-baseline gap-2 mb-1">
                    {prop.property_type && (
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{prop.property_type}</span>
                    )}
                    {prop.transaction_type && (
                      <span className="text-xs text-zinc-400">· {prop.transaction_type}</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900 mb-1">{prop.city || "Localisation non renseignée"}</h2>
                  {prop.address && (
                    <p className="text-sm text-zinc-500 mb-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {prop.address}
                    </p>
                  )}
                  {prop.price != null && (
                    <p className="text-xl font-bold text-zinc-900 mb-4">{prop.price.toLocaleString("fr-FR")} €</p>
                  )}

                  {prop.latitude && prop.longitude && (
                    <div className="w-full h-64 rounded-xl overflow-hidden mb-4 border border-zinc-200">
                      <PropertyMap lat={prop.latitude} lng={prop.longitude} />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                    {prop.living_area != null && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        </svg>
                        {prop.living_area} m²
                      </span>
                    )}
                    {prop.rooms != null && (
                      <span>{prop.rooms} pièce{prop.rooms > 1 ? "s" : ""}</span>
                    )}
                    {prop.bedrooms != null && (
                      <span>{prop.bedrooms} chambre{prop.bedrooms > 1 ? "s" : ""}</span>
                    )}
                    {prop.dpe_energy_class && (
                      <span className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white ${DPE_COLORS[prop.dpe_energy_class] || "bg-zinc-400"}`}>
                          {prop.dpe_energy_class}
                        </span>
                        DPE{prop.dpe_energy_value ? ` ${prop.dpe_energy_value} kWh` : ""}
                      </span>
                    )}
                    {prop.dpe_ges_class && (
                      <span className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white ${DPE_COLORS[prop.dpe_ges_class] || "bg-zinc-400"}`}>
                          {prop.dpe_ges_class}
                        </span>
                        GES
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Counselor + Timer */}
            <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-zinc-200 bg-white flex flex-col items-center justify-center p-8">
              <div className="flex flex-col items-center gap-6 w-full max-w-xs">
                {/* Counselor */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-zinc-100 overflow-hidden mb-3">
                    {owner.photo_url ? (
                      <img src={owner.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xl font-bold text-zinc-400">
                          {owner.first_name.charAt(0)}{owner.last_name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-lg font-semibold text-zinc-900">{owner.first_name} {owner.last_name}</p>
                  <p className="text-sm text-zinc-400">Présente-nous ton bien</p>
                </div>

                {previewMode ? (
                  <div className="w-full flex flex-col items-center gap-4">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Aperçu</p>
                    <p className="text-sm text-zinc-500">{previewIndex + 1} / {properties.length}</p>
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => { const i = (previewIndex - 1 + properties.length) % properties.length; setPreviewIndex(i); setCurrentProp(properties[i]); setPhotoIndex(0); }}
                        className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                      >
                        Précédent
                      </button>
                      <button
                        onClick={() => { const i = (previewIndex + 1) % properties.length; setPreviewIndex(i); setCurrentProp(properties[i]); setPhotoIndex(0); }}
                        className="flex-1 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Timer */}
                    <TimerRing
                      sessionId={session.id}
                      timerState={session.timer_state}
                      onFinish={() => {}}
                      onSync={(ts) => setSession((s) => ({ ...s, timer_state: ts }))}
                    />

                    {/* Prompts */}
                    <div className="w-full space-y-2 mt-2">
                      {PROMPTS.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-zinc-500">
                          <span className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400 flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {p}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Waiting / Draw state */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            {noEligible ? (
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mb-2">Tous les biens ont été traités !</h2>
                <p className="text-sm text-zinc-500 mb-6">
                  {doneCount} bien{doneCount > 1 ? "s" : ""} présenté{doneCount > 1 ? "s" : ""}
                  {skippedCount > 0 && `, ${skippedCount} mis de côté`}
                </p>

                {presented.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-zinc-700 mb-3">Biens présentés :</p>
                    <div className="space-y-2">
                      {presented.map((sp) => (
                        <button
                          key={sp.id}
                          onClick={() => { setCurrentProp(sp); setPhotoIndex(0); }}
                          className="w-full flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors text-left"
                        >
                          {sp.shared_properties?.photo_url && (
                            <img src={sp.shared_properties.photo_url} alt="" className="w-10 h-8 rounded object-cover flex-shrink-0" />
                          )}
                          <span className="text-sm text-zinc-700 flex-1">
                            {sp.shared_properties?.city || "—"}
                            {sp.shared_properties?.living_area ? ` · ${sp.shared_properties.living_area} m²` : ""}
                            {sp.profiles ? ` · ${sp.profiles.first_name}` : ""}
                          </span>
                          <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {skipped.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-zinc-700 mb-3">Biens mis de côté :</p>
                    <div className="space-y-2">
                      {skipped.map((sp) => (
                        <div key={sp.id} className="flex items-center justify-between px-4 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                          <span className="text-sm text-zinc-700">
                            {sp.shared_properties?.city || "—"}
                            {sp.profiles ? ` · ${sp.profiles.first_name}` : ""}
                          </span>
                          <button
                            onClick={() => undoSkip(sp.id)}
                            className="text-xs font-medium text-amber-700 hover:text-amber-900"
                          >
                            Réintégrer
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={completeSession}
                  className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Terminer la séance
                </button>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-xl font-bold text-zinc-900 mb-2">
                  {doneCount === 0 ? "Prêt à commencer ?" : "Bien suivant"}
                </h2>
                <p className="text-sm text-zinc-500 mb-8">
                  {toPresent.length} bien{toPresent.length > 1 ? "s" : ""} restant{toPresent.length > 1 ? "s" : ""} à présenter
                </p>
                <button
                  onClick={drawNext}
                  disabled={drawing}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-zinc-900 text-white rounded-2xl text-base font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-lg"
                >
                  {drawing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                    </svg>
                  )}
                  {drawing ? "Tirage en cours…" : "Tirer le prochain bien"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      {currentProp && !previewMode && (
        <div className="border-t border-zinc-200 bg-white px-6 py-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              Qui a un acquéreur pour ce bien ?
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => decide("mis_de_cote")}
                disabled={deciding}
                className="px-5 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
              >
                Passer ce bien
              </button>
              <button
                onClick={() => decide("presente")}
                disabled={deciding}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors"
              >
                Bien présenté
              </button>
              <button
                onClick={drawNext}
                disabled={drawing || deciding || !!currentProp}
                className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                Tirer le prochain bien
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
