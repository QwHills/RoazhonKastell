"use client";

import { useState } from "react";

export default function AgendaReunionButton({
  meetingId,
  initialResponse,
}: {
  meetingId: string;
  initialResponse: string | null;
}) {
  const [response, setResponse] = useState(initialResponse);
  const [loading, setLoading] = useState(false);

  async function respond(newResponse: string) {
    setLoading(true);
    const prev = response;
    setResponse(newResponse);
    const res = await fetch("/api/reunions/attendees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meeting_id: meetingId, response: newResponse }),
    });
    if (!res.ok) setResponse(prev);
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      {(["present", "absent"] as const).map((r) => (
        <button
          key={r}
          onClick={() => respond(r)}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
            response === r
              ? r === "present"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          {r === "present" ? "Présent" : "Absent"}
        </button>
      ))}
    </div>
  );
}
