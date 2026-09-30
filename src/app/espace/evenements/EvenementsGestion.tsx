"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EventStatus, EventVisibility } from "@/lib/supabase/types";

interface AtelierActionItem {
  id: string;
  title: string;
  instruction: string;
  duration_minutes: number;
  resource_url: string | null;
  resource_title: string | null;
  status: string;
  validated_at: string | null;
}

interface AiSuggestionItem {
  title: string;
  instruction: string;
  duration_minutes: number;
}

const EMPTY_ACTION_FORM = {
  title: "",
  instruction: "",
  duration_minutes: "15",
  resource_url: "",
  resource_title: "",
};

interface Participant {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  propertyCount: number;
}

interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  address: string | null;
  starts_at: string;
  ends_at: string | null;
  category: string | null;
  visibility: EventVisibility;
  status: EventStatus;
  max_attendees: number | null;
  registration_deadline: string | null;
  external_link: string | null;
  registration_count: number;
  participants?: Participant[];
  activeAction?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  publie: "Publié",
  annule: "Annulé",
  archive: "Archivé",
};

const STATUS_COLORS: Record<string, string> = {
  brouillon: "bg-zinc-100 text-zinc-500",
  publie: "bg-emerald-100 text-emerald-700",
  annule: "bg-red-100 text-red-700",
  archive: "bg-zinc-100 text-zinc-400",
};

const VISIBILITY_LABELS: Record<string, string> = {
  public: "Public",
  adherents: "Adhérents",
  partenaires: "Partenaires",
  tous_membres: "Tous membres",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function toParisDateParts(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  return { date, time };
}

type TabType = "mardis" | "evenements";

const MARDI_DEFAULTS = {
  title: "",
  description: "",
  location: "Roazhon Kastell, Rennes",
  address: "",
  starts_at: "",
  starts_time: "11:00",
  ends_time: "12:30",
  category: "mardi-coworking",
  visibility: "public" as EventVisibility,
  max_attendees: "",
  external_link: "",
};

const EVENT_DEFAULTS = {
  title: "",
  description: "",
  location: "Roazhon Kastell",
  address: "",
  starts_at: "",
  starts_time: "19:00",
  ends_time: "21:00",
  category: "evenement",
  visibility: "public" as EventVisibility,
  max_attendees: "",
  external_link: "",
};

export default function EvenementsGestion({
  events: initialEvents,
}: {
  events: EventItem[];
}) {
  const [events, setEvents] = useState(initialEvents);
  const [activeTab, setActiveTab] = useState<TabType>("mardis");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(MARDI_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [actionForm, setActionForm] = useState(EMPTY_ACTION_FORM);
  const [actionEditId, setActionEditId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestionItem[]>([]);
  const [existingActions, setExistingActions] = useState<AtelierActionItem[]>([]);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function loadActions(eventId: string) {
    const res = await fetch(`/api/ateliers/action?eventId=${eventId}`);
    if (res.ok) {
      const data = await res.json();
      setExistingActions(data);
      const validated = data.find((a: AtelierActionItem) => a.status === "valide");
      if (validated) {
        setActionForm({
          title: validated.title,
          instruction: validated.instruction,
          duration_minutes: String(validated.duration_minutes),
          resource_url: validated.resource_url || "",
          resource_title: validated.resource_title || "",
        });
        setActionEditId(validated.id);
      } else {
        setActionForm(EMPTY_ACTION_FORM);
        setActionEditId(null);
      }
    }
  }

  async function generateSuggestions() {
    if (!form.title && !form.description) return;
    setGeneratingAi(true);
    setAiError(null);
    setAiSuggestions([]);
    const res = await fetch("/api/ateliers/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, description: form.description }),
    });
    if (res.ok) {
      const data = await res.json();
      setAiSuggestions(data.suggestions || []);
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.error === "SERVICE_NOT_CONFIGURED") {
        setAiError("La génération IA n’est pas configurée. Saisissez l’action manuellement.");
      } else {
        const detail = err.details ? ` (${err.details.substring(0, 100)})` : "";
        setAiError(`Erreur lors de la génération${detail}. Réessayez ou saisissez manuellement.`);
      }
    }
    setGeneratingAi(false);
  }

  function selectSuggestion(s: AiSuggestionItem) {
    setActionForm({
      title: s.title,
      instruction: s.instruction,
      duration_minutes: String(s.duration_minutes),
      resource_url: "",
      resource_title: "",
    });
    setActionEditId(null);
    setAiSuggestions([]);
  }

  async function saveAction(validate: boolean) {
    if (!editingId || !actionForm.title || !actionForm.instruction) return;
    setSavingAction(true);

    const body = {
      eventId: editingId,
      title: actionForm.title,
      instruction: actionForm.instruction,
      duration_minutes: parseInt(actionForm.duration_minutes) || 15,
      resource_url: actionForm.resource_url || null,
      resource_title: actionForm.resource_title || null,
      validate,
      ...(actionEditId ? { id: actionEditId } : {}),
    };

    const method = actionEditId ? "PUT" : "POST";
    const res = await fetch("/api/ateliers/action", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const saved = await res.json();
      setActionEditId(saved.id);
      setMessage({ type: "success", text: validate ? "Action validée et activée." : "Action enregistrée en brouillon." });
      await loadActions(editingId);
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage({ type: "error", text: err.error || "Erreur lors de l’enregistrement." });
    }
    setSavingAction(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm(activeTab === "mardis" ? MARDI_DEFAULTS : EVENT_DEFAULTS);
    setShowForm(true);
    setMessage(null);
    setExistingActions([]);
    setAiSuggestions([]);
    setActionForm(EMPTY_ACTION_FORM);
    setActionEditId(null);
    setAiError(null);
  }

  function openEdit(event: EventItem) {
    const startParts = toParisDateParts(event.starts_at);
    const endParts = event.ends_at ? toParisDateParts(event.ends_at) : null;
    const startDate = startParts.date;
    const startTime = startParts.time;
    const endTime = endParts?.time || "21:00";

    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description || "",
      location: event.location || "Roazhon Kastell",
      address: event.address || "",
      starts_at: startDate,
      starts_time: startTime,
      ends_time: endTime,
      category: event.category || "mardi-coworking",
      visibility: event.visibility,
      max_attendees: event.max_attendees?.toString() || "",
      external_link: event.external_link || "",
    });
    setShowForm(true);
    setMessage(null);
    setAiSuggestions([]);
    setAiError(null);
    if (event.category === "mardi-coworking") {
      loadActions(event.id);
    } else {
      setExistingActions([]);
      setActionForm(EMPTY_ACTION_FORM);
      setActionEditId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    function parisToISO(date: string, time: string): string {
      const asUTC = new Date(`${date}T${time}:00Z`);
      const p = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Paris",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
      }).formatToParts(asUTC);
      const g = (t: string) => p.find(x => x.type === t)!.value;
      const parisAsUTC = new Date(`${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}:${g("second")}Z`);
      const offsetMs = parisAsUTC.getTime() - asUTC.getTime();
      return new Date(asUTC.getTime() - offsetMs).toISOString();
    }
    const startsAt = parisToISO(form.starts_at, form.starts_time);
    const endsAt = parisToISO(form.starts_at, form.ends_time);

    const payload = {
      title: form.title,
      slug: slugify(form.title) + "-" + form.starts_at.replace(/-/g, ""),
      description: form.description || null,
      location: form.location || null,
      address: form.address || null,
      starts_at: startsAt,
      ends_at: endsAt,
      category: form.category || null,
      visibility: form.visibility,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      external_link: form.external_link || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        setMessage({ type: "error", text: error.message });
        setSaving(false);
        return;
      }

      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingId
            ? { ...ev, ...payload, registration_count: ev.registration_count }
            : ev,
        ),
      );
    } else {
      const { data, error } = await supabase
        .from("events")
        .insert({ ...payload, status: "brouillon" as EventStatus })
        .select()
        .single();

      if (error) {
        setMessage({ type: "error", text: error.message });
        setSaving(false);
        return;
      }

      setEvents((prev) => [{ ...data, registration_count: 0 }, ...prev]);
    }

    setShowForm(false);
    setMessage({ type: "success", text: editingId ? "Événement modifié." : "Événement créé." });
    setSaving(false);
  }

  async function updateStatus(id: string, status: EventStatus) {
    const supabase = createClient();
    const { error } = await supabase.from("events").update({ status }).eq("id", id);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, status } : ev)));
  }

  const isMardi = (e: EventItem) => e.category === "mardi-coworking";
  const tabEvents = events.filter((e) =>
    activeTab === "mardis" ? isMardi(e) : !isMardi(e),
  );

  const now = new Date();
  const upcoming = tabEvents
    .filter((e) => e.status !== "archive" && new Date(e.starts_at) >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const past = tabEvents
    .filter((e) => e.status === "archive" || new Date(e.starts_at) < now)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

  const mardiCount = events.filter((e) => isMardi(e)).length;
  const eventCount = events.filter((e) => !isMardi(e)).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Gestion des événements</h1>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800"
        >
          + {activeTab === "mardis" ? "Nouvel atelier" : "Nouvel événement"}
        </button>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1 mb-8">
        <button
          onClick={() => { setActiveTab("mardis"); setShowForm(false); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "mardis"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          Les ateliers du mardi
          <span className="text-xs text-zinc-400">({mardiCount})</span>
        </button>
        <button
          onClick={() => { setActiveTab("evenements"); setShowForm(false); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "evenements"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Les événements du Château
          <span className="text-xs text-zinc-400">({eventCount})</span>
        </button>
      </div>

      {message && (
        <div className={`rounded-xl p-4 mb-6 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <>
        <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl p-6 mb-8 space-y-4">
          <h2 className="font-semibold text-zinc-900">
            {editingId ? "Modifier l'événement" : "Nouvel événement"}
          </h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Titre</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex : Mardi Co-working"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Début</label>
              <input
                type="time"
                value={form.starts_time}
                onChange={(e) => setForm({ ...form, starts_time: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Fin</label>
              <input
                type="time"
                value={form.ends_time}
                onChange={(e) => setForm({ ...form, ends_time: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Programme ou détails de l'événement…"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Lieu</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Visibilité</label>
              <select
                value={form.visibility}
                onChange={(e) => setForm({ ...form, visibility: e.target.value as EventVisibility })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
              >
                <option value="public">Public</option>
                <option value="adherents">Adhérents uniquement</option>
                <option value="partenaires">Partenaires uniquement</option>
                <option value="tous_membres">Tous les membres</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Places max (optionnel)</label>
              <input
                type="number"
                value={form.max_attendees}
                onChange={(e) => setForm({ ...form, max_attendees: e.target.value })}
                placeholder="Illimité"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Lien externe (optionnel)</label>
              <input
                type="url"
                value={form.external_link}
                onChange={(e) => setForm({ ...form, external_link: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Créer l'événement"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-zinc-200 rounded-xl text-sm hover:bg-zinc-50"
            >
              Annuler
            </button>
          </div>
        </form>

        {/* Section action atelier — visible pour les mardis en mode édition */}
        {form.category === "mardi-coworking" && editingId && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Action après l&apos;atelier
              </h2>
              {existingActions.some((a) => a.status === "valide") && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  Action active
                </span>
              )}
            </div>

            <p className="text-sm text-zinc-500">
              Définissez une action concrète que les participants pourront réaliser dans la semaine après l&apos;atelier.
            </p>

            {/* Bouton génération IA */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={generateSuggestions}
                disabled={generatingAi || (!form.title && !form.description)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl text-sm font-medium hover:bg-violet-100 transition-colors disabled:opacity-50"
              >
                {generatingAi ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Génération en cours…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM19.5 10.5V12m0 0v1.5m0-1.5h1.5m-1.5 0H18" />
                    </svg>
                    Générer 3 suggestions (IA)
                  </>
                )}
              </button>
              {(!form.title && !form.description) && (
                <span className="text-xs text-zinc-400">Remplissez le titre ou la description pour activer</span>
              )}
            </div>

            {aiError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">{aiError}</div>
            )}

            {/* Suggestions IA */}
            {aiSuggestions.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Suggestions de l&apos;IA — cliquez pour sélectionner</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {aiSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      className="text-left p-4 border border-zinc-200 rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-colors"
                    >
                      <h4 className="font-medium text-sm text-zinc-900 mb-1">{s.title}</h4>
                      <p className="text-xs text-zinc-500 line-clamp-3 mb-2">{s.instruction}</p>
                      <span className="text-[11px] text-zinc-400">{s.duration_minutes} min</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Formulaire action */}
            <div className="space-y-3 pt-2 border-t border-zinc-100">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Titre de l&apos;action</label>
                <input
                  type="text"
                  value={actionForm.title}
                  onChange={(e) => setActionForm({ ...actionForm, title: e.target.value })}
                  placeholder="Ex : Appeler 3 anciens clients"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Consigne détaillée</label>
                <textarea
                  value={actionForm.instruction}
                  onChange={(e) => setActionForm({ ...actionForm, instruction: e.target.value })}
                  rows={3}
                  placeholder="Décrivez ce que le conseiller doit faire concrètement…"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Durée (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={actionForm.duration_minutes}
                    onChange={(e) => setActionForm({ ...actionForm, duration_minutes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Lien ressource (optionnel)</label>
                  <input
                    type="url"
                    value={actionForm.resource_url}
                    onChange={(e) => setActionForm({ ...actionForm, resource_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Titre du lien</label>
                  <input
                    type="text"
                    value={actionForm.resource_title}
                    onChange={(e) => setActionForm({ ...actionForm, resource_title: e.target.value })}
                    placeholder="Document, vidéo…"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => saveAction(false)}
                  disabled={savingAction || !actionForm.title || !actionForm.instruction}
                  className="px-4 py-2 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
                >
                  {savingAction ? "…" : "Enregistrer en brouillon"}
                </button>
                <button
                  type="button"
                  onClick={() => saveAction(true)}
                  disabled={savingAction || !actionForm.title || !actionForm.instruction}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingAction ? "…" : "Valider et activer"}
                </button>
              </div>
            </div>

            {/* Actions existantes */}
            {existingActions.length > 0 && (
              <div className="pt-4 border-t border-zinc-100">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Historique des actions</p>
                <div className="space-y-2">
                  {existingActions.map((a) => (
                    <div key={a.id} className={`flex items-center justify-between p-3 rounded-xl ${a.status === "valide" ? "bg-emerald-50 border border-emerald-200" : "bg-zinc-50"}`}>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{a.title}</p>
                        <p className="text-xs text-zinc-400">{a.duration_minutes} min · {a.status === "valide" ? "Active" : a.status === "brouillon" ? "Brouillon" : "Archivée"}</p>
                      </div>
                      <div className="flex gap-2">
                        {a.status !== "valide" && (
                          <button
                            type="button"
                            onClick={() => {
                              setActionForm({
                                title: a.title,
                                instruction: a.instruction,
                                duration_minutes: String(a.duration_minutes),
                                resource_url: a.resource_url || "",
                                resource_title: a.resource_title || "",
                              });
                              setActionEditId(a.id);
                            }}
                            className="text-xs text-zinc-500 hover:text-zinc-900"
                          >
                            Reprendre
                          </button>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          a.status === "valide" ? "bg-emerald-100 text-emerald-700" :
                          a.status === "brouillon" ? "bg-zinc-200 text-zinc-600" :
                          "bg-zinc-100 text-zinc-400"
                        }`}>
                          {a.status === "valide" ? "Active" : a.status === "brouillon" ? "Brouillon" : "Archivée"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </>
      )}

      {upcoming.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">À venir</h2>
          <div className="space-y-3">
            {upcoming.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => openEdit(event)}
                onStatusChange={updateStatus}
              />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-zinc-400 mb-4">Passés / Archivés</h2>
          <div className="space-y-3 opacity-60">
            {past.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => openEdit(event)}
                onStatusChange={updateStatus}
              />
            ))}
          </div>
        </div>
      )}

      {tabEvents.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="text-zinc-400 mb-4">
            {activeTab === "mardis"
              ? "Aucun atelier du mardi pour le moment."
              : "Aucun événement du château pour le moment."}
          </p>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800"
          >
            {activeTab === "mardis" ? "Créer un atelier" : "Créer un événement"}
          </button>
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  onEdit,
  onStatusChange,
}: {
  event: EventItem;
  onEdit: () => void;
  onStatusChange: (id: string, status: EventStatus) => void;
}) {
  const [showParticipants, setShowParticipants] = useState(false);
  const participants = event.participants || [];
  const totalProperties = participants.reduce((sum, p) => sum + p.propertyCount, 0);

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-zinc-900">{event.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[event.status] || ""}`}>
              {STATUS_LABELS[event.status] || event.status}
            </span>
            <span className="text-xs text-zinc-400">
              {VISIBILITY_LABELS[event.visibility]}
            </span>
          </div>
          <p className="text-sm text-zinc-500">
            {formatDate(event.starts_at)} &middot; {formatTime(event.starts_at)}
            {event.ends_at && ` — ${formatTime(event.ends_at)}`}
            {event.location && <> &middot; {event.location}</>}
          </p>
          {event.registration_count > 0 && (
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="text-xs text-zinc-500 mt-1 hover:text-zinc-900 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              {event.registration_count} participant{event.registration_count > 1 ? "s" : ""}
              {event.max_attendees && ` / ${event.max_attendees} places`}
              {totalProperties > 0 && ` · ${totalProperties} bien${totalProperties > 1 ? "s" : ""} à présenter`}
              <svg className={`w-3 h-3 transition-transform ${showParticipants ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs hover:bg-zinc-50"
          >
            Modifier
          </button>
          {event.status === "brouillon" && (
            <button
              onClick={() => onStatusChange(event.id, "publie")}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
            >
              Publier
            </button>
          )}
          {event.status === "publie" && (
            <button
              onClick={() => onStatusChange(event.id, "annule")}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
            >
              Annuler
            </button>
          )}
          {(event.status === "publie" || event.status === "annule") && (
            <button
              onClick={() => onStatusChange(event.id, "archive")}
              className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs hover:bg-zinc-50"
            >
              Archiver
            </button>
          )}
        </div>
      </div>

      {event.category === "mardi-coworking" && event.activeAction && (
        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-zinc-500">
            Action : <span className="font-medium text-zinc-700">{event.activeAction}</span>
          </span>
        </div>
      )}

      {showParticipants && participants.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Participants inscrits</h4>
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.userId} className="flex items-center justify-between py-2 px-3 bg-zinc-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500">
                    {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-zinc-400">{p.email}</p>
                  </div>
                </div>
                {p.propertyCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                    </svg>
                    {p.propertyCount} bien{p.propertyCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
