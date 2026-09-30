"use client";

import { useState } from "react";

type ActionData = {
  id: string;
  actionId: string;
  actionTitle: string;
  instruction: string;
  duration: number;
  status: string;
  eventTitle: string;
  eventDate: string;
};

export default function ActionCard({ action }: { action: ActionData }) {
  const [status, setStatus] = useState(action.status);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    const res = await fetch("/api/dashboard/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId: action.actionId, status: newStatus }),
    });
    if (res.ok) setStatus(newStatus);
    setLoading(false);
  }

  const borderColor =
    status === "realisee" ? "border-emerald-200" :
    status === "declinee" ? "border-zinc-100" :
    "border-zinc-200";

  const badgeClass =
    status === "realisee" ? "bg-emerald-100 text-emerald-700" :
    status === "declinee" ? "bg-zinc-100 text-zinc-400" :
    "bg-amber-100 text-amber-700";

  const badgeText =
    status === "realisee" ? "Fait" :
    status === "declinee" ? "Déclinée" :
    "À faire";

  return (
    <div className={`bg-white border rounded-2xl p-5 ${borderColor} transition-colors`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-zinc-900">{action.actionTitle}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Après « {action.eventTitle} » · {new Date(action.eventDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
              {badgeText}
            </span>
            <svg className={`w-4 h-4 text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-zinc-100">
          <p className="text-sm text-zinc-600">{action.instruction}</p>
          <p className="text-xs text-zinc-400 mt-2">{action.duration} minutes</p>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {status !== "realisee" && (
              <button
                onClick={() => updateStatus("realisee")}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-full text-xs font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {loading ? "…" : "C'est fait !"}
              </button>
            )}
            {status === "realisee" && (
              <button
                onClick={() => updateStatus("a_faire")}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold hover:bg-amber-200 transition-colors disabled:opacity-50"
              >
                {loading ? "…" : "Remettre à faire"}
              </button>
            )}
            {status !== "declinee" && (
              <button
                onClick={() => updateStatus("declinee")}
                disabled={loading}
                className="text-xs text-zinc-400 hover:text-red-500 underline underline-offset-2 transition-colors disabled:opacity-50"
              >
                {loading ? "…" : "Je ne peux pas"}
              </button>
            )}
            {status === "declinee" && (
              <button
                onClick={() => updateStatus("a_faire")}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 text-zinc-600 rounded-full text-xs font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {loading ? "…" : "Reprendre"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
