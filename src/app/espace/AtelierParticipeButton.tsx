"use client";

import { useState } from "react";

export default function AtelierParticipeButton({
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
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[11px] font-semibold">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Inscrit
        </span>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-[11px] text-white/40 hover:text-red-300 underline underline-offset-2 transition-colors disabled:opacity-50"
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
      className="self-start inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white/90 rounded-full text-[11px] font-medium transition-colors disabled:opacity-50"
    >
      {loading ? "…" : "Je participe"}
    </button>
  );
}
