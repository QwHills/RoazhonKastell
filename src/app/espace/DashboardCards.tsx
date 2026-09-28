"use client";

import { useState } from "react";
import Link from "next/link";
import type { WeeklyActionData, MeetSuggestionData, PartnerDiscoveryData, PartnerFicheAction } from "@/lib/dashboard-cards";

// ============================================================
// 1. Action de la semaine
// ============================================================

export function ActionWeekCard({ data }: { data: WeeklyActionData }) {
  const [status, setStatus] = useState(data.tracking?.status || "a_faire");
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleStatus(newStatus: string) {
    setLoading(true);
    const res = await fetch("/api/dashboard/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId: data.action.id, status: newStatus }),
    });
    if (res.ok) setStatus(newStatus);
    setLoading(false);
  }

  const eventDate = new Date(data.action.event_date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });

  if (status === "realisee") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Action r&eacute;alis&eacute;e</span>
        </div>
        <h3 className="font-bold text-emerald-900 text-lg mb-1">{data.action.title}</h3>
        <p className="text-sm text-emerald-700 mb-6">Bravo ! Action r&eacute;alis&eacute;e apr&egrave;s l&apos;atelier du {eventDate}.</p>
        <div className="mt-auto flex items-center justify-between">
          <Link
            href="/espace/actions"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-900 underline underline-offset-2 transition-colors"
          >
            Voir mon historique
          </Link>
          <button
            onClick={() => handleStatus("a_faire")}
            disabled={loading}
            className="text-xs text-emerald-600 hover:text-emerald-800 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  if (status === "declinee") {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center">
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Report&eacute;e</span>
        </div>
        <h3 className="font-semibold text-zinc-500 mb-1">{data.action.title}</h3>
        <p className="text-sm text-zinc-400 mb-4">Pas de souci, la prochaine sera la bonne !</p>
        <button
          onClick={() => handleStatus("a_faire")}
          disabled={loading}
          className="mt-auto text-sm font-medium text-zinc-500 hover:text-zinc-700 underline underline-offset-2 transition-colors self-start disabled:opacity-50"
        >
          Remettre &agrave; faire
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700">L&apos;action de la semaine</span>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          &Agrave; faire
        </span>
      </div>

      <h3 className="font-bold text-zinc-900 text-xl mb-1">{data.action.title}</h3>
      <p className="text-sm text-zinc-400 mb-3">
        Apr&egrave;s l&apos;atelier &laquo;&nbsp;{data.action.event_title}&nbsp;&raquo;
      </p>

      {!showDetail && (
        <p className="text-sm text-zinc-600 leading-relaxed line-clamp-2 mb-4">
          {data.action.instruction}
        </p>
      )}

      {showDetail && (
        <div className="mb-4">
          <p className="text-sm text-zinc-600 whitespace-pre-line leading-relaxed">{data.action.instruction}</p>
          {data.action.resource_url && (
            <a
              href={data.action.resource_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-emerald-700 hover:underline"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              {data.action.resource_title || "Voir la ressource"}
            </a>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{data.action.duration_minutes} minutes &middot; &Agrave; votre rythme</span>
      </div>

      <div className="mt-auto flex gap-3">
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
        >
          {showDetail ? "Fermer" : "Voir l’action"}
        </button>
        <button
          onClick={() => handleStatus("realisee")}
          disabled={loading}
          className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors disabled:opacity-50"
        >
          C&apos;est fait &#10003;
        </button>
      </div>

      <button
        onClick={() => handleStatus("declinee")}
        disabled={loading}
        className="mt-3 text-xs text-zinc-400 hover:text-zinc-600 transition-colors self-center disabled:opacity-50"
      >
        Pas cette semaine
      </button>
    </div>
  );
}

// ============================================================
// 2. Conseiller à rencontrer
// ============================================================

export function MeetCounselorCard({
  data,
  eventId,
}: {
  data: MeetSuggestionData;
  eventId: string;
}) {
  const [phase, setPhase] = useState<"ask" | "challenge" | "done" | "declined">(
    data.suggestion.status === "acceptee" ? "challenge" :
    data.suggestion.status === "echangee" ? "done" :
    data.suggestion.status === "declinee" ? "declined" :
    "ask",
  );
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);

  const { suggestedUser } = data.suggestion;
  const initials = `${(suggestedUser.first_name || "")[0] || ""}${(suggestedUser.last_name || "")[0] || ""}`.toUpperCase();

  async function callApi(action: string) {
    setLoading(true);
    await fetch("/api/dashboard/meet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestionId: data.suggestion.id, action, eventId }),
    });
    setLoading(false);
  }

  async function handleKnown() {
    await callApi("known");
    setHidden(true);
  }

  async function handleNotYet() {
    await callApi("accepted");
    setPhase("challenge");
  }

  async function handleExchanged() {
    await callApi("exchanged");
    setPhase("done");
  }

  async function handleDeclined() {
    await callApi("declined");
    setPhase("declined");
  }

  async function handleAnother() {
    await callApi("another");
    setHidden(true);
  }

  if (hidden) return null;

  const eventDate = new Date(data.suggestion.eventDate).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (phase === "done") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-700">&Eacute;change not&eacute;</span>
        </div>
        <h3 className="font-bold text-emerald-900 text-lg mb-1">Bravo !</h3>
        <p className="text-sm text-emerald-700">
          &Eacute;change not&eacute; avec {suggestedUser.first_name}. Le r&eacute;seau grandit une rencontre &agrave; la fois.
        </p>
      </div>
    );
  }

  if (phase === "declined") {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center">
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Report&eacute;</span>
        </div>
        <p className="text-sm text-zinc-500 mb-3">Pas de souci, &agrave; la prochaine !</p>
        <button
          onClick={handleAnother}
          disabled={loading}
          className="mt-auto text-sm font-medium text-zinc-500 hover:text-zinc-700 underline underline-offset-2 transition-colors self-start disabled:opacity-50"
        >
          Sugg&eacute;rer quelqu&apos;un d&apos;autre
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-blue-700">Un conseiller &agrave; rencontrer</span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {suggestedUser.photo_url ? (
          <img src={suggestedUser.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-bold text-zinc-500">
            {initials}
          </div>
        )}
        <div>
          <p className="font-bold text-zinc-900">{suggestedUser.first_name} {suggestedUser.last_name}</p>
          {suggestedUser.city && <p className="text-xs text-zinc-400">{suggestedUser.city}</p>}
        </div>
      </div>

      <p className="text-xs text-blue-600 font-medium mb-4 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        Inscrit au prochain mardi &middot; {eventDate}
      </p>

      {phase === "ask" && (
        <>
          <p className="text-sm text-zinc-700 font-medium mb-5">
            Tu connais {suggestedUser.first_name} ?
          </p>
          <div className="mt-auto flex gap-3">
            <button
              onClick={handleKnown}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              Oui, on se conna&icirc;t
            </button>
            <button
              onClick={handleNotYet}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Pas encore
            </button>
          </div>
        </>
      )}

      {phase === "challenge" && (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-blue-900 mb-1">Ton petit d&eacute;fi de mardi &#128075;</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              Va te pr&eacute;senter &agrave; {suggestedUser.first_name} et prenez deux minutes pour &eacute;changer sur vos secteurs et vos recherches acqu&eacute;reurs du moment.
            </p>
          </div>
          <div className="mt-auto flex gap-3">
            <Link
              href={`/espace/profil?view=${suggestedUser.id}`}
              className="px-4 py-3 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors text-center"
            >
              Voir son profil
            </Link>
            <button
              onClick={handleExchanged}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              On a &eacute;chang&eacute; &#10003;
            </button>
          </div>
          <div className="mt-3 flex justify-center gap-4">
            <button
              onClick={handleDeclined}
              disabled={loading}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50"
            >
              Pas cette semaine
            </button>
            <button
              onClick={handleAnother}
              disabled={loading}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50"
            >
              Quelqu&apos;un d&apos;autre
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// 3. Partenaire à découvrir
// ============================================================

export function PartnerDiscoverCard({ data }: { data: PartnerDiscoveryData }) {
  const [phase, setPhase] = useState<"ask" | "detail" | "done">(
    data.discovery.response === "vue" ? "done" : "ask",
  );
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);

  const { partner } = data.discovery;

  async function callApi(action: string) {
    setLoading(true);
    await fetch("/api/dashboard/partner-discovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discoveryId: data.discovery.id, action }),
    });
    setLoading(false);
  }

  async function handleKnown() {
    await callApi("known");
    setHidden(true);
  }

  async function handleNotYet() {
    await callApi("seen");
    setPhase("detail");
  }

  async function handleAnother() {
    await callApi("another");
    setHidden(true);
  }

  if (hidden) return null;

  const displayName = partner.contactName || partner.name;
  const firstSituation = partner.contact_situations?.[0];

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-700">&Agrave; d&eacute;couvrir dans le r&eacute;seau</span>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
          Partenaire
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {partner.logo_url ? (
          <img src={partner.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-400">
            {(partner.name || "?")[0]}
          </div>
        )}
        <div>
          <p className="font-bold text-zinc-900">{displayName}</p>
          <p className="text-xs text-zinc-400">
            {partner.name}{partner.sector ? ` · ${partner.sector}` : partner.category ? ` · ${partner.category}` : ""}
          </p>
        </div>
      </div>

      {phase === "ask" && (
        <>
          <p className="text-sm text-zinc-700 font-medium mb-5">
            Connais-tu l&apos;activit&eacute; {partner.contactName ? `de ${partner.contactName}` : `de ${partner.name}`} ?
          </p>
          <div className="mt-auto flex gap-3">
            <button
              onClick={handleKnown}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              Oui
            </button>
            <button
              onClick={handleNotYet}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Pas encore
            </button>
          </div>
        </>
      )}

      {phase === "detail" && (
        <>
          <h4 className="text-base font-bold text-zinc-900 mb-2">D&eacute;couvrez son activit&eacute; &#128075;</h4>
          {partner.description && (
            <p className="text-sm text-zinc-600 leading-relaxed mb-4 line-clamp-3">{partner.description}</p>
          )}

          {firstSituation && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5">
              <p className="text-sm font-semibold text-emerald-900 mb-1">Dans quel cas penser &agrave; {partner.contactName ? partner.contactName.split(" ")[0] : "eux"} ?</p>
              <p className="text-sm text-emerald-800 leading-relaxed">{firstSituation.description}</p>
            </div>
          )}

          <div className="mt-auto flex gap-3">
            {partner.slug && (
              <Link
                href={`/partenaires/${partner.slug}`}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors text-center inline-flex items-center justify-center gap-1.5"
              >
                D&eacute;couvrir sa fiche
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </Link>
            )}
            <button
              onClick={handleAnother}
              disabled={loading}
              className="px-4 py-3 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              Une autre fois
            </button>
          </div>
          <button
            onClick={handleAnother}
            disabled={loading}
            className="mt-3 text-xs text-zinc-400 hover:text-zinc-600 transition-colors self-center disabled:opacity-50"
          >
            D&eacute;couvrir un autre partenaire
          </button>
        </>
      )}

      {phase === "done" && (
        <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl mt-auto">
          <span className="text-sm text-zinc-500">Fiche consult&eacute;e</span>
          <button
            onClick={handleAnother}
            disabled={loading}
            className="ml-auto text-xs text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50"
          >
            D&eacute;couvrir un autre partenaire
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 4. Action partenaire (fiche)
// ============================================================

export function PartnerFicheCard({ data }: { data: PartnerFicheAction }) {
  return (
    <div className={`border rounded-2xl p-6 ${
      data.type === "complete" ? "bg-emerald-50 border-emerald-200" :
      data.type === "unpublished" ? "bg-amber-50 border-amber-200" :
      "bg-white border-zinc-200"
    }`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          data.type === "complete" ? "bg-emerald-100" :
          data.type === "unpublished" ? "bg-amber-100" :
          "bg-blue-100"
        }`}>
          {data.type === "complete" ? (
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          )}
        </div>
        <div>
          <h3 className={`font-bold text-base ${
            data.type === "complete" ? "text-emerald-900" :
            data.type === "unpublished" ? "text-amber-900" :
            "text-zinc-900"
          }`}>
            {data.title}
          </h3>
          <p className={`text-sm mt-1 leading-relaxed ${
            data.type === "complete" ? "text-emerald-700" :
            data.type === "unpublished" ? "text-amber-700" :
            "text-zinc-500"
          }`}>
            {data.text}
          </p>
        </div>
      </div>
      <Link
        href={data.buttonHref}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          data.type === "complete"
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-zinc-900 text-white hover:bg-zinc-800"
        }`}
      >
        {data.buttonLabel}
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>
    </div>
  );
}
