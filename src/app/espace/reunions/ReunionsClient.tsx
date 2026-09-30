"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MeetingStatus, TodoStatus } from "@/lib/supabase/types";
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

interface SubjectRow {
  id: string;
  meeting_id: string | null;
  proposed_by: string | null;
  title: string;
  description: string | null;
  duration_minutes?: number | null;
  sort_order?: number;
  status: string;
  profiles?: { first_name: string; last_name: string } | null;
}

interface AttendeeRow {
  id: string;
  meeting_id: string;
  user_id: string;
  response: string;
  profiles?: { first_name: string; last_name: string } | null;
}

interface ExecMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

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

export default function ReunionsClient({
  meetings: initMeetings,
  todos: initTodos,
  subjects: initSubjects,
  attendees: initAttendees,
  execMembers,
  userId,
}: {
  meetings: MeetingRow[];
  todos: TodoRow[];
  subjects: SubjectRow[];
  attendees: AttendeeRow[];
  execMembers: ExecMember[];
  userId: string;
}) {
  const [meetings, setMeetings] = useState(initMeetings);
  const [todos, setTodos] = useState(initTodos);
  const [subjects, setSubjects] = useState(initSubjects);
  const [attendees, setAttendees] = useState(initAttendees);
  const [tab, setTab] = useState<"reunions" | "actions">("reunions");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Meeting form state
  const [mf, setMf] = useState({
    id: "",
    title: "Réunion du bureau exécutif",
    meeting_date: new Date().toISOString().split("T")[0],
    starts_time: "09:30",
    ends_time: "11:30",
    location: "Roazhon Kastell, Rennes",
    video_link: "",
    referent_id: "",
    freeText: "",
    status: "planifie" as MeetingStatus,
  });

  // Subject form state
  const [sf, setSf] = useState({ title: "", description: "" });

  // AI agenda
  const [aiSubjects, setAiSubjects] = useState<{ title: string; description: string; duration_minutes: number }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [editableAgenda, setEditableAgenda] = useState<{ id?: string; title: string; description: string; duration_minutes: number }[]>([]);
  const [showAgendaPreview, setShowAgendaPreview] = useState(false);
  const [originalSubjectIds, setOriginalSubjectIds] = useState<Set<string>>(new Set());

  // Selected proposed subjects for AI
  const [selectedProposedIds, setSelectedProposedIds] = useState<Set<string>>(new Set());

  const today = new Date().toISOString().split("T")[0];

  const prochaine = useMemo(() => {
    return meetings
      .filter((m) => m.meeting_date >= today && m.status !== "archive" && m.status !== "termine")
      .sort((a, b) => a.meeting_date.localeCompare(b.meeting_date))[0] || null;
  }, [meetings, today]);

  const historique = useMemo(() => {
    return meetings.filter((m) => m.id !== prochaine?.id);
  }, [meetings, prochaine]);

  const openSubjects = useMemo(() => {
    return subjects.filter((s) => !s.meeting_id && s.status === "propose");
  }, [subjects]);

  const openTodos = useMemo(() => {
    return todos.filter((t) => !t.done && t.todo_status !== "terminee");
  }, [todos]);

  function getMemberName(id: string | null) {
    if (!id) return null;
    const m = execMembers.find((x) => x.id === id);
    return m ? `${m.first_name || ""} ${m.last_name || ""}`.trim() : null;
  }

  function flash(type: "success" | "error", text: string) {
    setMessage({ type, text });
    if (type === "success") setTimeout(() => setMessage(null), 4000);
  }

  // ---- Meeting CRUD ----

  async function saveMeeting(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: mf.title.trim(),
      meeting_date: mf.meeting_date,
      starts_time: mf.starts_time || null,
      ends_time: mf.ends_time || null,
      location: mf.location.trim() || null,
      video_link: mf.video_link.trim() || null,
      referent_id: mf.referent_id || null,
      status: mf.status,
    };

    let newMeeting: MeetingRow;

    if (mf.id) {
      const res = await fetch("/api/reunions/meetings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mf.id, ...payload }),
      });
      if (!res.ok) { flash("error", "Erreur lors de la modification."); setSaving(false); return; }
      newMeeting = await res.json();
      setMeetings((prev) => prev.map((m) => (m.id === mf.id ? newMeeting : m)));
      flash("success", "Réunion modifiée !");
    } else {
      const res = await fetch("/api/reunions/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { flash("error", "Erreur lors de la création."); setSaving(false); return; }
      newMeeting = await res.json();
      setMeetings((prev) => [newMeeting, ...prev]);
      flash("success", "Réunion créée !");
    }

    // Sync agenda subjects
    if (newMeeting.id) {
      const supabase = createClient();

      if (mf.id) {
        const currentIds = new Set(editableAgenda.filter((s) => s.id).map((s) => s.id!));
        for (const oldId of originalSubjectIds) {
          if (!currentIds.has(oldId)) {
            await supabase.from("meeting_subjects").delete().eq("id", oldId);
          }
        }
        for (let i = 0; i < editableAgenda.length; i++) {
          const s = editableAgenda[i];
          if (s.id && originalSubjectIds.has(s.id)) {
            await supabase.from("meeting_subjects").update({
              title: s.title,
              description: s.description || null,
              duration_minutes: s.duration_minutes || null,
              sort_order: i,
              updated_at: new Date().toISOString(),
            }).eq("id", s.id);
          } else {
            await supabase.from("meeting_subjects").insert({
              meeting_id: newMeeting.id,
              title: s.title,
              description: s.description || null,
              duration_minutes: s.duration_minutes || null,
              sort_order: i,
              status: "a_traiter",
              proposed_by: userId,
            });
          }
        }
        const { data: refreshed } = await supabase
          .from("meeting_subjects")
          .select("*, profiles!meeting_subjects_proposed_by_fkey(first_name, last_name)")
          .order("sort_order", { ascending: true });
        if (refreshed) setSubjects(refreshed);
      } else if (editableAgenda.length > 0) {
        for (let i = 0; i < editableAgenda.length; i++) {
          const s = editableAgenda[i];
          await supabase.from("meeting_subjects").insert({
            meeting_id: newMeeting.id,
            title: s.title,
            description: s.description || null,
            duration_minutes: s.duration_minutes || null,
            sort_order: i,
            status: "a_traiter",
            proposed_by: userId,
          });
        }
        for (const sid of selectedProposedIds) {
          await supabase.from("meeting_subjects").update({
            meeting_id: newMeeting.id,
            status: "a_traiter",
            updated_at: new Date().toISOString(),
          }).eq("id", sid);
        }
      }
    }

    // Add exec members as attendees
    if (!mf.id && newMeeting.id) {
      const supabase = createClient();
      for (const member of execMembers) {
        await supabase.from("meeting_attendees").upsert(
          { meeting_id: newMeeting.id, user_id: member.id, response: "en_attente" },
          { onConflict: "meeting_id,user_id" },
        );
      }
    }

    setShowForm(false);
    resetForm();
    setSaving(false);
  }

  function resetForm() {
    setMf({
      id: "",
      title: "Réunion du bureau exécutif",
      meeting_date: new Date().toISOString().split("T")[0],
      starts_time: "09:30",
      ends_time: "11:30",
      location: "Roazhon Kastell, Rennes",
      video_link: "",
      referent_id: "",
      freeText: "",
      status: "planifie",
    });
    setAiSubjects([]);
    setEditableAgenda([]);
    setShowAgendaPreview(false);
    setSelectedProposedIds(new Set());
    setOriginalSubjectIds(new Set());
  }

  function startEdit(m: MeetingRow) {
    const meetingSubjects = subjects
      .filter((s) => s.meeting_id === m.id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    setMf({
      id: m.id,
      title: m.title,
      meeting_date: m.meeting_date,
      starts_time: m.starts_time || "09:30",
      ends_time: m.ends_time || "11:30",
      location: m.location || "",
      video_link: m.video_link || "",
      referent_id: m.referent_id || "",
      freeText: "",
      status: m.status,
    });
    setEditableAgenda(
      meetingSubjects.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description || "",
        duration_minutes: s.duration_minutes || 15,
      })),
    );
    setOriginalSubjectIds(new Set(meetingSubjects.map((s) => s.id)));
    setShowAgendaPreview(true);
    setShowForm(true);
  }

  async function deleteMeeting(id: string) {
    const m = meetings.find((x) => x.id === id);
    if (!m || !confirm(`Supprimer la réunion « ${m.title} » ?\n\nCette action est irréversible.`)) return;
    const res = await fetch(`/api/reunions/meetings?id=${id}`, { method: "DELETE" });
    if (!res.ok) { flash("error", "Erreur lors de la suppression."); return; }
    setMeetings((prev) => prev.filter((x) => x.id !== id));
    setTodos((prev) => prev.filter((t) => t.meeting_id !== id));
    flash("success", "Réunion supprimée.");
  }

  // ---- AI Agenda ----

  async function generateAgenda() {
    setAiLoading(true);
    const selectedSubs = openSubjects.filter((s) => selectedProposedIds.has(s.id));
    const res = await fetch("/api/reunions/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        freeText: mf.freeText,
        selectedSubjects: selectedSubs.map((s) => ({ title: s.title, description: s.description })),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setAiSubjects(data.subjects || []);
      setEditableAgenda(data.subjects || []);
      setShowAgendaPreview(true);
    } else {
      flash("error", "Erreur lors de la génération de l'ordre du jour.");
    }
    setAiLoading(false);
  }

  // ---- Subject proposal ----

  async function proposeSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!sf.title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/reunions/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: sf.title.trim(), description: sf.description.trim() || null }),
    });
    if (res.ok) {
      const data = await res.json();
      setSubjects((prev) => [...prev, data]);
      setSf({ title: "", description: "" });
      setShowSubjectForm(false);
      flash("success", "Sujet proposé !");
    } else {
      flash("error", "Erreur lors de la proposition.");
    }
    setSaving(false);
  }

  // ---- Attendance ----

  async function respondAttendance(meetingId: string, response: string) {
    const res = await fetch("/api/reunions/attendees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meeting_id: meetingId, response }),
    });
    if (res.ok) {
      const data = await res.json();
      setAttendees((prev) => {
        const idx = prev.findIndex((a) => a.meeting_id === meetingId && a.user_id === userId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], response: data.response };
          return updated;
        }
        return [...prev, data];
      });
    }
  }

  // ---- Todos ----

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

  async function deleteTodo(id: string) {
    const t = todos.find((x) => x.id === id);
    if (!t || !confirm(`Supprimer « ${t.title} » ?`)) return;
    const supabase = createClient();
    await supabase.from("meeting_todos").delete().eq("id", id);
    setTodos((prev) => prev.filter((x) => x.id !== id));
  }

  // ---- Todo editing ----
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [ef, setEf] = useState({ title: "", assigned_to: "", due_date: "" });

  function startEditTodo(t: TodoRow) {
    setEditingTodoId(t.id);
    setEf({
      title: t.title,
      assigned_to: t.assigned_to || "",
      due_date: t.due_date || "",
    });
  }

  async function saveEditTodo(id: string) {
    if (!ef.title.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("meeting_todos")
      .update({
        title: ef.title.trim(),
        assigned_to: ef.assigned_to || null,
        due_date: ef.due_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, profiles!meeting_todos_assigned_to_fkey(first_name, last_name)")
      .single();
    if (!error && data) {
      setTodos((prev) => prev.map((t) => (t.id === id ? data : t)));
      setEditingTodoId(null);
      flash("success", "Action modifiée !");
    } else {
      flash("error", error?.message || "Erreur");
    }
  }

  // ---- Todo creation ----
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [tf, setTf] = useState({ title: "", assigned_to: "", due_date: "", meeting_id: "" });

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
        meeting_id: tf.meeting_id || null,
        todo_status: "a_faire",
      })
      .select("*, profiles!meeting_todos_assigned_to_fkey(first_name, last_name)")
      .single();
    if (!error && data) {
      setTodos((prev) => [data, ...prev]);
      setShowTodoForm(false);
      setTf({ title: "", assigned_to: "", due_date: "", meeting_id: "" });
      flash("success", "Action ajoutée !");
    } else {
      flash("error", error?.message || "Erreur");
    }
    setSaving(false);
  }

  // ---- Render ----

  const myAttendance = prochaine
    ? attendees.find((a) => a.meeting_id === prochaine.id && a.user_id === userId)
    : null;
  const prochaineAttendees = prochaine
    ? attendees.filter((a) => a.meeting_id === prochaine.id)
    : [];
  const presentCount = prochaineAttendees.filter((a) => a.response === "present").length;
  const absentCount = prochaineAttendees.filter((a) => a.response === "absent").length;
  const waitingCount = prochaineAttendees.filter((a) => a.response === "en_attente").length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Réunions du bureau</h1>
        <button
          onClick={() => {
            if (tab === "actions") {
              setShowTodoForm(true);
              setTf({ title: "", assigned_to: "", due_date: "", meeting_id: "" });
            } else {
              resetForm();
              setShowForm(true);
            }
            setMessage(null);
          }}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800"
        >
          {tab === "actions" ? "+ Nouvelle action" : "+ Nouvelle réunion"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("reunions")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === "reunions" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          Réunions
        </button>
        <button
          onClick={() => setTab("actions")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === "actions" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          Actions du bureau ({openTodos.length})
        </button>
      </div>

      {message && (
        <div className={`rounded-xl p-4 mb-6 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* ============ TAB RÉUNIONS ============ */}
      {tab === "reunions" && (
        <>
          {/* Meeting creation form */}
          {showForm && (
            <form onSubmit={saveMeeting} className="bg-white border-2 border-zinc-900 rounded-2xl p-5 mb-6 space-y-4">
              <h2 className="font-semibold text-zinc-900 text-lg">
                {mf.id ? "Modifier la réunion" : "Préparer une réunion"}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Titre</label>
                  <input type="text" required value={mf.title}
                    onChange={(e) => setMf({ ...mf, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Référent</label>
                  <select value={mf.referent_id} onChange={(e) => setMf({ ...mf, referent_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900">
                    <option value="">Choisir...</option>
                    {execMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Date</label>
                  <input type="date" required value={mf.meeting_date}
                    onChange={(e) => setMf({ ...mf, meeting_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Début</label>
                  <input type="time" value={mf.starts_time}
                    onChange={(e) => setMf({ ...mf, starts_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Fin</label>
                  <input type="time" value={mf.ends_time}
                    onChange={(e) => setMf({ ...mf, ends_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Lieu</label>
                  <input type="text" value={mf.location}
                    onChange={(e) => setMf({ ...mf, location: e.target.value })}
                    placeholder="Ex: Roazhon Kastell, Rennes"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Lien visio (optionnel)</label>
                  <input type="url" value={mf.video_link}
                    onChange={(e) => setMf({ ...mf, video_link: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
              </div>

              {/* Ordre du jour */}
              <div className="border-t border-zinc-100 pt-4 mt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-700">Ordre du jour</h3>
                  <button type="button"
                    onClick={() => { setEditableAgenda([...editableAgenda, { title: "", description: "", duration_minutes: 15 }]); setShowAgendaPreview(true); }}
                    className="text-xs text-zinc-500 hover:text-zinc-700">+ Ajouter un sujet</button>
                </div>

                {!showAgendaPreview && !mf.id && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1">De quoi souhaitez-vous parler ?</label>
                      <textarea value={mf.freeText}
                        onChange={(e) => setMf({ ...mf, freeText: e.target.value })}
                        rows={4}
                        placeholder="Écrivez vos idées en vrac, collez un texte existant..."
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none" />
                    </div>

                    {openSubjects.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-2">Sujets proposés par le bureau</p>
                        <div className="space-y-1.5">
                          {openSubjects.map((s) => (
                            <label key={s.id} className="flex items-start gap-2 cursor-pointer">
                              <input type="checkbox" className="mt-1 rounded"
                                checked={selectedProposedIds.has(s.id)}
                                onChange={(e) => {
                                  const next = new Set(selectedProposedIds);
                                  if (e.target.checked) next.add(s.id); else next.delete(s.id);
                                  setSelectedProposedIds(next);
                                }} />
                              <div>
                                <span className="text-sm font-medium text-zinc-700">{s.title}</span>
                                {s.description && <p className="text-xs text-zinc-400">{s.description}</p>}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={generateAgenda} disabled={aiLoading || (!mf.freeText.trim() && selectedProposedIds.size === 0)}
                        className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-200 disabled:opacity-40 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        {aiLoading ? "Structuration…" : "Structurer l'ordre du jour"}
                      </button>
                    </div>
                  </>
                )}

                {showAgendaPreview && editableAgenda.length > 0 && (
                  <div className="space-y-2">
                    {editableAgenda.map((item, i) => (
                      <div key={item.id || `new-${i}`} className="flex items-start gap-3 bg-zinc-50 rounded-xl p-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-zinc-900 text-white rounded-full text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                        <div className="flex-1 space-y-1.5">
                          <input type="text" value={item.title}
                            onChange={(e) => { const a = [...editableAgenda]; a[i] = { ...a[i], title: e.target.value }; setEditableAgenda(a); }}
                            placeholder="Titre du sujet"
                            className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                          <input type="text" value={item.description}
                            onChange={(e) => { const a = [...editableAgenda]; a[i] = { ...a[i], description: e.target.value }; setEditableAgenda(a); }}
                            placeholder="Description courte"
                            className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <input type="number" value={item.duration_minutes} min={5} max={120} step={5}
                            onChange={(e) => { const a = [...editableAgenda]; a[i] = { ...a[i], duration_minutes: parseInt(e.target.value) || 15 }; setEditableAgenda(a); }}
                            className="w-14 px-2 py-1.5 rounded-lg border border-zinc-200 text-xs text-center focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                          <span className="text-xs text-zinc-400">min</span>
                        </div>
                        <button type="button" onClick={() => setEditableAgenda(editableAgenda.filter((_, j) => j !== i))}
                          className="text-zinc-300 hover:text-red-500 mt-1 flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {showAgendaPreview && editableAgenda.length === 0 && (
                  <p className="text-xs text-zinc-400 text-center py-3">Aucun sujet à l&apos;ordre du jour.</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50">
                  {saving ? "Envoi…" : mf.id ? "Enregistrer" : "Créer la réunion"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-5 py-2.5 border border-zinc-200 rounded-xl text-sm hover:bg-zinc-50">Annuler</button>
              </div>
            </form>
          )}

          {/* Prochaine réunion */}
          {prochaine && (
            <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Prochaine réunion</p>
              <h3 className="text-lg font-bold text-zinc-900 mb-3">{prochaine.title}</h3>

              <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-zinc-600 mb-4">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  {new Date(prochaine.meeting_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  {prochaine.starts_time && ` · ${prochaine.starts_time}`}
                  {prochaine.ends_time && ` – ${prochaine.ends_time}`}
                </span>
                {prochaine.location && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                    </svg>
                    {prochaine.location}
                  </span>
                )}
                {prochaine.referent_id && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                    </svg>
                    Référent : {getMemberName(prochaine.referent_id)}
                  </span>
                )}
              </div>

              {/* Attendance */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-xs text-zinc-500">
                  {presentCount} présent{presentCount > 1 ? "s" : ""} · {absentCount} absent{absentCount > 1 ? "s" : ""} · {waitingCount} en attente
                </span>
                <div className="flex gap-1.5 ml-auto">
                  {(["present", "absent"] as const).map((resp) => (
                    <button key={resp} onClick={() => respondAttendance(prochaine.id, resp)}
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

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Link href={`/espace/reunions/${prochaine.id}`}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800">
                  Voir l&apos;ordre du jour
                </Link>
                <button onClick={() => { setSf({ title: "", description: "" }); setShowSubjectForm(true); }}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                  + Proposer un sujet
                </button>
                <button onClick={() => startEdit(prochaine)}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                  Modifier
                </button>
                {prochaine.video_link && (
                  <a href={prochaine.video_link} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                    Rejoindre en visio
                  </a>
                )}
              </div>
            </div>
          )}

          {!prochaine && !showForm && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 text-center mb-6">
              <p className="text-zinc-400 mb-2">Aucune prochaine réunion programmée.</p>
              <button onClick={() => { resetForm(); setShowForm(true); }}
                className="text-sm text-zinc-900 font-semibold hover:underline">
                Programmer une réunion
              </button>
            </div>
          )}

          {/* Sujets proposés + Actions en 2 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Sujets proposés */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Sujets proposés
                </h3>
                <button onClick={() => { setSf({ title: "", description: "" }); setShowSubjectForm(true); }}
                  className="text-xs text-zinc-500 hover:text-zinc-700">+ Proposer</button>
              </div>

              {/* Subject proposal form */}
              {showSubjectForm && (
                <form onSubmit={proposeSubject} className="mb-3 space-y-2 bg-zinc-50 rounded-xl p-3">
                  <input type="text" required value={sf.title}
                    onChange={(e) => setSf({ ...sf, title: e.target.value })}
                    placeholder="Titre du sujet"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                  <input type="text" value={sf.description}
                    onChange={(e) => setSf({ ...sf, description: e.target.value })}
                    placeholder="Explication courte (optionnel)"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900" />
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving}
                      className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                      {saving ? "…" : "Proposer"}
                    </button>
                    <button type="button" onClick={() => setShowSubjectForm(false)}
                      className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs">Annuler</button>
                  </div>
                </form>
              )}

              {openSubjects.length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center">Aucun sujet proposé.</p>
              ) : (
                <div className="space-y-2">
                  {openSubjects.map((s) => (
                    <div key={s.id} className="flex items-start justify-between gap-2 py-2 border-b border-zinc-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-zinc-700">{s.title}</p>
                        {s.description && <p className="text-xs text-zinc-400 mt-0.5">{s.description}</p>}
                        {s.profiles && <p className="text-[11px] text-zinc-300 mt-0.5">{s.profiles.first_name} {s.profiles.last_name}</p>}
                      </div>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-medium flex-shrink-0">À examiner</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions à suivre */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Actions à suivre
                </h3>
                <button onClick={() => setTab("actions")} className="text-xs text-zinc-500 hover:text-zinc-700">Voir tout</button>
              </div>
              {openTodos.length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center">Aucune action en cours.</p>
              ) : (
                <div className="space-y-2">
                  {openTodos.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2 py-2 border-b border-zinc-50 last:border-0 cursor-pointer hover:bg-zinc-50 -mx-2 px-2 rounded-lg"
                      onClick={() => { setTab("actions"); startEditTodo(t); }}>
                      <div className="min-w-0">
                        <p className="text-sm text-zinc-700 truncate">{t.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.profiles && <span className="text-[11px] text-zinc-400">{t.profiles.first_name} {t.profiles.last_name}</span>}
                          {t.due_date && (
                            <span className={`text-[11px] ${new Date(t.due_date) < new Date() ? "text-red-500 font-medium" : "text-zinc-400"}`}>
                              {new Date(t.due_date).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium flex-shrink-0 ${TODO_STATUS_COLORS[t.todo_status] || TODO_STATUS_COLORS.a_faire}`}>
                        {TODO_STATUS_LABELS[t.todo_status] || "À faire"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Historique */}
          {historique.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <h3 className="font-semibold text-zinc-900 flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Historique
              </h3>
              <div className="divide-y divide-zinc-50">
                {historique.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-700 truncate">{m.title}</p>
                      <p className="text-xs text-zinc-400">
                        {new Date(m.meeting_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/espace/reunions/${m.id}`}
                        className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-50">
                        {m.summary ? "Voir le compte rendu" : "Voir"}
                      </Link>
                      <button onClick={() => startEdit(m)} className="text-xs text-zinc-400 hover:text-zinc-700">Modifier</button>
                      <button onClick={() => deleteMeeting(m.id)} className="text-xs text-red-400 hover:text-red-600">Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ============ TAB ACTIONS ============ */}
      {tab === "actions" && (
        <>
          {/* Todo creation form */}
          {showTodoForm && (
            <form onSubmit={saveTodo} className="bg-white border-2 border-zinc-900 rounded-2xl p-5 mb-6 space-y-4">
              <h2 className="font-semibold text-zinc-900">Nouvelle action</h2>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Action</label>
                <input type="text" required value={tf.title}
                  onChange={(e) => setTf({ ...tf, title: e.target.value })}
                  placeholder="Ex: Relancer les partenaires"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Responsable</label>
                  <select value={tf.assigned_to} onChange={(e) => setTf({ ...tf, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900">
                    <option value="">À définir</option>
                    {execMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Échéance</label>
                  <input type="date" value={tf.due_date} onChange={(e) => setTf({ ...tf, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Réunion liée</label>
                  <select value={tf.meeting_id} onChange={(e) => setTf({ ...tf, meeting_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900">
                    <option value="">Aucune</option>
                    {meetings.map((m) => (
                      <option key={m.id} value={m.id}>{m.title} ({new Date(m.meeting_date).toLocaleDateString("fr-FR")})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50">
                  {saving ? "Envoi…" : "Ajouter"}
                </button>
                <button type="button" onClick={() => setShowTodoForm(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-sm hover:bg-zinc-50">Annuler</button>
              </div>
            </form>
          )}

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4">
            {["Toutes", "Mes actions", "En retard"].map((label) => (
              <button key={label} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-200">
                {label}
              </button>
            ))}
          </div>

          {/* Actions list */}
          <div className="space-y-2">
            {openTodos.length === 0 ? (
              <p className="text-center text-zinc-400 py-12">Aucune action en cours.</p>
            ) : (
              openTodos.map((t) => {
                const meeting = t.meeting_id ? meetings.find((m) => m.id === t.meeting_id) : null;
                const isEditing = editingTodoId === t.id;

                if (isEditing) {
                  return (
                    <div key={t.id} className="bg-white border-2 border-zinc-900 rounded-2xl p-4 space-y-3">
                      <input type="text" value={ef.title}
                        onChange={(e) => setEf({ ...ef, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        autoFocus />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">Responsable</label>
                          <select value={ef.assigned_to} onChange={(e) => setEf({ ...ef, assigned_to: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900">
                            <option value="">À définir</option>
                            {execMembers.map((m) => (
                              <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">Échéance</label>
                          <input type="date" value={ef.due_date} onChange={(e) => setEf({ ...ef, due_date: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEditTodo(t.id)}
                          className="px-4 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800">
                          Enregistrer
                        </button>
                        <button onClick={() => setEditingTodoId(null)}
                          className="px-4 py-1.5 border border-zinc-200 rounded-xl text-xs hover:bg-zinc-50">
                          Annuler
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={t.id} className="bg-white border border-zinc-200 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => startEditTodo(t)}>
                        <p className="text-sm font-medium text-zinc-900">{t.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {t.profiles && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[11px]">
                              {t.profiles.first_name} {t.profiles.last_name}
                            </span>
                          )}
                          {!t.profiles && <span className="px-2 py-0.5 bg-zinc-50 text-zinc-400 rounded-lg text-[11px]">Responsable à définir</span>}
                          {t.due_date && (
                            <span className={`text-[11px] ${new Date(t.due_date) < new Date() ? "text-red-500 font-medium" : "text-zinc-400"}`}>
                              Échéance : {new Date(t.due_date).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                          {!t.due_date && <span className="text-[11px] text-zinc-300">Échéance à définir</span>}
                          {meeting && (
                            <span className="text-[11px] text-zinc-400">
                              Réunion du {new Date(meeting.meeting_date).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select value={t.todo_status || "a_faire"}
                          onChange={(e) => updateTodoStatus(t.id, e.target.value as TodoStatus)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium border-0 cursor-pointer ${TODO_STATUS_COLORS[t.todo_status] || TODO_STATUS_COLORS.a_faire}`}>
                          {Object.entries(TODO_STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <button onClick={() => startEditTodo(t)} className="text-zinc-300 hover:text-zinc-600" title="Modifier">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button onClick={() => deleteTodo(t.id)} className="text-zinc-300 hover:text-red-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Completed actions */}
            {todos.filter((t) => t.done || t.todo_status === "terminee").length > 0 && (
              <div className="pt-4">
                <p className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">
                  Terminées ({todos.filter((t) => t.done || t.todo_status === "terminee").length})
                </p>
                {todos.filter((t) => t.done || t.todo_status === "terminee").map((t) => (
                  <div key={t.id} className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center gap-3 mb-1">
                    <span className="text-sm text-zinc-400 line-through flex-1">{t.title}</span>
                    {t.profiles && <span className="text-[11px] text-zinc-300">{t.profiles.first_name} {t.profiles.last_name}</span>}
                    <button onClick={() => deleteTodo(t.id)} className="text-zinc-300 hover:text-red-500 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
