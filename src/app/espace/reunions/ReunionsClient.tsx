"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  summary: string | null;
  created_by: string | null;
  created_at: string;
  profiles?: { first_name: string; last_name: string } | null;
}

interface Todo {
  id: string;
  meeting_id: string | null;
  title: string;
  assigned_to: string | null;
  due_date: string | null;
  done: boolean;
  profiles?: { first_name: string; last_name: string } | null;
}

interface ExecMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export default function ReunionsClient({
  meetings: initialMeetings,
  todos: initialTodos,
  execMembers,
  userId,
}: {
  meetings: Meeting[];
  todos: Todo[];
  execMembers: ExecMember[];
  userId: string;
}) {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [todos, setTodos] = useState(initialTodos);
  const [tab, setTab] = useState<"reunions" | "todos">("reunions");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Meeting form
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [meetingForm, setMeetingForm] = useState({ title: "", meeting_date: "", summary: "" });
  const [saving, setSaving] = useState(false);

  // Todo form
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [todoForm, setTodoForm] = useState({ title: "", assigned_to: "", due_date: "", meeting_id: "" });

  async function saveMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingForm.title.trim() || !meetingForm.meeting_date) return;
    setSaving(true);
    setMessage(null);
    const supabase = createClient();

    if (editingMeetingId) {
      const { error } = await supabase
        .from("meetings")
        .update({
          title: meetingForm.title.trim(),
          meeting_date: meetingForm.meeting_date,
          summary: meetingForm.summary.trim() || null,
        })
        .eq("id", editingMeetingId);

      if (error) { setMessage({ type: "error", text: error.message }); setSaving(false); return; }

      setMeetings((prev) =>
        prev.map((m) =>
          m.id === editingMeetingId
            ? { ...m, title: meetingForm.title.trim(), meeting_date: meetingForm.meeting_date, summary: meetingForm.summary.trim() || null }
            : m
        )
      );
      setMessage({ type: "success", text: "Réunion modifiée !" });
    } else {
      const { data, error } = await supabase
        .from("meetings")
        .insert({
          title: meetingForm.title.trim(),
          meeting_date: meetingForm.meeting_date,
          summary: meetingForm.summary.trim() || null,
          created_by: userId,
        })
        .select()
        .single();

      if (error) { setMessage({ type: "error", text: error.message }); setSaving(false); return; }
      setMeetings((prev) => [data, ...prev]);
      setMessage({ type: "success", text: "Réunion ajoutée !" });
    }

    setShowMeetingForm(false);
    setEditingMeetingId(null);
    setMeetingForm({ title: "", meeting_date: "", summary: "" });
    setSaving(false);
  }

  function startEditMeeting(m: Meeting) {
    setEditingMeetingId(m.id);
    setMeetingForm({ title: m.title, meeting_date: m.meeting_date, summary: m.summary || "" });
    setShowMeetingForm(true);
  }

  async function deleteMeeting(id: string) {
    const m = meetings.find((x) => x.id === id);
    if (!m || !confirm(`Supprimer la réunion "${m.title}" et ses tâches ?\n\nCette action est irréversible.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    setMeetings((prev) => prev.filter((x) => x.id !== id));
    setTodos((prev) => prev.filter((t) => t.meeting_id !== id));
    setMessage({ type: "success", text: "Réunion supprimée." });
  }

  async function saveTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!todoForm.title.trim()) return;
    setSaving(true);
    setMessage(null);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("meeting_todos")
      .insert({
        title: todoForm.title.trim(),
        assigned_to: todoForm.assigned_to || null,
        due_date: todoForm.due_date || null,
        meeting_id: todoForm.meeting_id || null,
      })
      .select("*, profiles!meeting_todos_assigned_to_fkey(first_name, last_name)")
      .single();

    if (error) { setMessage({ type: "error", text: error.message }); setSaving(false); return; }

    setTodos((prev) => [data, ...prev]);
    setShowTodoForm(false);
    setTodoForm({ title: "", assigned_to: "", due_date: "", meeting_id: "" });
    setMessage({ type: "success", text: "Tâche ajoutée !" });
    setSaving(false);
  }

  async function toggleTodo(id: string, done: boolean) {
    const supabase = createClient();
    const { error } = await supabase.from("meeting_todos").update({ done }).eq("id", id);
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
  }

  async function deleteTodo(id: string) {
    const t = todos.find((x) => x.id === id);
    if (!t || !confirm(`Supprimer la tâche "${t.title}" ?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("meeting_todos").delete().eq("id", id);
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    setTodos((prev) => prev.filter((x) => x.id !== id));
  }

  const pendingTodos = todos.filter((t) => !t.done);
  const doneTodos = todos.filter((t) => t.done);

  function getMemberName(id: string | null) {
    if (!id) return null;
    const m = execMembers.find((x) => x.id === id);
    return m ? `${m.first_name || ""} ${m.last_name || ""}`.trim() : null;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Réunions du bureau</h1>
        <button
          onClick={() => {
            if (tab === "reunions") {
              setShowMeetingForm(true);
              setEditingMeetingId(null);
              setMeetingForm({ title: "", meeting_date: new Date().toISOString().split("T")[0], summary: "" });
            } else {
              setShowTodoForm(true);
              setTodoForm({ title: "", assigned_to: "", due_date: "", meeting_id: "" });
            }
            setMessage(null);
          }}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800"
        >
          {tab === "reunions" ? "+ Nouvelle réunion" : "+ Nouvelle tâche"}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("reunions")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === "reunions" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          Comptes rendus ({meetings.length})
        </button>
        <button
          onClick={() => setTab("todos")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === "todos" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          To-do ({pendingTodos.length})
        </button>
      </div>

      {message && (
        <div className={`rounded-xl p-4 mb-6 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Meeting form */}
      {tab === "reunions" && showMeetingForm && (
        <form onSubmit={saveMeeting} className="bg-white border-2 border-zinc-900 rounded-2xl p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">{editingMeetingId ? "Modifier la réunion" : "Nouvelle réunion"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Titre</label>
              <input
                type="text"
                required
                value={meetingForm.title}
                onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                placeholder="Ex: Réunion bureau septembre"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Date</label>
              <input
                type="date"
                required
                value={meetingForm.meeting_date}
                onChange={(e) => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Compte rendu</label>
            <textarea
              value={meetingForm.summary}
              onChange={(e) => setMeetingForm({ ...meetingForm, summary: e.target.value })}
              rows={6}
              placeholder="Points abordés, décisions prises..."
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50">
              {saving ? "Envoi…" : editingMeetingId ? "Enregistrer" : "Ajouter"}
            </button>
            <button type="button" onClick={() => { setShowMeetingForm(false); setEditingMeetingId(null); }} className="px-4 py-2 border border-zinc-200 rounded-xl text-sm hover:bg-zinc-50">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Todo form */}
      {tab === "todos" && showTodoForm && (
        <form onSubmit={saveTodo} className="bg-white border-2 border-zinc-900 rounded-2xl p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Nouvelle tâche</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-500 mb-1">Tâche</label>
              <input
                type="text"
                required
                value={todoForm.title}
                onChange={(e) => setTodoForm({ ...todoForm, title: e.target.value })}
                placeholder="Ex: Préparer le budget prévisionnel"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Attribuer à</label>
              <select
                value={todoForm.assigned_to}
                onChange={(e) => setTodoForm({ ...todoForm, assigned_to: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">Non attribué</option>
                {execMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Échéance</label>
              <input
                type="date"
                value={todoForm.due_date}
                onChange={(e) => setTodoForm({ ...todoForm, due_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Liée à la réunion</label>
              <select
                value={todoForm.meeting_id}
                onChange={(e) => setTodoForm({ ...todoForm, meeting_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">Aucune</option>
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({new Date(m.meeting_date).toLocaleDateString("fr-FR")})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50">
              {saving ? "Envoi…" : "Ajouter"}
            </button>
            <button type="button" onClick={() => setShowTodoForm(false)} className="px-4 py-2 border border-zinc-200 rounded-xl text-sm hover:bg-zinc-50">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Meetings list */}
      {tab === "reunions" && (
        <div className="space-y-3">
          {meetings.length === 0 ? (
            <p className="text-center text-zinc-400 py-12">Aucune réunion enregistrée.</p>
          ) : (
            meetings.map((m) => {
              const meetingTodos = todos.filter((t) => t.meeting_id === m.id);
              return (
                <div key={m.id} className="bg-white border border-zinc-200 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-bold text-zinc-900">
                          {new Date(m.meeting_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-zinc-800">{m.title}</h3>
                      {m.profiles && (
                        <p className="text-xs text-zinc-400 mt-1">
                          Par {m.profiles.first_name} {m.profiles.last_name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEditMeeting(m)}
                        className="text-xs text-zinc-400 hover:text-zinc-700"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => deleteMeeting(m.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                  {m.summary && (
                    <div className="mt-3 pt-3 border-t border-zinc-100">
                      <p className="text-sm text-zinc-600 whitespace-pre-wrap">{m.summary}</p>
                    </div>
                  )}
                  {meetingTodos.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-100">
                      <p className="text-xs font-medium text-zinc-500 mb-2">Tâches liées</p>
                      <div className="space-y-1">
                        {meetingTodos.map((t) => (
                          <div key={t.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={t.done}
                              onChange={(e) => toggleTodo(t.id, e.target.checked)}
                              className="rounded"
                            />
                            <span className={t.done ? "line-through text-zinc-400" : "text-zinc-700"}>{t.title}</span>
                            {t.profiles && (
                              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-lg text-xs">
                                {t.profiles.first_name} {t.profiles.last_name}
                              </span>
                            )}
                            {t.due_date && (
                              <span className={`text-xs ${new Date(t.due_date) < new Date() && !t.done ? "text-red-500 font-medium" : "text-zinc-400"}`}>
                                {new Date(t.due_date).toLocaleDateString("fr-FR")}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Todos list */}
      {tab === "todos" && (
        <div className="space-y-2">
          {pendingTodos.length === 0 && doneTodos.length === 0 ? (
            <p className="text-center text-zinc-400 py-12">Aucune tâche pour le moment.</p>
          ) : (
            <>
              {pendingTodos.map((t) => (
                <div key={t.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggleTodo(t.id, true)}
                    className="rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-zinc-900">{t.title}</span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {t.profiles && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-xs">
                          {t.profiles.first_name} {t.profiles.last_name}
                        </span>
                      )}
                      {t.due_date && (
                        <span className={`text-xs ${new Date(t.due_date) < new Date() ? "text-red-500 font-medium" : "text-zinc-400"}`}>
                          Échéance : {new Date(t.due_date).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      {t.meeting_id && (
                        <span className="text-xs text-zinc-400">
                          {(() => { const m = meetings.find((x) => x.id === t.meeting_id); return m ? `Réunion du ${new Date(m.meeting_date).toLocaleDateString("fr-FR")}` : ""; })()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTodo(t.id)}
                    className="text-xs text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    Supprimer
                  </button>
                </div>
              ))}

              {doneTodos.length > 0 && (
                <div className="pt-4">
                  <p className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Terminées ({doneTodos.length})</p>
                  {doneTodos.map((t) => (
                    <div key={t.id} className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center gap-3 mb-1">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => toggleTodo(t.id, false)}
                        className="rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-zinc-400 line-through">{t.title}</span>
                        {t.profiles && (
                          <span className="ml-2 text-xs text-zinc-300">
                            {t.profiles.first_name} {t.profiles.last_name}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTodo(t.id)}
                        className="text-xs text-red-300 hover:text-red-500 flex-shrink-0"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
