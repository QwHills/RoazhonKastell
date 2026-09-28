"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Resource {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  file_url: string | null;
  visibility: string;
  uploaded_by: string | null;
  created_at: string;
  profiles?: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
}

const CATEGORIES = [
  "Documents administratifs",
  "Supports de communication",
  "Formation",
  "Outils",
  "Comptes rendus",
  "Autre",
];

const VISIBILITY_LABELS: Record<string, string> = {
  tous_membres: "Tous les membres",
  adherents: "Adhérents uniquement",
  partenaires: "Partenaires uniquement",
  public: "Public",
};

export default function RessourcesClient({
  resources: initialResources,
  userId,
  isAdmin,
}: {
  resources: Resource[];
  userId: string;
  isAdmin: boolean;
}) {
  const [resources, setResources] = useState(initialResources);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("tous_membres");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filter, setFilter] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setMessage(null);

    const supabase = createClient();

    let fileUrl: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `resources/${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(path, file, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from("resources")
      .insert({
        title: title.trim(),
        category: category || null,
        description: description.trim() || null,
        file_url: fileUrl,
        visibility,
        uploaded_by: userId,
      })
      .select("*, profiles!resources_uploaded_by_fkey(first_name, last_name)")
      .single();

    if (error) {
      setMessage({ type: "error", text: error.message });
      setSaving(false);
      return;
    }

    setResources((prev) => [data, ...prev]);
    setShowForm(false);
    setTitle("");
    setCategory("");
    setDescription("");
    setFile(null);
    setVisibility("tous_membres");
    setMessage({ type: "success", text: "Ressource ajoutée !" });
    setSaving(false);
  }

  async function deleteResource(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setResources((prev) => prev.filter((r) => r.id !== id));
  }

  function getUploader(r: Resource) {
    if (!r.profiles) return null;
    return Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
  }

  const categories = [...new Set(resources.map((r) => r.category).filter(Boolean))];
  const filtered = filter ? resources.filter((r) => r.category === filter) : resources;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold text-zinc-900">Ressources</h1>
        {isAdmin && (
          <button
            onClick={() => { setShowForm(true); setMessage(null); }}
            className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800"
          >
            + Ajouter une ressource
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 mb-6">
        Documents, supports et outils partagés par le réseau. Retrouvez ici les comptes rendus, guides et fichiers utiles.
      </p>

      {message && (
        <div className={`rounded-xl p-4 mb-6 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl p-6 mb-8 space-y-4">
          <h2 className="font-semibold text-zinc-900">Nouvelle ressource</h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">— Choisir —</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Visibilité</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                {Object.entries(VISIBILITY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Fichier</label>
            <input
              type="file"
              onChange={(e) => { if (e.target.files) setFile(e.target.files[0]); }}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50">
              {saving ? "Envoi…" : "Ajouter"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-zinc-200 rounded-xl text-sm hover:bg-zinc-50">
              Annuler
            </button>
          </div>
        </form>
      )}

      {categories.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilter("")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${!filter ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
          >
            Tout ({resources.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat!)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === cat ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-zinc-400 py-12">Aucune ressource disponible.</p>
        ) : (
          filtered.map((r) => {
            const uploader = getUploader(r);
            return (
              <div key={r.id} className="bg-white border border-zinc-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="font-semibold text-zinc-900">{r.title}</h3>
                    {r.category && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500">
                        {r.category}
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-sm text-zinc-600">{r.description}</p>
                  )}
                  <p className="text-xs text-zinc-400 mt-1">
                    {uploader && `Par ${uploader.first_name} ${uploader.last_name} · `}
                    {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.file_url && (
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800"
                    >
                      Télécharger
                    </a>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => deleteResource(r.id)}
                      className="px-3 py-2 border border-red-200 text-red-600 rounded-xl text-xs hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
