"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PartnerContact {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  sort_order: number;
}

interface Partner {
  id: string;
  name: string;
  category: string | null;
  sector: string | null;
  description: string | null;
  services: string | null;
  logo_url: string | null;
  remuneration: boolean;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  soumis: "En attente de validation",
  valide: "Publiée",
  refuse: "Refusée",
};

export default function PartenaireEdit({
  partner: initialPartner,
  contacts: initialContacts,
}: {
  partner: Partner;
  contacts: PartnerContact[];
}) {
  const [partner, setPartner] = useState(initialPartner);
  const [contacts, setContacts] = useState(initialContacts.sort((a, b) => a.sort_order - b.sort_order));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function updateField(field: string, value: string) {
    setPartner((p) => ({ ...p, [field]: value }));
  }

  function updateContact(index: number, field: string, value: string) {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  }

  function addContact() {
    setContacts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        role: null,
        phone: null,
        email: null,
        note: null,
        sort_order: prev.length,
      },
    ]);
  }

  function removeContact(index: number) {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  }

  async function save(andSubmit = false) {
    if (andSubmit) {
      setSubmitting(true);
    } else {
      setSaving(true);
    }
    setMessage(null);

    const supabase = createClient();
    const newStatus = andSubmit ? "soumis" : partner.status === "refuse" ? "brouillon" : partner.status;

    const { error: partnerError } = await supabase
      .from("partners")
      .update({
        name: partner.name,
        category: partner.category,
        sector: partner.sector,
        description: partner.description,
        services: partner.services,
        status: newStatus,
      })
      .eq("id", partner.id);

    if (partnerError) {
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde : " + partnerError.message });
      setSaving(false);
      setSubmitting(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("partner_contacts")
      .delete()
      .eq("partner_id", partner.id);

    if (deleteError) {
      setMessage({ type: "error", text: "Erreur contacts : " + deleteError.message });
      setSaving(false);
      setSubmitting(false);
      return;
    }

    if (contacts.length > 0) {
      const { error: insertError } = await supabase
        .from("partner_contacts")
        .insert(
          contacts.map((c, i) => ({
            partner_id: partner.id,
            name: c.name,
            role: c.role || null,
            phone: c.phone || null,
            email: c.email || null,
            note: c.note || null,
            sort_order: i,
          })),
        );

      if (insertError) {
        setMessage({ type: "error", text: "Erreur insertion contacts : " + insertError.message });
        setSaving(false);
        setSubmitting(false);
        return;
      }
    }

    setPartner((p) => ({ ...p, status: newStatus }));
    setMessage({
      type: "success",
      text: andSubmit ? "Fiche soumise pour validation !" : "Modifications enregistrées.",
    });
    setSaving(false);
    setSubmitting(false);
  }

  const isEditable = partner.status === "brouillon" || partner.status === "refuse";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Ma fiche partenaire</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Statut : <span className="font-medium">{STATUS_LABELS[partner.status] || partner.status}</span>
          </p>
        </div>
      </div>

      {partner.status === "valide" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-sm text-emerald-800">
          Votre fiche est publiée sur le site. Pour la modifier, contactez un responsable.
        </div>
      )}

      {partner.status === "soumis" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          Votre fiche est en cours de validation. Vous serez notifié une fois qu&apos;elle sera approuvée.
        </div>
      )}

      {partner.status === "refuse" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-800">
          Votre fiche a été refusée. Vous pouvez la modifier et la soumettre à nouveau.
        </div>
      )}

      {message && (
        <div className={`rounded-xl p-4 mb-6 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Informations générales</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nom de l&apos;entreprise</label>
              <input
                type="text"
                value={partner.name}
                onChange={(e) => updateField("name", e.target.value)}
                disabled={!isEditable}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Catégorie</label>
                <input
                  type="text"
                  value={partner.category || ""}
                  onChange={(e) => updateField("category", e.target.value)}
                  disabled={!isEditable}
                  placeholder="Ex : Finance & Assurance"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Secteur</label>
                <input
                  type="text"
                  value={partner.sector || ""}
                  onChange={(e) => updateField("sector", e.target.value)}
                  disabled={!isEditable}
                  placeholder="Ex : Courtier en prêt"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Prestations / Services</label>
              <input
                type="text"
                value={partner.services || ""}
                onChange={(e) => updateField("services", e.target.value)}
                disabled={!isEditable}
                placeholder="Ex : Prêt immobilier, Assurance emprunteur"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
              <textarea
                value={partner.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
                disabled={!isEditable}
                rows={4}
                placeholder="Présentez votre activité en quelques lignes…"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900">Interlocuteurs</h2>
            {isEditable && (
              <button
                onClick={addContact}
                className="text-sm font-medium text-zinc-900 hover:text-zinc-600"
              >
                + Ajouter
              </button>
            )}
          </div>
          <div className="space-y-4">
            {contacts.map((contact, index) => (
              <div key={contact.id} className="border border-zinc-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-zinc-400">Contact {index + 1}</span>
                  {isEditable && contacts.length > 1 && (
                    <button
                      onClick={() => removeContact(index)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => updateContact(index, "name", e.target.value)}
                    disabled={!isEditable}
                    placeholder="Nom"
                    className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
                  />
                  <input
                    type="text"
                    value={contact.phone || ""}
                    onChange={(e) => updateContact(index, "phone", e.target.value)}
                    disabled={!isEditable}
                    placeholder="Téléphone"
                    className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
                  />
                  <input
                    type="email"
                    value={contact.email || ""}
                    onChange={(e) => updateContact(index, "email", e.target.value)}
                    disabled={!isEditable}
                    placeholder="Email"
                    className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
                  />
                  <input
                    type="text"
                    value={contact.note || ""}
                    onChange={(e) => updateContact(index, "note", e.target.value)}
                    disabled={!isEditable}
                    placeholder="Spécialité / Note"
                    className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
                  />
                </div>
              </div>
            ))}
            {contacts.length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-4">Aucun interlocuteur ajouté</p>
            )}
          </div>
        </div>

        {isEditable && (
          <div className="flex gap-3">
            <button
              onClick={() => save(false)}
              disabled={saving || submitting}
              className="px-5 py-2.5 border border-zinc-200 rounded-xl text-sm font-semibold hover:bg-zinc-50 disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer le brouillon"}
            </button>
            <button
              onClick={() => save(true)}
              disabled={saving || submitting || !partner.name.trim()}
              className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitting ? "Envoi…" : "Soumettre pour validation"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
