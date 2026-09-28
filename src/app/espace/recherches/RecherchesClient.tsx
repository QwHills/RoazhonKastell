"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SearchStatus } from "@/lib/supabase/types";

interface BuyerSearch {
  id: string;
  owner_id: string;
  cities: string[] | null;
  property_types: string[] | null;
  transaction_type: string;
  max_budget: number | null;
  min_area: number | null;
  min_bedrooms: number | null;
  required_features: string[] | null;
  tolerances: string | null;
  status: SearchStatus;
  created_at: string;
  profiles?: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
}

interface SharedProperty {
  id: string;
  owner_id: string;
  transaction_type: string | null;
  property_type: string | null;
  city: string | null;
  postal_code: string | null;
  price: number | null;
  living_area: number | null;
  rooms: number | null;
  bedrooms: number | null;
  description: string | null;
  status: string;
  iad_url: string | null;
  profiles?: { first_name: string; last_name: string; phone?: string | null } | { first_name: string; last_name: string; phone?: string | null }[] | null;
}

interface GeoCity {
  nom: string;
  code: string;
  codesPostaux: string[];
  departement: { nom: string };
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  en_pause: "En pause",
  terminee: "Terminée",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  en_pause: "bg-amber-100 text-amber-700",
  terminee: "bg-zinc-100 text-zinc-400",
};

function formatBudget(budget: number | null): string {
  if (!budget) return "";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(budget);
}

const PROPERTY_TYPES = [
  { value: "appartement", label: "Appartement" },
  { value: "maison", label: "Maison" },
  { value: "terrain", label: "Terrain" },
  { value: "local_commercial", label: "Local commercial" },
];

const EMPTY_FORM = {
  selectedCities: [] as string[],
  property_types: [] as string[],
  transaction_type: "achat",
  max_budget: "",
  min_area: "",
  min_bedrooms: "",
  tolerances: "",
};

function matchProperties(search: BuyerSearch, properties: SharedProperty[]): SharedProperty[] {
  return properties.filter((p) => {
    if (p.status !== "disponible") return false;
    if (search.cities && search.cities.length > 0 && p.city) {
      const pCity = p.city.toLowerCase();
      if (!search.cities.some((c) => c.toLowerCase() === pCity)) return false;
    }
    if (search.property_types && search.property_types.length > 0 && p.property_type) {
      if (!search.property_types.includes(p.property_type)) return false;
    }
    if (search.max_budget && p.price && p.price > search.max_budget) return false;
    if (search.min_area && p.living_area && p.living_area < search.min_area) return false;
    if (search.min_bedrooms && p.bedrooms && p.bedrooms < search.min_bedrooms) return false;
    return true;
  });
}

export default function RecherchesClient({
  mySearches: initialMy,
  othersSearches: initialOthers,
  networkProperties,
  userId,
}: {
  mySearches: BuyerSearch[];
  othersSearches: BuyerSearch[];
  networkProperties: SharedProperty[];
  userId: string;
}) {
  const [mySearches, setMySearches] = useState(initialMy);
  const [othersSearches] = useState(initialOthers);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tab, setTab] = useState<"network" | "mine">("network");
  const [cityInput, setCityInput] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<GeoCity[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const fetchCities = useCallback(async (query: string) => {
    if (query.length < 2) { setCitySuggestions([]); return; }
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux,departement&boost=population&limit=8`
      );
      if (res.ok) {
        const data: GeoCity[] = await res.json();
        setCitySuggestions(data);
        setShowSuggestions(true);
      }
    } catch { /* ignore */ }
  }, []);

  function handleCityInputChange(val: string) {
    setCityInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCities(val), 300);
  }

  function addCity(city: GeoCity) {
    if (!form.selectedCities.includes(city.nom)) {
      setForm((f) => ({ ...f, selectedCities: [...f.selectedCities, city.nom] }));
    }
    setCityInput("");
    setCitySuggestions([]);
    setShowSuggestions(false);
  }

  function removeCity(city: string) {
    setForm((f) => ({ ...f, selectedCities: f.selectedCities.filter((c) => c !== city) }));
  }

  function toggleType(type: string) {
    setForm((f) => ({
      ...f,
      property_types: f.property_types.includes(type)
        ? f.property_types.filter((t) => t !== type)
        : [...f.property_types, type],
    }));
  }

  function startEdit(search: BuyerSearch) {
    setEditingId(search.id);
    setForm({
      selectedCities: search.cities || [],
      property_types: search.property_types || [],
      transaction_type: search.transaction_type,
      max_budget: search.max_budget ? String(search.max_budget) : "",
      min_area: search.min_area ? String(search.min_area) : "",
      min_bedrooms: search.min_bedrooms ? String(search.min_bedrooms) : "",
      tolerances: search.tolerances || "",
    });
    setShowForm(true);
    setMessage(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setCityInput("");
    setCitySuggestions([]);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const payload = {
      cities: form.selectedCities.length > 0 ? form.selectedCities : null,
      property_types: form.property_types.length > 0 ? form.property_types : null,
      transaction_type: form.transaction_type,
      max_budget: form.max_budget ? parseInt(form.max_budget) : null,
      min_area: form.min_area ? parseInt(form.min_area) : null,
      min_bedrooms: form.min_bedrooms ? parseInt(form.min_bedrooms) : null,
      tolerances: form.tolerances || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("buyer_searches")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        setMessage({ type: "error", text: error.message });
        setSaving(false);
        return;
      }

      setMySearches((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, ...payload } : s))
      );
      setMessage({ type: "success", text: "Recherche modifiée !" });
    } else {
      const { data, error } = await supabase
        .from("buyer_searches")
        .insert({
          owner_id: userId,
          ...payload,
          status: "active" as SearchStatus,
        })
        .select()
        .single();

      if (error) {
        setMessage({ type: "error", text: error.message });
        setSaving(false);
        return;
      }

      setMySearches((prev) => [data, ...prev]);
      setMessage({ type: "success", text: "Recherche publiée !" });
    }

    cancelForm();
    setSaving(false);
  }

  async function updateStatus(id: string, status: SearchStatus) {
    const supabase = createClient();
    const { error } = await supabase.from("buyer_searches").update({ status }).eq("id", id);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMySearches((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Recherches acquéreurs</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setMessage(null); }}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800"
        >
          + Nouvelle recherche
        </button>
      </div>

      {message && (
        <div className={`rounded-xl p-4 mb-6 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl p-6 mb-8 space-y-4">
          <h2 className="font-semibold text-zinc-900">
            {editingId ? "Modifier la recherche" : "Nouvelle recherche acquéreur"}
          </h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Villes recherchées</label>
            {form.selectedCities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.selectedCities.map((city) => (
                  <span key={city} className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-900 text-white rounded-full text-xs font-medium">
                    {city}
                    <button type="button" onClick={() => removeCity(city)} className="hover:text-zinc-300">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative" ref={suggestionsRef}>
              <input
                type="text"
                value={cityInput}
                onChange={(e) => handleCityInputChange(e.target.value)}
                onFocus={() => { if (citySuggestions.length > 0) setShowSuggestions(true); }}
                placeholder="Tapez le début d'une ville…"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              {showSuggestions && citySuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {citySuggestions.map((city) => (
                    <button
                      key={city.code}
                      type="button"
                      onClick={() => addCity(city)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 flex items-center justify-between"
                    >
                      <span className="font-medium text-zinc-900">{city.nom}</span>
                      <span className="text-xs text-zinc-400">{city.departement.nom} ({city.codesPostaux[0]})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Types de bien</label>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleType(type.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    form.property_types.includes(type.value)
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Budget max</label>
              <input
                type="number"
                value={form.max_budget}
                onChange={(e) => setForm({ ...form, max_budget: e.target.value })}
                placeholder="€"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Surface min (m²)</label>
              <input
                type="number"
                value={form.min_area}
                onChange={(e) => setForm({ ...form, min_area: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Chambres min</label>
              <input
                type="number"
                value={form.min_bedrooms}
                onChange={(e) => setForm({ ...form, min_bedrooms: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Tolérances / Notes</label>
            <textarea
              value={form.tolerances}
              onChange={(e) => setForm({ ...form, tolerances: e.target.value })}
              rows={2}
              placeholder="Flexibilité sur le budget, la localisation…"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Publier la recherche"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
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
          Recherches du réseau ({othersSearches.length})
        </button>
        <button
          onClick={() => setTab("mine")}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === "mine" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          Mes recherches ({mySearches.length})
        </button>
      </div>

      {tab === "network" && (
        <div className="space-y-3">
          {othersSearches.length === 0 ? (
            <p className="text-center text-zinc-400 py-12">Aucune recherche acquéreur active.</p>
          ) : (
            othersSearches.map((s) => (
              <SearchCard key={s.id} search={s} showOwner matches={matchProperties(s, networkProperties)} />
            ))
          )}
        </div>
      )}

      {tab === "mine" && (
        <div className="space-y-3">
          {mySearches.length === 0 ? (
            <p className="text-center text-zinc-400 py-12">Vous n&apos;avez pas encore publié de recherche.</p>
          ) : (
            mySearches.map((s) => (
              <div key={s.id} className="bg-white border border-zinc-200 rounded-2xl p-5">
                <SearchCard search={s} matches={matchProperties(s, networkProperties)} />
                <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100">
                  {s.status === "active" && (
                    <>
                      <button
                        onClick={() => startEdit(s)}
                        className="px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium hover:bg-zinc-200"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => updateStatus(s.id, "en_pause")}
                        className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200"
                      >
                        Mettre en pause
                      </button>
                      <button
                        onClick={() => updateStatus(s.id, "terminee")}
                        className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-200"
                      >
                        Terminée
                      </button>
                    </>
                  )}
                  {s.status === "en_pause" && (
                    <>
                      <button
                        onClick={() => startEdit(s)}
                        className="px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium hover:bg-zinc-200"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => updateStatus(s.id, "active")}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200"
                      >
                        Réactiver
                      </button>
                    </>
                  )}
                  {s.status === "terminee" && (
                    <button
                      onClick={() => updateStatus(s.id, "active")}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200"
                    >
                      Réactiver
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SearchCard({ search: s, showOwner, matches }: { search: BuyerSearch; showOwner?: boolean; matches?: SharedProperty[] }) {
  const rawOwner = s.profiles;
  const owner = Array.isArray(rawOwner) ? rawOwner[0] : rawOwner;
  const [showMatches, setShowMatches] = useState(false);

  return (
    <div className={showOwner ? "bg-white border border-zinc-200 rounded-2xl p-5" : ""}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-zinc-900">
            {s.property_types?.map((t) => t === "appartement" ? "Appt" : t === "maison" ? "Maison" : t).join(" / ") || "Tout type"}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status]}`}>
            {STATUS_LABELS[s.status]}
          </span>
          {matches && matches.length > 0 && (
            <button
              type="button"
              onClick={() => setShowMatches(!showMatches)}
              className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            >
              {matches.length} bien{matches.length > 1 ? "s" : ""} compatible{matches.length > 1 ? "s" : ""}
            </button>
          )}
        </div>
        {s.max_budget && (
          <span className="font-semibold text-zinc-900 text-sm">{formatBudget(s.max_budget)} max</span>
        )}
      </div>
      <p className="text-sm text-zinc-500">
        {s.cities?.join(", ") || "Toutes villes"}
        {s.min_area ? ` · ≥ ${s.min_area} m²` : ""}
        {s.min_bedrooms ? ` · ≥ ${s.min_bedrooms} ch.` : ""}
      </p>
      {s.tolerances && (
        <p className="text-sm text-zinc-600 mt-2">{s.tolerances}</p>
      )}
      {showOwner && owner && (
        <p className="text-xs text-zinc-400 mt-2">
          Par {owner.first_name} {owner.last_name}
        </p>
      )}
      {showMatches && matches && matches.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-100 space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Biens compatibles</p>
          {matches.map((p) => {
            const owner = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
            return (
              <div key={p.id} className="bg-blue-50 rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-zinc-900">
                        {p.property_type === "appartement" ? "Appartement" : p.property_type === "maison" ? "Maison" : p.property_type || "Bien"}
                      </span>
                      {p.price && <span className="text-sm font-bold text-zinc-900">{formatBudget(p.price)}</span>}
                    </div>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {[p.city, p.postal_code].filter(Boolean).join(" ")}
                      {p.living_area ? ` · ${p.living_area} m²` : ""}
                      {p.rooms ? ` · ${p.rooms} p.` : ""}
                      {p.bedrooms ? ` · ${p.bedrooms} ch.` : ""}
                    </p>
                  </div>
                  {p.iad_url && (
                    <a
                      href={p.iad_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 flex-shrink-0"
                    >
                      Voir l&apos;annonce
                    </a>
                  )}
                </div>
                {p.description && (
                  <p className="text-sm text-zinc-600">{p.description}</p>
                )}
                {owner && (
                  <div className="flex items-center gap-3 pt-2 border-t border-blue-100 flex-wrap">
                    <span className="text-xs text-zinc-500">
                      Partagé par <span className="font-semibold text-zinc-700">{owner.first_name} {owner.last_name}</span>
                    </span>
                    {owner.phone && (
                      <a
                        href={`tel:${owner.phone}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                        Appeler
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const text = `Bien compatible : ${p.property_type || "Bien"} à ${p.city || "?"} — ${p.price ? formatBudget(p.price) : "Prix N/C"}${p.iad_url ? `\n${p.iad_url}` : ""}`;
                        if (navigator.share) {
                          navigator.share({ title: "Bien compatible", text });
                        } else {
                          navigator.clipboard.writeText(text);
                          alert("Informations copiées !");
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium hover:bg-zinc-50"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                      </svg>
                      Partager
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
