"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MeetingStatus, TodoStatus, SubjectStatus } from "@/lib/supabase/types";
import Link from "next/link";

interface MeetingRow {
  id: string;
  title: string;
  meeting_date: string;
  summary: string | null;
  agenda: string | null;
  location: string | null;
  video_link: string | null;
  referent_id: string | null;
  starts_time: string | null;
  ends_time: string | null;
  status: MeetingStatus;
  raw_notes: string | null;
  created_by: string | null;
  profiles?: { first_name: string; last_name: string } | null;
}

interface SubjectRow {
  id: string;
  meeting_id: string | null;
  proposed_by: string | null;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  sort_order: number;
  status: string;
  notes: string | null;
  profiles?: { first_name: string; last_name: string } | null;
}

interface AttendeeRow {
  id: string;
  meeting_id: string;
  user_id: string;
  response: string;
  profiles?: { first_name: string; last_name: string } | null;
}

interface TodoRow {
  id: string;
  meeting_id: string | null;
  title: string;
  assigned_to: string | null;
  due_date: string | null;
  done: boolean;
  todo_status: TodoStatus;
  progress_note: string | null;
  profiles?: { first_name: string; last_name: string } | null;
}

interface ExecMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  planifie: "Planifié",
  en_cours: "En cours",
  termine: "Terminé",
  archive: "Archivé",
};

const STATUS_COLORS: Record<string, string> = {
  brouillon: "bg-zinc-100 text-zinc-600",
  planifie: "bg-emerald-100 text-emerald-700",
  en_cours: "bg-blue-100 text-blue-700",
  termine: "bg-zinc-100 text-zinc-500",
  archive: "bg-zinc-50 text-zinc-400",
};

const SUBJECT_STATUS_LABELS: Record<string, string> = {
  propose: "Proposé",
  a_traiter: "À traiter",
  en_cours: "En cours",
  traite: "Traité",
  reporte: "Reporté",
  mis_de_cote: "Mis de côté",
};

const TODO_STATUS_LABELS: Record<string, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  bloquee: "Bloquée",
  terminee: "Terminée",
};

const TODO_STATUS_COLORS: Record<string, string> = {
  a_faire: "bg-amber-100 text-amber-700",
  en_cours: "bg-blue-100 text-blue-700",
  bloquee: "bg-red-100 text-red-700",
  terminee: "bg-emerald-100 text-emerald-700",
};

export default function MeetingDetailClient({
  meeting: initMeeting,
  subjects: initSubjects,
  attendees: initAttendees,
  todos: initTodos,
  execMembers,
  userId,
}: {
  meeting: MeetingRow;
  subjects: SubjectRow[];
  attendees: AttendeeRow[];
  todos: TodoRow[];
  execMembers: ExecMember[];
  userId: string;
}) {
  const [meeting] = useState(initMeeting);
  const [subjects, setSubjects] = useState(initSubjects);
  const [attendees, setAttendees] = useState(initAttendees);
  const [todos, setTodos] = useState(initTodos);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tf, setTf] = useState({ title: "", assigned_to: "", due_date: "" });

  function getMemberName(id: string | null) {
    if (!id) return null;
    const m = execMembers.find((x) => x.id === id);
    return m ? `${m.first_name || ""} ${m.last_name || ""}`.trim() : null;
  }

  function flash(type: "success" | "error", text: string) {
    setMessage({ type, text });
    if (type === "success") setTimeout(() => setMessage(null), 4000);
  }

  const myAttendance = attendees.find((a) => a.user_id === userId);
  const presentCount = attendees.filter((a) => a.response === "present").length;
  const absentCount = attendees.filter((a) => a.response === "absent").length;
  const totalDuration = subjects.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  async function respondAttendance(response: string) {
    const res = await fetch("/api/reunions/attendees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meeting_id: meeting.id, response }),
    });
    if (res.ok) {
      const data = await res.json();
      setAttendees((prev) => {
        const idx = prev.findIndex((a) => a.user_id === userId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], response: data.response };
          return updated;
        }
        return [...prev, data];
      });
    }
  }

  async function updateSubjectStatus(id: string, status: SubjectStatus) {
    const res = await fetch("/api/reunions/subjects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    }
  }

  async function updateTodoStatus(id: string, newStatus: TodoStatus) {
    const supabase = createClient();
    const done = newStatus === "terminee";
    const { error } = await supabase
      .from("meeting_todos")
      .update({ todo_status: newStatus, done, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, todo_status: newStatus, done } : t)));
    }
  }

  async function saveTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!tf.title.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("meeting_todos")
      .insert({
        title: tf.title.trim(),
        assigned_to: tf.assigned_to || null,
        due_date: tf.due_date || null,
        meeting_id: meeting.id,
        todo_status: "a_faire",
      })
      .select("*, profiles!meeting_todos_assigned_to_fkey(first_name, last_name)")
      .single();
    if (!error && data) {
      setTodos((prev) => [...prev, data]);
      setShowTodoForm(false);
      setTf({ title: "", assigned_to: "", due_date: "" });
      flash("success", "Action ajoutée !");
    } else {
      flash("error", error?.message || "Erreur");
    }
    setSaving(false);
  }

  return (
    <div>
      {/* Back link */}
      <Link href="/espace/reunions" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Retour aux réunions
      </Link>

      {message && (
        <div className={`rounded-xl p-4 mb-6 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-zinc-900">{meeting.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium ${STATUS_COLORS[meeting.status] || STATUS_COLORS.brouillon}`}>
                {STATUS_LABELS[meeting.status] || meeting.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-500">
              <span>
                {new Date(meeting.meeting_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                {meeting.starts_time && ` · ${meeting.starts_time}`}
                {meeting.ends_time && ` – ${meeting.ends_time}`}
              </span>
              {meeting.location && <span>{meeting.location}</span>}
              {meeting.referent_id && <span>Référent : {getMemberName(meeting.referent_id)}</span>}
            </div>
          </div>
          {meeting.video_link && (
            <a href={meeting.video_link} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 flex-shrink-0">
              Rejoindre en visio
            </a>
          )}
        </div>

        {/* Attendance */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-100">
          <div className="flex -space-x-2">
            {attendees.filter((a) => a.response === "present").map((a) => (
              <span key={a.id} className="w-7 h-7 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-emerald-700"
                title={a.profiles ? `${a.profiles.first_name} ${a.profiles.last_name}` : ""}>
                {a.profiles ? `${a.profiles.first_name?.[0] || ""}${a.profiles.last_name?.[0] || ""}` : "?"}
              </span>
            ))}
          </div>
          <span className="text-xs text-zinc-400">
            {presentCount} présent{presentCount > 1 ? "s" : ""} · {absentCount} absent{absentCount > 1 ? "s" : ""}
          </span>
          <div className="flex gap-1.5 ml-auto">
            {(["present", "absent"] as const).map((resp) => (
              <button key={resp} onClick={() => respondAttendance(resp)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  myAttendance?.response === resp
                    ? resp === "present" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}>
                {resp === "present" ? "Présent" : "Absent"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ordre du jour (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-900">Ordre du jour</h2>
              {totalDuration > 0 && (
                <span className="text-xs text-zinc-400">{totalDuration} min estimées</span>
              )}
            </div>

            {subjects.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center">Aucun sujet à l&apos;ordre du jour.</p>
            ) : (
              <div className="space-y-3">
                {subjects.map((s, i) => (
                  <div key={s.id} className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
                    <span className="w-6 h-6 flex items-center justify-center bg-zinc-900 text-white rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-zinc-800">{s.title}</p>
                          {s.description && <p className="text-xs text-zinc-500 mt-0.5">{s.description}</p>}
                          {s.profiles && (
                            <p className="text-[11px] text-zinc-400 mt-1">Proposé par {s.profiles.first_name} {s.profiles.last_name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {s.duration_minutes && (
                            <span className="text-[11px] text-zinc-400">{s.duration_minutes} min</span>
                          )}
                          <select value={s.status}
                            onChange={(e) => updateSubjectStatus(s.id, e.target.value as SubjectStatus)}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 border-0 cursor-pointer">
                            {Object.entries(SUBJECT_STATUS_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compte rendu */}
          {meeting.summary && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <h2 className="font-semibold text-zinc-900 mb-3">Compte rendu</h2>
              <div className="prose prose-sm prose-zinc max-w-none text-sm text-zinc-600 whitespace-pre-wrap">
                {meeting.summary}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-4">
          {/* Présences */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <h3 className="font-semibold text-zinc-900 mb-3 text-sm">Présences</h3>
            <div className="space-y-1.5">
              {attendees.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-zinc-700">
                    {a.profiles ? `${a.profiles.first_name} ${a.profiles.last_name}` : "Membre"}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${
                    a.response === "present" ? "bg-emerald-500" : a.response === "absent" ? "bg-red-400" : "bg-zinc-300"
                  }`} title={a.response === "present" ? "Présent" : a.response === "absent" ? "Absent" : "En attente"} />
                </div>
              ))}
              {attendees.length === 0 && (
                <p className="text-xs text-zinc-400 py-2 text-center">Aucun membre invité.</p>
              )}
            </div>
          </div>

          {/* Actions de cette réunion */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-zinc-900 text-sm">Actions</h3>
              <button onClick={() => { setTf({ title: "", assigned_to: "", due_date: "" }); setShowTodoForm(true); }}
                className="text-xs text-zinc-500 hover:text-zinc-700">+ Ajouter</button>
            </div>

            {showTodoForm && (
              <form onSubmit={saveTodo} className="mb-3 space-y-2 bg-zinc-50 rounded-xl p-3">
                <input type="text" required value={tf.title}
                  onChange={(e) => setTf({ ...tf, title: e.target.value })}
                  placeholder="Titre de l'action"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                <select value={tf.assigned_to} onChange={(e) => setTf({ ...tf, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900">
                  <option value="">Responsable...</option>
                  {execMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                  ))}
                </select>
                <input type="date" value={tf.due_date} onChange={(e) => setTf({ ...tf, due_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                <div className="flex gap-2">
                  <button type="submit" disabled={saving}
                    className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                    {saving ? "…" : "Ajouter"}
                  </button>
                  <button type="button" onClick={() => setShowTodoForm(false)}
                    className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs">Annuler</button>
                </div>
              </form>
            )}

            {todos.length === 0 ? (
              <p className="text-xs text-zinc-400 py-2 text-center">Aucune action.</p>
            ) : (
              <div className="space-y-2">
                {todos.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-zinc-50 last:border-0">
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${t.done ? "text-zinc-400 line-through" : "text-zinc-700"}`}>{t.title}</p>
                      {t.profiles && <p className="text-[11px] text-zinc-400">{t.profiles.first_name} {t.profiles.last_name}</p>}
                    </div>
                    <select value={t.todo_status || "a_faire"}
                      onChange={(e) => updateTodoStatus(t.id, e.target.value as TodoStatus)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border-0 cursor-pointer flex-shrink-0 ${TODO_STATUS_COLORS[t.todo_status] || TODO_STATUS_COLORS.a_faire}`}>
                      {Object.entries(TODO_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
