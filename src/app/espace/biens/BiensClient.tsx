"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PropertyStatus } from "@/lib/supabase/types";

interface Property {
  id: string;
  owner_id: string;
  iad_url: string | null;
  iad_reference: string | null;
  transaction_type: string | null;
  property_type: string | null;
  city: string | null;
  postal_code: string | null;
  price: number | null;
  living_area: number | null;
  rooms: number | null;
  bedrooms: number | null;
  description: string | null;
  photo_url: string | null;
  status: PropertyStatus;
  created_at: string;
  profiles?: { first_name: string; last_name: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  disponible: "Disponible",
  sous_offre: "Sous offre",
  vendu: "Vendu",
  retire: "Retiré",
};

const STATUS_COLORS: Record<string, string> = {
  disponible: "bg-emerald-100 text-emerald-700",
  sous_offre: "bg-amber-100 text-amber-700",
  vendu: "bg-zinc-100 text-zinc-500",
  retire: "bg-red-100 text-red-700",
};

function formatPrice(price: number | null): string {
  if (!price) return "";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
}

const EMPTY_FORM = {
  iad_url: "",
  transaction_type: "vente",
  property_type: "appartement",
  city: "",
  postal_code: "",
  price: "",
  living_area: "",
  rooms: "",
  bedrooms: "",
  description: "",
  is_off_market: false,
};

export default function BiensClient({
  myProperties: initialMy,
  othersProperties: initialOthers,
  userId,
  isAdmin = false,
}: {
  myProperties: Property[];
  othersProperties: Property[];
  userId: string;
  isAdmin?: boolean;
}) {
  const [myProperties, setMyProperties] = useState(initialMy);
  const [othersProperties, setOthersProperties] = useState(initialOthers);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tab, setTab] = useState<"mine" | "network">("network");
  const [citySuggestions, setCitySuggestions] = useState<{ nom: string; codesPostaux: string[] }[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityLookupTimer = useState<ReturnType<typeof setTimeout> | null>(null);

  async function lookupCityByPostalCode(postalCode: string) {
    if (postalCode.length !== 5) {
      setCitySuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom,codesPostaux&format=json`
      );
      if (res.ok) {
        const data: { nom: string; codesPostaux: string[] }[] = await res.json();
        if (data.length === 1) {
          setForm((f) => ({ ...f, city: data[0].nom }));
          setCitySuggestions([]);
          setShowCitySuggestions(false);
        } else if (data.length > 1) {
          setCitySuggestions(data);
          setShowCitySuggestions(true);
        }
      }
    } catch {
      setCitySuggestions([]);
    }
  }

  async function lookupCityByName(name: string) {
    if (name.length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(name)}&fields=nom,codesPostaux&format=json&boost=population&limit=8`
      );
      if (res.ok) {
        const data: { nom: string; codesPostaux: string[] }[] = await res.json();
        setCitySuggestions(data);
        setShowCitySuggestions(data.length > 0);
      }
    } catch {
      setCitySuggestions([]);
    }
  }

  function handleCityInput(value: string) {
    setForm((f) => ({ ...f, city: value }));
    if (cityLookupTimer[0]) clearTimeout(cityLookupTimer[0]);
    cityLookupTimer[0] = setTimeout(() => lookupCityByName(value), 300);
  }

  function selectCity(commune: { nom: string; codesPostaux: string[] }) {
    setForm((f) => ({
      ...f,
      city: commune.nom,
      postal_code: commune.codesPostaux[0] || f.postal_code,
    }));
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  }

  async function scrapeIadUrl(url: string) {
    if (!url.includes("iadfrance.fr/annonce/")) return;
    setScraping(true);
    try {
      const res = await fetch("/api/scrape-iad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm((f) => ({
          ...f,
          iad_url: url,
          transaction_type: (data.transaction_type as string) || f.transaction_type,
          property_type: (data.property_type as string) || f.property_type,
          city: (data.city as string) || f.city,
          postal_code: (data.postal_code as string) || f.postal_code,
          price: data.price ? String(data.price) : f.price,
          living_area: data.living_area ? String(data.living_area) : f.living_area,
          rooms: data.rooms ? String(data.rooms) : f.rooms,
          bedrooms: data.bedrooms ? String(data.bedrooms) : f.bedrooms,
          description: (data.description as string) || f.description,
        }));
      }
    } catch {
      // Silently fail
    }
    setScraping(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createClient();

    let photoUrl: string | null = null;
    if (photos.length > 0) {
      const file = photos[0];
      const ext = file.name.split(".").pop();
      const path = `properties/${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(path, file, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }
    }

    const payload = {
      iad_url: form.iad_url || null,
      transaction_type: form.transaction_type,
      property_type: form.property_type,
      city: form.city || null,
      postal_code: form.postal_code || null,
      price: form.price ? parseInt(form.price) : null,
      living_area: form.living_area ? parseInt(form.living_area) : null,
      rooms: form.rooms ? parseInt(form.rooms) : null,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
      description: form.description || null,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("shared_properties")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();

      if (error) {
        setMessage({ type: "error", text: error.message });
        setSaving(false);
        return;
      }

      setMyProperties((prev) => prev.map((p) => (p.id === editingId ? data : p)));
      setMessage({ type: "success", text: "Bien modifié !" });
    } else {
      const { data, error } = await supabase
        .from("shared_properties")
        .insert({
          owner_id: userId,
          ...payload,
          photo_url: photoUrl,
          status: "disponible" as PropertyStatus,
        })
        .select()
        .single();

      if (error) {
        setMessage({ type: "error", text: error.message });
        setSaving(false);
        return;
      }

      setMyProperties((prev) => [data, ...prev]);
      setMessage({ type: "success", text: "Bien partagé avec le réseau !" });
    }

    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPhotos([]);
    setSaving(false);
  }

  function startEdit(p: Property) {
    setEditingId(p.id);
    setForm({
      iad_url: p.iad_url || "",
      transaction_type: p.transaction_type || "vente",
      property_type: p.property_type || "appartement",
      city: p.city || "",
      postal_code: p.postal_code || "",
      price: p.price ? String(p.price) : "",
      living_area: p.living_area ? String(p.living_area) : "",
      rooms: p.rooms ? String(p.rooms) : "",
      bedrooms: p.bedrooms ? String(p.bedrooms) : "",
      description: p.description || "",
      is_off_market: !p.iad_url,
    });
    setPhotos([]);
    setShowForm(true);
    setMessage(null);
  }

  async function updateStatus(id: string, status: PropertyStatus) {
    const supabase = createClient();
    const { error } = await supabase.from("shared_properties").update({ status }).eq("id", id);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMyProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  async function deleteProperty(id: string) {
    const prop = [...myProperties, ...othersProperties].find((p) => p.id === id);
    if (!prop) return;
    const label = `${prop.property_type || "Bien"} ${prop.city || ""}`.trim();
    const confirmed = confirm(`Supprimer "${label}" ?\n\nCette action est irréversible.`);
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from("shared_properties").delete().eq("id", id);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMyProperties((prev) => prev.filter((p) => p.id !== id));
    setOthersProperties((prev) => prev.filter((p) => p.id !== id));
    setMessage({ type: "success", text: "Bien supprimé." });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Partage de biens</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setMessage(null); }}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800"
        >
          + Partager un bien
        </button>
      </div>

      {message && (
        <div className={`rounded-xl p-4 mb-6 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl p-6 mb-8 space-y-4">
          <h2 className="font-semibold text-zinc-900">{editingId ? "Modifier le bien" : "Nouveau bien"}</h2>

          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
            <button
              type="button"
              onClick={() => { setForm({ ...form, is_off_market: false }); setPhotos([]); }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !form.is_off_market ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Annonce IAD
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_off_market: true, iad_url: "" })}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                form.is_off_market ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Bien off-market
            </button>
          </div>

          {!form.is_off_market ? (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Lien IAD (mini-site)</label>
              <div className="relative">
                <input
                  type="url"
                  value={form.iad_url}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, iad_url: val });
                    if (val.includes("iadfrance.fr/annonce/")) scrapeIadUrl(val);
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text");
                    if (pasted.includes("iadfrance.fr/annonce/")) {
                      setTimeout(() => scrapeIadUrl(pasted), 100);
                    }
                  }}
                  placeholder="https://www.iadfrance.fr/annonce/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                {scraping && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {scraping ? "Récupération des infos de l'annonce…" : "Collez le lien de votre annonce IAD pour pré-remplir les infos."}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Photos du bien</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) setPhotos(Array.from(e.target.files));
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
              />
              {photos.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {photos.map((f, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-200">
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-zinc-400 mt-1">Ajoutez des photos pour les biens non publiés sur IAD.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Type de transaction</label>
              <select
                value={form.transaction_type}
                onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="vente">Vente</option>
                <option value="location">Location</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Type de bien</label>
              <select
                value={form.property_type}
                onChange={(e) => setForm({ ...form, property_type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="terrain">Terrain</option>
                <option value="local_commercial">Local commercial</option>
                <option value="immeuble">Immeuble</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Ville</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleCityInput(e.target.value)}
                onFocus={() => { if (citySuggestions.length > 0) setShowCitySuggestions(true); }}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                placeholder="Commencez à taper…"
                autoComplete="off"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              {showCitySuggestions && citySuggestions.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {citySuggestions.map((c, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onMouseDown={() => selectCity(c)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 flex justify-between items-center"
                      >
                        <span className="font-medium text-zinc-900">{c.nom}</span>
                        <span className="text-xs text-zinc-400">{c.codesPostaux[0]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Code postal</label>
              <input
                type="text"
                value={form.postal_code}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, postal_code: val });
                  if (val.length === 5) lookupCityByPostalCode(val);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Prix</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="€"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Surface (m²)</label>
              <input
                type="number"
                value={form.living_area}
                onChange={(e) => setForm({ ...form, living_area: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Pièces</label>
              <input
                type="number"
                value={form.rooms}
                onChange={(e) => setForm({ ...form, rooms: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Chambres</label>
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description / Commentaire</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Infos complémentaires pour le réseau…"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Partager le bien"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
              className="px-5 py-2.5 border border-zinc-200 rounded-xl text-sm hover:bg-zinc-50"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("network")}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === "network" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          Biens du réseau ({othersProperties.length})
        </button>
        <button
          onClick={() => setTab("mine")}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === "mine" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          Mes biens ({myProperties.length})
        </button>
      </div>

      {tab === "network" && (
        <div className="space-y-3">
          {othersProperties.length === 0 ? (
            <p className="text-center text-zinc-400 py-12">Aucun bien partagé pour le moment.</p>
          ) : (
            othersProperties.map((p) => (
              <PropertyCard key={p.id} property={p} showOwner onDelete={isAdmin ? () => deleteProperty(p.id) : undefined} />
            ))
          )}
        </div>
      )}

      {tab === "mine" && (
        <div className="space-y-3">
          {myProperties.length === 0 ? (
            <p className="text-center text-zinc-400 py-12">Vous n&apos;avez pas encore partagé de bien.</p>
          ) : (
            myProperties.map((p) => (
              <div key={p.id} className="bg-white border border-zinc-200 rounded-2xl p-5">
                <PropertyCard property={p} />
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-100">
                  {p.status === "disponible" && (
                    <>
                      <button
                        onClick={() => updateStatus(p.id, "sous_offre")}
                        className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200"
                      >
                        Sous offre
                      </button>
                      <button
                        onClick={() => updateStatus(p.id, "vendu")}
                        className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-200"
                      >
                        Vendu
                      </button>
                      <button
                        onClick={() => updateStatus(p.id, "retire")}
                        className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs hover:bg-zinc-50"
                      >
                        Retirer
                      </button>
                    </>
                  )}
                  {p.status === "sous_offre" && (
                    <>
                      <button
                        onClick={() => updateStatus(p.id, "disponible")}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200"
                      >
                        Remettre disponible
                      </button>
                      <button
                        onClick={() => updateStatus(p.id, "vendu")}
                        className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-200"
                      >
                        Vendu
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => startEdit(p)}
                    className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium hover:bg-zinc-50 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Modifier
                  </button>
                  {p.iad_url && (
                    <a
                      href={p.iad_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs hover:bg-zinc-50"
                    >
                      Voir l&apos;annonce IAD
                    </a>
                  )}
                  <button
                    onClick={() => deleteProperty(p.id)}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium ml-auto"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property: p, showOwner, onDelete }: { property: Property; showOwner?: boolean; onDelete?: () => void }) {
  const owner = p.profiles;
  const isOffMarket = !p.iad_url;

  return (
    <div className={showOwner ? "bg-white border border-zinc-200 rounded-2xl p-5" : ""}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {p.photo_url && (
          <img
            src={p.photo_url}
            alt={`${p.property_type || "Bien"} ${p.city || ""}`}
            className="w-full sm:w-28 h-28 rounded-xl object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-zinc-900">
                {p.property_type === "appartement" ? "Appt" : p.property_type === "maison" ? "Maison" : p.property_type || "Bien"}
                {p.rooms ? ` ${p.rooms}p` : ""}
              </span>
              {p.price && (
                <span className="font-semibold text-zinc-900">{formatPrice(p.price)}</span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                {STATUS_LABELS[p.status]}
              </span>
              {isOffMarket && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                  Off-market
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500">
              {[p.city, p.postal_code].filter(Boolean).join(" ")}
              {p.living_area ? ` · ${p.living_area} m²` : ""}
              {p.bedrooms ? ` · ${p.bedrooms} ch.` : ""}
            </p>
            {p.description && (
              <p className="text-sm text-zinc-600 mt-2">{p.description}</p>
            )}
            {showOwner && owner && (
              <p className="text-xs text-zinc-400 mt-2">
                Partagé par {owner.first_name} {owner.last_name}
              </p>
            )}
          </div>
          {showOwner && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              {p.iad_url && (
                <a
                  href={p.iad_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 text-center"
                >
                  Voir l&apos;annonce
                </a>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-medium"
                >
                  Supprimer
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
