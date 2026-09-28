"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { IdeaStatus } from "@/lib/supabase/types";

interface Idea {
  id: string;
  author_id: string;
  title: string;
  category: string | null;
  description: string;
  status: IdeaStatus;
  response: string | null;
  responded_by: string | null;
  created_at: string;
  profiles?: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
}

const STATUS_LABELS: Record<IdeaStatus, string> = {
  a_etudier: "À étudier",
  retenue: "Retenue",
  en_cours: "En cours",
  realisee: "Réalisée",
  non_retenue: "Non retenue",
};

const STATUS_COLORS: Record<IdeaStatus, string> = {
  a_etudier: "bg-blue-100 text-blue-700",
  retenue: "bg-emerald-100 text-emerald-700",
  en_cours: "bg-amber-100 text-amber-700",
  realisee: "bg-zinc-100 text-zinc-500",
  non_retenue: "bg-red-100 text-red-600",
};

const CATEGORIES = [
  "Événements",
  "Communication",
  "Outils",
  "Formation",
  "Partenariats",
  "Autre",
];

const EMPTY_FORM = { title: "", category: "", description: "" };

export default function IdeesClient({
  ideas: initialIdeas,
  supportMap: initialSupports,
  userId,
  isAdmin,
}: {
  ideas: Idea[];
  supportMap: Record<string, string[]>;
  userId: string;
  isAdmin: boolean;
}) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [supports, setSupports] = useState(initialSupports);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [responseText, setResponseText] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("ideas")
      .insert({
        author_id: userId,
        title: form.title.trim(),
        category: form.category || null,
        description: form.description.trim(),
      })
      .select("*, profiles!ideas_author_id_fkey(first_name, last_name)")
      .single();

    if (error) {
      setMessage({ type: "error", text: error.message });
      setSaving(false);
      return;
    }

    setIdeas((prev) => [data, ...prev]);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setMessage({ type: "success", text: "Idée soumise !" });
    setSaving(false);
  }

  async function toggleSupport(ideaId: string) {
    const supabase = createClient();
    const currentSupports = supports[ideaId] || [];
    const alreadySupported = currentSupports.includes(userId);

    if (alreadySupported) {
      await supabase.from("idea_supports").delete().eq("idea_id", ideaId).eq("user_id", userId);
      setSupports((prev) => ({
        ...prev,
        [ideaId]: prev[ideaId].filter((id) => id !== userId),
      }));
    } else {
      await supabase.from("idea_supports").insert({ idea_id: ideaId, user_id: userId });
      setSupports((prev) => ({
        ...prev,
        [ideaId]: [...(prev[ideaId] || []), userId],
      }));
    }
  }

  async function updateStatus(ideaId: string, status: IdeaStatus) {
    const supabase = createClient();
    const response = responseText[ideaId]?.trim() || null;
    const { error } = await supabase
      .from("ideas")
      .update({ status, response, responded_by: userId })
      .eq("id", ideaId);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, status, response, responded_by: userId } : i))
    );
  }

  function getAuthor(idea: Idea) {
    if (!idea.profiles) return null;
    return Array.isArray(idea.profiles) ? idea.profiles[0] : idea.profiles;
  }

  const sortedIdeas = [...ideas].sort((a, b) => {
    const aSupports = (supports[a.id] || []).length;
    const bSupports = (supports[b.id] || []).length;
    if (aSupports !== bSupports) return bSupports - aSupports;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Boîte à idées</h1>
        <button
          onClick={() => { setShowForm(true); setMessage(null); }}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800"
        >
          + Proposer une idée
        </button>
      </div>

      {message && (
        <div className={`rounded-xl p-4 mb-6 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl p-6 mb-8 space-y-4">
          <h2 className="font-semibold text-zinc-900">Nouvelle idée</h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Titre</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Résumez votre idée en une phrase"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Catégorie</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="">— Choisir —</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              required
              placeholder="Décrivez votre idée, son intérêt pour le réseau…"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50">
              {saving ? "Envoi…" : "Soumettre l'idée"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-zinc-200 rounded-xl text-sm hover:bg-zinc-50">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {sortedIdeas.length === 0 ? (
          <p className="text-center text-zinc-400 py-12">Aucune idée pour le moment. Soyez le premier !</p>
        ) : (
          sortedIdeas.map((idea) => {
            const author = getAuthor(idea);
            const supportCount = (supports[idea.id] || []).length;
            const iSupport = (supports[idea.id] || []).includes(userId);

            return (
              <div key={idea.id} className="bg-white border border-zinc-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-zinc-900">{idea.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[idea.status]}`}>
                        {STATUS_LABELS[idea.status]}
                      </span>
                      {idea.category && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500">
                          {idea.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 mt-1 whitespace-pre-line">{idea.description}</p>
                    {idea.response && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                        <p className="text-xs font-semibold text-blue-700 mb-1">Réponse de l&apos;équipe</p>
                        <p className="text-sm text-blue-900">{idea.response}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => toggleSupport(idea.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          iSupport
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                      >
                        <span>{iSupport ? "▲" : "△"}</span>
                        {supportCount} soutien{supportCount !== 1 ? "s" : ""}
                      </button>
                      {author && (
                        <span className="text-xs text-zinc-400">
                          Par {author.first_name} {author.last_name} · {new Date(idea.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isAdmin && idea.status === "a_etudier" && (
                  <div className="mt-4 pt-4 border-t border-zinc-100 space-y-3">
                    <textarea
                      value={responseText[idea.id] || ""}
                      onChange={(e) => setResponseText((prev) => ({ ...prev, [idea.id]: e.target.value }))}
                      rows={2}
                      placeholder="Réponse à l'auteur (optionnel)…"
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => updateStatus(idea.id, "retenue")} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200">
                        Retenir
                      </button>
                      <button onClick={() => updateStatus(idea.id, "en_cours")} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200">
                        En cours
                      </button>
                      <button onClick={() => updateStatus(idea.id, "non_retenue")} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200">
                        Non retenue
                      </button>
                    </div>
                  </div>
                )}

                {isAdmin && idea.status === "retenue" && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 flex gap-2">
                    <button onClick={() => updateStatus(idea.id, "en_cours")} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200">
                      Passer en cours
                    </button>
                    <button onClick={() => updateStatus(idea.id, "realisee")} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-200">
                      Réalisée
                    </button>
                  </div>
                )}

                {isAdmin && idea.status === "en_cours" && (
                  <div className="mt-3 pt-3 border-t border-zinc-100">
                    <button onClick={() => updateStatus(idea.id, "realisee")} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200">
                      Marquer réalisée
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
