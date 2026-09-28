"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PaymentStatus } from "@/lib/supabase/types";

interface FinancialEntry {
  id: string;
  label: string;
  category: string;
  amount: number;
  type: "recette" | "depense";
  recurrence: "mensuel" | "ponctuel";
  due_date: string | null;
  paid_at: string | null;
  payment_status: PaymentStatus;
  related_profile_id: string | null;
  notes: string | null;
  created_at: string;
  profiles?: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
  isCotisation?: boolean;
  cotisationSince?: string | null;
}

interface CotisationMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  cotisation_mensuelle: number;
  date_adhesion: string | null;
  jour_prelevement: number | null;
}

interface CotisationPartner {
  id: string;
  name: string;
  cotisation_montant: number;
  cotisation_frequence: "mensuel" | "annuel";
  cotisation_debut: string | null;
  jour_prelevement: number | null;
}

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  en_attente: "En attente",
  paye: "Payé",
  en_retard: "En retard",
  annule: "Annulé",
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  en_attente: "bg-amber-100 text-amber-700",
  paye: "bg-emerald-100 text-emerald-700",
  en_retard: "bg-red-100 text-red-600",
  annule: "bg-zinc-100 text-zinc-400",
};

const CATEGORIES = [
  "Charges",
  "Adhésion",
  "Partenariat",
  "Événement",
  "Communication",
  "Local",
  "Assurance",
  "Divers",
];

function formatAmount(amount: number): string {
  const euros = amount / 100;
  const hasCents = euros % 1 !== 0;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: hasCents ? 2 : 0 }).format(euros);
}

function formatEuros(amount: number): string {
  const hasCents = amount % 1 !== 0;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: hasCents ? 2 : 0 }).format(amount);
}

interface FormState {
  label: string;
  category: string;
  amount: string;
  type: "recette" | "depense";
  recurrence: "mensuel" | "ponctuel";
  due_date: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  label: "",
  category: "Charges",
  amount: "",
  type: "recette",
  recurrence: "ponctuel",
  due_date: "",
  notes: "",
};

function monthsBetween(start: Date, end: Date): number {
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(0, months);
}

function yearsBetween(start: Date, end: Date): number {
  let years = end.getFullYear() - start.getFullYear();
  if (end.getMonth() < start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())) {
    years--;
  }
  return Math.max(0, years);
}

function buildCotisationEntries(
  members: CotisationMember[],
  partners: CotisationPartner[],
): FinancialEntry[] {
  const now = new Date();
  const today = now.getDate();

  const memberEntries: FinancialEntry[] = members.map((m) => {
    const isPaid = m.jour_prelevement != null && today >= m.jour_prelevement;
    return {
      id: `cotisation-member-${m.id}`,
      label: `Cotisation — ${m.first_name || ""} ${m.last_name || ""}`.trim(),
      category: "Adhésion",
      amount: Math.round(m.cotisation_mensuelle * 100),
      type: "recette",
      recurrence: "mensuel",
      due_date: m.jour_prelevement != null ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(m.jour_prelevement).padStart(2, "0")}` : null,
      paid_at: isPaid ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(m.jour_prelevement).padStart(2, "0")}` : null,
      payment_status: (isPaid ? "paye" : "en_attente") as PaymentStatus,
      related_profile_id: m.id,
      notes: m.jour_prelevement != null ? `Prélevé le ${m.jour_prelevement} du mois` : null,
      created_at: now.toISOString(),
      isCotisation: true,
      cotisationSince: m.date_adhesion,
    };
  });

  const partnerEntries: FinancialEntry[] = partners.map((p) => {
    const isPaid = p.jour_prelevement != null && today >= p.jour_prelevement;
    return {
      id: `cotisation-partner-${p.id}`,
      label: `Cotisation — ${p.name}`,
      category: "Partenariat",
      amount: Math.round(p.cotisation_montant * 100),
      type: "recette",
      recurrence: "mensuel",
      due_date: p.jour_prelevement != null ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(p.jour_prelevement).padStart(2, "0")}` : null,
      paid_at: isPaid ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(p.jour_prelevement).padStart(2, "0")}` : null,
      payment_status: (isPaid ? "paye" : "en_attente") as PaymentStatus,
      related_profile_id: null,
      notes: p.cotisation_frequence === "annuel" ? "Cotisation annuelle" : (p.jour_prelevement != null ? `Prélevé le ${p.jour_prelevement} du mois` : null),
      created_at: now.toISOString(),
      isCotisation: true,
      cotisationSince: p.cotisation_debut,
    };
  });

  return [...memberEntries, ...partnerEntries];
}

function computeCotisationTotal(members: CotisationMember[], partners: CotisationPartner[]): number {
  const now = new Date();

  const memberTotal = members.reduce((sum, m) => {
    if (!m.date_adhesion) return sum + Math.round(m.cotisation_mensuelle * 100);
    const months = monthsBetween(new Date(m.date_adhesion), now);
    return sum + months * Math.round(m.cotisation_mensuelle * 100);
  }, 0);

  const partnerTotal = partners.reduce((sum, p) => {
    if (!p.cotisation_debut) return sum + Math.round(p.cotisation_montant * 100);
    if (p.cotisation_frequence === "mensuel") {
      const months = monthsBetween(new Date(p.cotisation_debut), now);
      return sum + months * Math.round(p.cotisation_montant * 100);
    }
    const years = yearsBetween(new Date(p.cotisation_debut), now);
    return sum + years * Math.round(p.cotisation_montant * 100);
  }, 0);

  return memberTotal + partnerTotal;
}

function EntryForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  saving,
  submitLabel,
  onDelete,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
  onDelete?: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="bg-white border-2 border-zinc-900 rounded-2xl p-5 space-y-4">
      <div className="flex gap-3 p-2 bg-zinc-50 rounded-xl">
        <button
          type="button"
          onClick={() => setForm({ ...form, type: "recette" })}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${form.type === "recette" ? "bg-emerald-600 text-white" : "text-zinc-600 hover:bg-zinc-200"}`}
        >
          Recette
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, type: "depense" })}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${form.type === "depense" ? "bg-red-600 text-white" : "text-zinc-600 hover:bg-zinc-200"}`}
        >
          Dépense
        </button>
      </div>

      <div className="flex gap-3 p-2 bg-zinc-50 rounded-xl">
        <button
          type="button"
          onClick={() => setForm({ ...form, recurrence: "ponctuel" })}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${form.recurrence === "ponctuel" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-200"}`}
        >
          Ponctuel
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, recurrence: "mensuel" })}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${form.recurrence === "mensuel" ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-200"}`}
        >
          Mensuel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Libellé</label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            required
            placeholder="Ex: Assurance locale"
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Montant (€)</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Catégorie</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Échéance</label>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50">
          {saving ? "Envoi…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-zinc-200 rounded-xl text-sm hover:bg-zinc-50">
          Annuler
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium"
          >
            Supprimer
          </button>
        )}
      </div>
    </form>
  );
}

function EntryRow({
  entry,
  onEdit,
  profile,
}: {
  entry: FinancialEntry;
  onEdit?: () => void;
  profile: { first_name: string; last_name: string } | null;
}) {
  return (
    <div className={`border rounded-2xl p-4 flex items-center gap-4 ${entry.isCotisation ? "bg-blue-50/50 border-blue-200" : "bg-white border-zinc-200"}`}>
      <div className={`w-2 h-10 rounded-full flex-shrink-0 ${entry.type === "recette" ? "bg-emerald-400" : "bg-red-400"}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-zinc-900 text-sm">{entry.label}</span>
          {entry.isCotisation && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              Cotisation
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_COLORS[entry.payment_status]}`}>
            {PAYMENT_LABELS[entry.payment_status]}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-100 text-zinc-500">{entry.category}</span>
        </div>
        <p className="text-xs text-zinc-400 mt-0.5">
          {entry.isCotisation
            ? (entry.cotisationSince
                ? `Depuis le ${new Date(entry.cotisationSince).toLocaleDateString("fr-FR")}`
                : "Recette récurrente")
            : (
              <>
                {entry.due_date && `Échéance: ${new Date(entry.due_date).toLocaleDateString("fr-FR")}`}
                {entry.paid_at && ` · Payé le ${new Date(entry.paid_at).toLocaleDateString("fr-FR")}`}
                {profile && ` · ${profile.first_name} ${profile.last_name}`}
              </>
            )}
        </p>
        {entry.notes && <p className="text-xs text-zinc-500 mt-1">{entry.notes}</p>}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`text-sm font-bold ${entry.type === "recette" ? "text-emerald-600" : "text-red-600"}`}>
          {entry.type === "recette" ? "+" : "-"}{formatAmount(entry.amount)}
        </span>
        {!entry.isCotisation && onEdit && (
          <button
            onClick={onEdit}
            className="text-xs text-zinc-400 hover:text-zinc-700"
          >
            Modifier
          </button>
        )}
      </div>
    </div>
  );
}

export default function FinancesClient({
  entries: initialEntries,
  userId,
  cotisationMembers,
  cotisationPartners,
}: {
  entries: FinancialEntry[];
  userId: string;
  cotisationMembers: CotisationMember[];
  cotisationPartners: CotisationPartner[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [section, setSection] = useState<"recurrent" | "ponctuel">("recurrent");
  const [filterType, setFilterType] = useState<"all" | "recettes" | "depenses">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  const cotisationEntries = buildCotisationEntries(cotisationMembers, cotisationPartners);

  const recurrentEntries = entries.filter((e) => e.recurrence === "mensuel");
  const ponctuelEntries = entries.filter((e) => e.recurrence !== "mensuel");

  const recurrentAll = [...recurrentEntries, ...cotisationEntries];
  const ponctuelAll = ponctuelEntries;

  const currentList = section === "recurrent" ? recurrentAll : ponctuelAll;
  const filtered = currentList.filter((e) => {
    if (filterType === "recettes" && e.type !== "recette") return false;
    if (filterType === "depenses" && e.type !== "depense") return false;
    return true;
  });

  const totalRecettes = entries.filter((e) => e.type === "recette" && e.payment_status === "paye").reduce((s, e) => s + e.amount, 0);
  const totalDepenses = entries.filter((e) => e.type === "depense" && e.payment_status === "paye").reduce((s, e) => s + e.amount, 0);

  const recurrentRecettes = recurrentEntries.filter((e) => e.type === "recette" && e.payment_status === "paye").reduce((s, e) => s + e.amount, 0);
  const recurrentDepenses = recurrentEntries.filter((e) => e.type === "depense" && e.payment_status === "paye").reduce((s, e) => s + e.amount, 0);

  const cotisationMensuelleTotal =
    cotisationMembers.reduce((s, m) => s + m.cotisation_mensuelle, 0) +
    cotisationPartners.filter((p) => p.cotisation_frequence === "mensuel").reduce((s, p) => s + p.cotisation_montant, 0);

  const cotisationAnnuelleTotal =
    cotisationPartners.filter((p) => p.cotisation_frequence === "annuel").reduce((s, p) => s + p.cotisation_montant, 0);

  const cotisationCumulTotal = computeCotisationTotal(cotisationMembers, cotisationPartners);

  const recurrentMensuelRecettes = recurrentRecettes / 100 + cotisationMensuelleTotal;
  const recurrentMensuelDepenses = recurrentDepenses / 100;
  const recurrentSolde = recurrentMensuelRecettes - recurrentMensuelDepenses;

  const ponctuelRecettes = ponctuelEntries.filter((e) => e.type === "recette" && e.payment_status === "paye").reduce((s, e) => s + e.amount, 0);
  const ponctuelDepenses = ponctuelEntries.filter((e) => e.type === "depense" && e.payment_status === "paye").reduce((s, e) => s + e.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label.trim() || !form.amount) return;
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("financial_entries")
      .insert({
        label: form.label.trim(),
        category: form.category,
        amount: Math.round(parseFloat(form.amount) * 100),
        type: form.type,
        recurrence: form.recurrence,
        due_date: form.due_date || null,
        notes: form.notes.trim() || null,
        created_by: userId,
        payment_status: "paye",
        paid_at: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) {
      setMessage({ type: "error", text: error.message });
      setSaving(false);
      return;
    }

    setEntries((prev) => [data, ...prev]);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setMessage({ type: "success", text: "Écriture ajoutée !" });
    setSaving(false);
  }

  function startEdit(entry: FinancialEntry) {
    setEditingId(entry.id);
    setEditForm({
      label: entry.label,
      category: entry.category,
      amount: String(entry.amount / 100),
      type: entry.type,
      recurrence: entry.recurrence || "ponctuel",
      due_date: entry.due_date || "",
      notes: entry.notes || "",
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editForm.label.trim() || !editForm.amount) return;
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("financial_entries")
      .update({
        label: editForm.label.trim(),
        category: editForm.category,
        amount: Math.round(parseFloat(editForm.amount) * 100),
        type: editForm.type,
        recurrence: editForm.recurrence,
        due_date: editForm.due_date || null,
        notes: editForm.notes.trim() || null,
      })
      .eq("id", editingId);

    if (error) {
      setMessage({ type: "error", text: error.message });
      setSaving(false);
      return;
    }

    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === editingId
          ? {
              ...entry,
              label: editForm.label.trim(),
              category: editForm.category,
              amount: Math.round(parseFloat(editForm.amount) * 100),
              type: editForm.type as "recette" | "depense",
              recurrence: editForm.recurrence as "mensuel" | "ponctuel",
              due_date: editForm.due_date || null,
              notes: editForm.notes.trim() || null,
            }
          : entry
      )
    );
    setEditingId(null);
    setMessage({ type: "success", text: "Écriture modifiée !" });
    setSaving(false);
  }

  async function deleteEntry(id: string) {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    const confirmed = confirm(`Supprimer l'écriture "${entry.label}" ?\n\nCette action est irréversible.`);
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from("financial_entries").delete().eq("id", id);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setEditingId(null);
    setMessage({ type: "success", text: "Écriture supprimée." });
  }

  function getProfile(entry: FinancialEntry) {
    if (!entry.profiles) return null;
    return Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Finances</h1>
        <button
          onClick={() => { setShowForm(true); setForm({ ...EMPTY_FORM, recurrence: section === "recurrent" ? "mensuel" : "ponctuel" }); setMessage(null); }}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800"
        >
          + Nouvelle écriture
        </button>
      </div>

      {/* Solde global */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <p className="text-xs text-emerald-600 font-medium">Recettes encaissées</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatAmount(totalRecettes)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-xs text-red-600 font-medium">Dépenses payées</p>
          <p className="text-xl font-bold text-red-700 mt-1">{formatAmount(totalDepenses)}</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
          <p className="text-xs text-zinc-500 font-medium">Solde</p>
          <p className="text-xl font-bold text-zinc-900 mt-1">{formatAmount(totalRecettes - totalDepenses)}</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setSection("recurrent"); setEditingId(null); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${section === "recurrent" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          Récurrent (mensuel)
        </button>
        <button
          onClick={() => { setSection("ponctuel"); setEditingId(null); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${section === "ponctuel" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
        >
          Ponctuel
        </button>
      </div>

      {/* Section summary */}
      {section === "recurrent" ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <p className="text-xs text-blue-600 font-medium mb-2">Budget mensuel récurrent</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-blue-500">Recettes / mois</p>
              <p className="text-lg font-bold text-emerald-700">{formatEuros(recurrentMensuelRecettes)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-500">Charges / mois</p>
              <p className="text-lg font-bold text-red-600">{formatEuros(recurrentMensuelDepenses)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-500">Solde mensuel</p>
              <p className={`text-lg font-bold ${recurrentSolde >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {recurrentSolde >= 0 ? "+" : ""}{formatEuros(recurrentSolde)}
              </p>
            </div>
          </div>
          {cotisationCumulTotal > 0 && (
            <p className="text-xs text-blue-500 mt-2">
              Total cumulé cotisations attendu : {formatAmount(cotisationCumulTotal)}
              {" · "}{cotisationMembers.length} adhérent{cotisationMembers.length > 1 ? "s" : ""}
              {cotisationPartners.length > 0 && ` + ${cotisationPartners.length} partenaire${cotisationPartners.length > 1 ? "s" : ""}`}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <p className="text-xs text-emerald-600 font-medium">Recettes ponctuelles</p>
            <p className="text-lg font-bold text-emerald-700 mt-1">{formatAmount(ponctuelRecettes)}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-xs text-red-600 font-medium">Dépenses ponctuelles</p>
            <p className="text-lg font-bold text-red-700 mt-1">{formatAmount(ponctuelDepenses)}</p>
          </div>
        </div>
      )}

      {message && (
        <div className={`rounded-xl p-4 mb-6 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="mb-6">
          <h2 className="font-semibold text-zinc-900 mb-3">Nouvelle écriture</h2>
          <EntryForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            saving={saving}
            submitLabel="Ajouter"
          />
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(["all", "recettes", "depenses"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${filterType === t ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
          >
            {t === "all" ? "Tout" : t === "recettes" ? "Recettes" : "Dépenses"}
          </button>
        ))}
      </div>

      {/* Entries list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-zinc-400 py-12">
            {section === "recurrent" ? "Aucune charge récurrente." : "Aucune écriture ponctuelle."}
          </p>
        ) : (
          filtered.map((entry) => {
            if (!entry.isCotisation && editingId === entry.id) {
              return (
                <EntryForm
                  key={entry.id}
                  form={editForm}
                  setForm={setEditForm}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                  submitLabel="Enregistrer"
                  onDelete={() => deleteEntry(entry.id)}
                />
              );
            }
            return (
              <EntryRow
                key={entry.id}
                entry={entry}
                onEdit={entry.isCotisation ? undefined : () => startEdit(entry)}
                profile={getProfile(entry)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
