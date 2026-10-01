"use client";

import { useState } from "react";

type UserEntry = {
  name: string;
  email: string;
  connected: boolean;
  ficheComplete?: boolean;
};

export default function OnboardingStatsCard({
  adherents,
  partenaires,
}: {
  adherents: { connected: UserEntry[]; notConnected: UserEntry[] };
  partenaires: { connected: UserEntry[]; notConnected: UserEntry[]; ficheComplete: UserEntry[]; ficheIncomplete: UserEntry[] };
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalAdherents = adherents.connected.length + adherents.notConnected.length;
  const totalPartenaires = partenaires.connected.length + partenaires.notConnected.length;

  function toggle(section: string) {
    setExpanded(expanded === section ? null : section);
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Activation des comptes</p>
          <p className="text-xs text-zinc-400">Suivi des connexions et des fiches</p>
        </div>
      </div>

      {/* Adherents */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Adhérents</p>
        <div className="flex gap-3">
          <StatButton
            count={adherents.connected.length}
            total={totalAdherents}
            label="connectés"
            color="emerald"
            active={expanded === "adh-ok"}
            onClick={() => toggle("adh-ok")}
          />
          <StatButton
            count={adherents.notConnected.length}
            total={totalAdherents}
            label="pas encore connectés"
            color="amber"
            active={expanded === "adh-no"}
            onClick={() => toggle("adh-no")}
          />
        </div>
        {expanded === "adh-ok" && <UserList users={adherents.connected} />}
        {expanded === "adh-no" && <UserList users={adherents.notConnected} />}
      </div>

      {/* Partenaires */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Partenaires</p>
        <div className="flex gap-3 flex-wrap">
          <StatButton
            count={partenaires.connected.length}
            total={totalPartenaires}
            label="connectés"
            color="emerald"
            active={expanded === "part-ok"}
            onClick={() => toggle("part-ok")}
          />
          <StatButton
            count={partenaires.notConnected.length}
            total={totalPartenaires}
            label="pas encore connectés"
            color="amber"
            active={expanded === "part-no"}
            onClick={() => toggle("part-no")}
          />
          <StatButton
            count={partenaires.ficheComplete.length}
            total={totalPartenaires}
            label="fiche complète"
            color="blue"
            active={expanded === "part-fiche"}
            onClick={() => toggle("part-fiche")}
          />
        </div>
        {expanded === "part-ok" && <UserList users={partenaires.connected} />}
        {expanded === "part-no" && <UserList users={partenaires.notConnected} />}
        {expanded === "part-fiche" && <UserList users={partenaires.ficheComplete} />}
      </div>
    </div>
  );
}

function StatButton({
  count,
  total,
  label,
  color,
  active,
  onClick,
}: {
  count: number;
  total: number;
  label: string;
  color: "emerald" | "amber" | "blue";
  active: boolean;
  onClick: () => void;
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const activeColors = {
    emerald: "ring-2 ring-emerald-400",
    amber: "ring-2 ring-amber-400",
    blue: "ring-2 ring-blue-400",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${colors[color]} ${active ? activeColors[color] : "hover:shadow-sm"}`}
    >
      <span className="text-lg font-bold">{count}</span>
      <span className="text-left leading-tight">
        /{total} {label}
      </span>
    </button>
  );
}

function UserList({ users }: { users: UserEntry[] }) {
  if (users.length === 0) return <p className="text-xs text-zinc-400 mt-2 ml-1">Aucun</p>;
  return (
    <div className="mt-2 bg-zinc-50 rounded-xl p-3 max-h-48 overflow-y-auto">
      <div className="space-y-1">
        {users.map((u) => {
          const displayName = u.name.trim() || u.email.split("@")[0];
          return (
            <div key={u.email} className="flex items-center gap-2 text-xs py-1 border-b border-zinc-100 last:border-0">
              <span className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-500 flex-shrink-0">
                {displayName[0]?.toUpperCase()}
              </span>
              <span className="text-zinc-700 font-medium truncate">{displayName}</span>
              <span className="text-zinc-400 text-[11px] ml-auto flex-shrink-0">{u.email}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
