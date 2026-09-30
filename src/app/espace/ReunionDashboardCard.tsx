"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  meeting: {
    id: string;
    title: string;
    meeting_date: string;
    starts_time: string | null;
    ends_time: string | null;
    location: string | null;
  };
  subjectCount: number;
  totalMinutes: number;
  initialResponse: string | null;
  presentCount: number;
  absentCount: number;
  waitingCount: number;
}

export default function ReunionDashboardCard({
  meeting,
  subjectCount,
  totalMinutes,
  initialResponse,
  presentCount: initPresent,
  absentCount: initAbsent,
  waitingCount: initWaiting,
}: Props) {
  const [response, setResponse] = useState(initialResponse);
  const [counts, setCounts] = useState({
    present: initPresent,
    absent: initAbsent,
    waiting: initWaiting,
  });

  async function respond(newResponse: string) {
    const prev = response;
    setResponse(newResponse);

    setCounts((c) => {
      const next = { ...c };
      if (prev === "present") next.present--;
      else if (prev === "absent") next.absent--;
      else next.waiting--;
      if (newResponse === "present") next.present++;
      else if (newResponse === "absent") next.absent++;
      return next;
    });

    const res = await fetch("/api/reunions/attendees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meeting_id: meeting.id, response: newResponse }),
    });
    if (!res.ok) {
      setResponse(prev);
      setCounts({ present: initPresent, absent: initAbsent, waiting: initWaiting });
    }
  }

  const dateStr = new Date(meeting.meeting_date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 mb-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
            Prochaine réunion
          </p>
          <h3 className="text-lg font-bold text-zinc-900">{meeting.title}</h3>
        </div>
        {subjectCount > 0 && (
          <span className="text-xs text-zinc-400 flex-shrink-0 mt-1">
            {subjectCount} sujet{subjectCount > 1 ? "s" : ""} · {totalMinutes} min
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-500 mb-4">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          {dateStr}
          {meeting.starts_time && ` · ${meeting.starts_time}`}
          {meeting.ends_time && ` – ${meeting.ends_time}`}
        </span>
        {meeting.location && (
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
            </svg>
            {meeting.location}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-xs text-zinc-400">
          {counts.present} présent{counts.present > 1 ? "s" : ""} · {counts.absent} absent{counts.absent > 1 ? "s" : ""} · {counts.waiting} en attente
        </span>
        <div className="flex gap-1.5 ml-auto">
          {(["present", "absent"] as const).map((r) => (
            <button
              key={r}
              onClick={() => respond(r)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
      </div>

      <Link
        href={`/espace/reunions/${meeting.id}`}
        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800"
      >
        Voir l&apos;ordre du jour
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>
    </div>
  );
}
