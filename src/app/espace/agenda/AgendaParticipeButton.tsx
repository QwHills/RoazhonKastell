"use client";

import { useState } from "react";

export default function AgendaParticipeButton({
  eventId,
  initialRegistered,
}: {
  eventId: string;
  initialRegistered: boolean;
}) {
  const [registered, setRegistered] = useState(initialRegistered);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    const res = await fetch("/api/events/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    if (res.ok) setRegistered(true);
    setLoading(false);
  }

  async function handleCancel() {
    setLoading(true);
    const res = await fetch("/api/events/register", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    if (res.ok) setRegistered(false);
    setLoading(false);
  }

  if (registered) {
    return (
      <div className="flex items-center gap-3 mt-3">
        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Inscrit
        </span>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-xs text-zinc-400 hover:text-red-500 underline underline-offset-2 transition-colors disabled:opacity-50"
        >
          {loading ? "…" : "Annuler"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleRegister}
      disabled={loading}
      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-full text-xs font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
    >
      {loading ? "Inscription…" : "Je participe"}
    </button>
  );
}
