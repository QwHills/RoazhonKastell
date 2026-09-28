"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ParticipeButton({
  eventId,
  initialRegistered,
  showBiens = true,
}: {
  eventId: string;
  initialRegistered: boolean;
  showBiens?: boolean;
}) {
  const [registered, setRegistered] = useState(initialRegistered);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleParticipe() {
    setLoading(true);

    if (!registered) {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) setRegistered(true);
    }

    if (showBiens) {
      router.push("/espace/biens");
    } else {
      setLoading(false);
    }
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
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleParticipe}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-full text-sm font-semibold hover:bg-emerald-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {showBiens ? "Inscrit · Préparer mes biens" : "Inscrit"}
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-xs text-white/60 hover:text-white/90 underline underline-offset-2 transition-colors disabled:opacity-50"
        >
          {loading ? "…" : "Annuler"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleParticipe}
      disabled={loading}
      className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-zinc-900 rounded-full text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:opacity-50"
    >
      {loading ? (
        "Inscription…"
      ) : (
        <>
          Je participe
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </>
      )}
    </button>
  );
}
