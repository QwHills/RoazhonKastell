"use client";

import { useState, useRef, useCallback } from "react";
import type { Partner, PartnerContact, ContactSituation } from "@/lib/supabase/types";
import PartenairePreview from "./PartenairePreview";

const CATEGORIES = [
  "Finance & Assurance",
  "Diagnostic",
  "Travaux & Rénovation",
  "Services",
  "Habitat & Équipement",
];

const SITUATION_ICONS = ["🏠", "💰", "📋", "🔑", "🛠️", "📊", "⚖️", "🏗️", "💼", "🔍", "📐", "🏢"];

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  soumis: "En attente de validation",
  valide: "Publiée",
  refuse: "Refusée",
};

const STATUS_COLORS: Record<string, string> = {
  brouillon: "bg-zinc-100 text-zinc-700",
  soumis: "bg-amber-100 text-amber-800",
  valide: "bg-emerald-100 text-emerald-800",
  refuse: "bg-red-100 text-red-800",
};

interface SectionProps {
  title: string;
  icon: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
}

function Section({ title, icon, open, onToggle, children, badge }: SectionProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-zinc-900">{title}</span>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">{badge}</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-6 pb-6 pt-2 border-t border-zinc-100">{children}</div>}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
      />
    </div>
  );
}

export default function PartenaireEdit({
  partner: initialPartner,
  contacts: initialContacts,
}: {
  partner: Partner;
  contacts: PartnerContact[];
}) {
  const [partner, setPartner] = useState<Partner>({
    ...initialPartner,
    why_choose_us_points: initialPartner.why_choose_us_points || [],
    contact_situations: initialPartner.contact_situations || [],
    social_links: initialPartner.social_links || {},
    photos: initialPartner.photos || [],
  });
  const [contacts, setContacts] = useState<PartnerContact[]>(
    initialContacts.sort((a, b) => a.sort_order - b.sort_order),
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    entreprise: true,
    photos: false,
    contact_situations: false,
    why_choose: false,
    interlocuteurs: false,
    liens: false,
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const contactPhotoRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateField = useCallback(<K extends keyof Partner>(field: K, value: Partner[K]) => {
    setPartner((p) => ({ ...p, [field]: value }));
  }, []);

  const updateSocialLink = useCallback((key: string, value: string) => {
    setPartner((p) => ({
      ...p,
      social_links: { ...p.social_links, [key]: value },
    }));
  }, []);

  async function uploadPhoto(file: File, type: string): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("partnerId", partner.id);
    formData.append("type", type);

    const res = await fetch("/api/partners/upload-photo", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Erreur upload" });
      return null;
    }

    const data = await res.json();
    return data.url;
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("logo");
    const url = await uploadPhoto(file, "logo");
    if (url) updateField("logo_url", url);
    setUploading(null);
    e.target.value = "";
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("cover");
    const url = await uploadPhoto(file, "cover");
    if (url) updateField("cover_photo", url);
    setUploading(null);
    e.target.value = "";
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setUploading("gallery");
    for (const file of Array.from(files)) {
      const url = await uploadPhoto(file, "gallery");
      if (url) {
        setPartner((p) => ({ ...p, photos: [...(p.photos || []), url] }));
      }
    }
    setUploading(null);
    e.target.value = "";
  }

  async function handleContactPhotoUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(`contact-${index}`);
    const url = await uploadPhoto(file, "contact");
    if (url) {
      setContacts((prev) =>
        prev.map((c, i) => (i === index ? { ...c, photo_url: url } : c)),
      );
    }
    setUploading(null);
    e.target.value = "";
  }

  function removeGalleryPhoto(index: number) {
    setPartner((p) => ({
      ...p,
      photos: (p.photos || []).filter((_, i) => i !== index),
    }));
  }

  function moveGalleryPhoto(from: number, to: number) {
    setPartner((p) => {
      const photos = [...(p.photos || [])];
      const [moved] = photos.splice(from, 1);
      photos.splice(to, 0, moved);
      return { ...p, photos };
    });
  }

  function addSituation() {
    setPartner((p) => ({
      ...p,
      contact_situations: [
        ...p.contact_situations,
        { title: "", description: "", icon: "🏠" },
      ],
    }));
  }

  function updateSituation(index: number, field: keyof ContactSituation, value: string) {
    setPartner((p) => ({
      ...p,
      contact_situations: p.contact_situations.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    }));
  }

  function removeSituation(index: number) {
    setPartner((p) => ({
      ...p,
      contact_situations: p.contact_situations.filter((_, i) => i !== index),
    }));
  }

  function addPoint() {
    setPartner((p) => ({
      ...p,
      why_choose_us_points: [...p.why_choose_us_points, ""],
    }));
  }

  function updatePoint(index: number, value: string) {
    setPartner((p) => ({
      ...p,
      why_choose_us_points: p.why_choose_us_points.map((pt, i) =>
        i === index ? value : pt,
      ),
    }));
  }

  function removePoint(index: number) {
    setPartner((p) => ({
      ...p,
      why_choose_us_points: p.why_choose_us_points.filter((_, i) => i !== index),
    }));
  }

  function addContact() {
    setContacts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        partner_id: partner.id,
        name: "",
        role: null,
        phone: null,
        email: null,
        note: null,
        photo_url: null,
        is_primary: prev.length === 0,
        sort_order: prev.length,
      },
    ]);
  }

  function updateContact(index: number, field: string, value: unknown) {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  }

  function setPrimaryContact(index: number) {
    setContacts((prev) =>
      prev.map((c, i) => ({ ...c, is_primary: i === index })),
    );
  }

  function removeContact(index: number) {
    setContacts((prev) => {
      const newContacts = prev.filter((_, i) => i !== index);
      if (newContacts.length > 0 && !newContacts.some((c) => c.is_primary)) {
        newContacts[0].is_primary = true;
      }
      return newContacts;
    });
  }

  async function save(andSubmit = false) {
    if (andSubmit) setSubmitting(true);
    else setSaving(true);
    setMessage(null);

    const newStatus = andSubmit
      ? "valide"
      : partner.status === "refuse"
        ? "brouillon"
        : partner.status;

    try {
      const res = await fetch("/api/partners/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: partner.id,
          partner: { ...partner, status: newStatus },
          contacts,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Erreur lors de la sauvegarde" });
      } else {
        setPartner((p) => ({ ...p, status: newStatus as Partner["status"], slug: data.slug || p.slug }));
        setMessage({
          type: "success",
          text: andSubmit ? "Fiche publiée !" : "Modifications enregistrées.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau. Réessayez." });
    }

    setSaving(false);
    setSubmitting(false);
  }

  const isEditable = partner.status === "brouillon" || partner.status === "refuse" || partner.status === "valide";

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-120px)]">
      {/* Formulaire */}
      <div className={`flex-1 ${showPreview ? "hidden lg:block" : ""} lg:max-w-2xl`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Ma fiche partenaire</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[partner.status] || ""}`}>
                {STATUS_LABELS[partner.status] || partner.status}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium hover:bg-zinc-50"
          >
            {showPreview ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Formulaire
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Aperçu
              </>
            )}
          </button>
        </div>

        {message && (
          <div className={`rounded-xl p-4 mb-6 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {/* Section 1 : Mon entreprise */}
          <Section
            title="Mon entreprise"
            icon="🏢"
            open={openSections.entreprise}
            onToggle={() => toggleSection("entreprise")}
          >
            <div className="space-y-4">
              <InputField
                label="Nom de l'entreprise *"
                value={partner.name}
                onChange={(v) => updateField("name", v)}
                placeholder="Ex : EB Expertise"
                disabled={!isEditable}
              />
              <InputField
                label="Accroche / Tagline"
                value={partner.tagline || ""}
                onChange={(v) => updateField("tagline", v)}
                placeholder="Ex : Votre expert comptable de confiance à Rennes"
                disabled={!isEditable}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Catégorie</label>
                  <select
                    value={partner.category || ""}
                    onChange={(e) => updateField("category", e.target.value || null)}
                    disabled={!isEditable}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400 bg-white"
                  >
                    <option value="">Sélectionner…</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <InputField
                  label="Secteur d'activité"
                  value={partner.sector || ""}
                  onChange={(v) => updateField("sector", v)}
                  placeholder="Ex : Expert comptable"
                  disabled={!isEditable}
                />
              </div>
              <InputField
                label="Prestations / Services"
                value={partner.services || ""}
                onChange={(v) => updateField("services", v)}
                placeholder="Ex : Comptabilité, Fiscalité, Conseil"
                disabled={!isEditable}
              />
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
                <textarea
                  value={partner.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  disabled={!isEditable}
                  rows={4}
                  placeholder="Présentez votre activité en quelques lignes…"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400 resize-none"
                />
              </div>
              <InputField
                label="Zone de couverture"
                value={partner.coverage_area || ""}
                onChange={(v) => updateField("coverage_area", v)}
                placeholder="Ex : Rennes et alentours, Ille-et-Vilaine"
                disabled={!isEditable}
              />
            </div>
          </Section>

          {/* Section 2 : Mes photos */}
          <Section
            title="Mes photos"
            icon="📸"
            open={openSections.photos}
            onToggle={() => toggleSection("photos")}
            badge={`${(partner.photos || []).length} photo${(partner.photos || []).length !== 1 ? "s" : ""}`}
          >
            <div className="space-y-6">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Logo de l&apos;entreprise</label>
                <div className="flex items-center gap-4">
                  {partner.logo_url ? (
                    <div className="relative w-20 h-20 rounded-xl border border-zinc-200 overflow-hidden bg-white flex items-center justify-center">
                      <img
                        src={partner.logo_url}
                        alt="Logo"
                        className="w-full h-full object-contain p-1"
                      />
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => updateField("logo_url", null)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={!isEditable || uploading === "logo"}
                      className="w-20 h-20 border-2 border-dashed border-zinc-300 rounded-xl flex flex-col items-center justify-center gap-0.5 hover:border-zinc-400 disabled:opacity-50"
                    >
                      {uploading === "logo" ? (
                        <span className="text-xs text-zinc-500">…</span>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          <span className="text-[10px] text-zinc-400">Logo</span>
                        </>
                      )}
                    </button>
                  )}
                  <div className="text-xs text-zinc-400">
                    {partner.logo_url ? (
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={!isEditable}
                        className="text-zinc-500 hover:text-zinc-700 font-medium"
                      >
                        Changer le logo
                      </button>
                    ) : (
                      <p>JPG, PNG ou WebP — format carré recommandé</p>
                    )}
                  </div>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {/* Photo de couverture */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Photo de couverture</label>
                {partner.cover_photo ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={partner.cover_photo}
                      alt="Couverture"
                      className="w-full h-48 object-cover"
                    />
                    {isEditable && (
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="p-2 bg-white/90 rounded-lg hover:bg-white text-zinc-700 text-xs font-medium"
                        >
                          Changer
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField("cover_photo", null)}
                          className="p-2 bg-white/90 rounded-lg hover:bg-white text-red-600 text-xs font-medium"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={!isEditable || uploading === "cover"}
                    className="w-full h-48 border-2 border-dashed border-zinc-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-zinc-400 disabled:opacity-50"
                  >
                    {uploading === "cover" ? (
                      <span className="text-sm text-zinc-500">Upload en cours…</span>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-sm text-zinc-500">Ajouter une photo de couverture</span>
                        <span className="text-xs text-zinc-400">JPG, PNG ou WebP — max 5 Mo</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </div>

              {/* Galerie */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Galerie photos</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(partner.photos || []).map((photo, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-square">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      {isEditable && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {i > 0 && (
                            <button
                              type="button"
                              onClick={() => moveGalleryPhoto(i, i - 1)}
                              className="p-1.5 bg-white rounded-lg text-xs"
                            >
                              ←
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeGalleryPhoto(i)}
                            className="p-1.5 bg-white rounded-lg text-red-600 text-xs"
                          >
                            ✕
                          </button>
                          {i < (partner.photos || []).length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveGalleryPhoto(i, i + 1)}
                              className="p-1.5 bg-white rounded-lg text-xs"
                            >
                              →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {isEditable && (
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={uploading === "gallery"}
                      className="aspect-square border-2 border-dashed border-zinc-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-zinc-400 disabled:opacity-50"
                    >
                      {uploading === "gallery" ? (
                        <span className="text-xs text-zinc-500">Upload…</span>
                      ) : (
                        <>
                          <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          <span className="text-xs text-zinc-400">Ajouter</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
              </div>
            </div>
          </Section>

          {/* Section 3 : Dans quels cas nous contacter */}
          <Section
            title="Dans quels cas nous contacter"
            icon="📞"
            open={openSections.contact_situations}
            onToggle={() => toggleSection("contact_situations")}
            badge={`${partner.contact_situations.length}`}
          >
            <div className="space-y-4">
              {partner.contact_situations.map((situation, i) => (
                <div key={i} className="border border-zinc-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <select
                          value={situation.icon}
                          onChange={(e) => updateSituation(i, "icon", e.target.value)}
                          className="appearance-none bg-zinc-100 rounded-lg px-3 py-2 text-lg cursor-pointer"
                        >
                          {SITUATION_ICONS.map((ic) => (
                            <option key={ic} value={ic}>{ic}</option>
                          ))}
                        </select>
                      </div>
                      <span className="text-xs font-medium text-zinc-400">Situation {i + 1}</span>
                    </div>
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => removeSituation(i)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={situation.title}
                      onChange={(e) => updateSituation(i, "title", e.target.value)}
                      placeholder="Ex : Vous vendez un bien immobilier"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                    <textarea
                      value={situation.description}
                      onChange={(e) => updateSituation(i, "description", e.target.value)}
                      placeholder="Décrivez en quoi vous pouvez aider dans cette situation…"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                    />
                  </div>
                </div>
              ))}
              {isEditable && (
                <button
                  type="button"
                  onClick={addSituation}
                  className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-xl text-sm font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                >
                  + Ajouter une situation
                </button>
              )}
            </div>
          </Section>

          {/* Section 4 : Pourquoi nous choisir */}
          <Section
            title="Pourquoi nous choisir"
            icon="⭐"
            open={openSections.why_choose}
            onToggle={() => toggleSection("why_choose")}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Texte de présentation</label>
                <textarea
                  value={partner.why_choose_us || ""}
                  onChange={(e) => updateField("why_choose_us", e.target.value)}
                  disabled={!isEditable}
                  rows={3}
                  placeholder="Expliquez ce qui vous différencie et pourquoi les clients devraient vous faire confiance…"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Points clés</label>
                <div className="space-y-2">
                  {partner.why_choose_us_points.map((point, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-emerald-500 text-sm">✓</span>
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => updatePoint(i, e.target.value)}
                        placeholder="Ex : Plus de 15 ans d'expérience"
                        className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      />
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => removePoint(i)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditable && (
                    <button
                      type="button"
                      onClick={addPoint}
                      className="text-sm text-zinc-500 hover:text-zinc-700 font-medium"
                    >
                      + Ajouter un point clé
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Section>

          {/* Section 5 : Mes interlocuteurs */}
          <Section
            title="Mes interlocuteurs"
            icon="👥"
            open={openSections.interlocuteurs}
            onToggle={() => toggleSection("interlocuteurs")}
            badge={`${contacts.length}`}
          >
            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <div key={contact.id} className="border border-zinc-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Photo contact */}
                      <div
                        className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-100 flex-shrink-0 cursor-pointer"
                        onClick={() => contactPhotoRefs.current[index]?.click()}
                      >
                        {contact.photo_url ? (
                          <img src={contact.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
                            {uploading === `contact-${index}` ? "…" : "📷"}
                          </div>
                        )}
                        <input
                          ref={(el) => { contactPhotoRefs.current[index] = el; }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => handleContactPhotoUpload(index, e)}
                          className="hidden"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-400">Contact {index + 1}</span>
                        {contact.is_primary && (
                          <span className="text-xs bg-zinc-900 text-white px-2 py-0.5 rounded-full">Principal</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!contact.is_primary && isEditable && (
                        <button
                          type="button"
                          onClick={() => setPrimaryContact(index)}
                          className="text-xs text-zinc-500 hover:text-zinc-700"
                        >
                          Rendre principal
                        </button>
                      )}
                      {isEditable && contacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContact(index)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateContact(index, "name", e.target.value)}
                      disabled={!isEditable}
                      placeholder="Nom complet"
                      className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
                    />
                    <input
                      type="text"
                      value={contact.role || ""}
                      onChange={(e) => updateContact(index, "role", e.target.value)}
                      disabled={!isEditable}
                      placeholder="Fonction / Rôle"
                      className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
                    />
                    <input
                      type="tel"
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
                      className="sm:col-span-2 px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
                    />
                  </div>
                </div>
              ))}
              {isEditable && (
                <button
                  type="button"
                  onClick={addContact}
                  className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-xl text-sm font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                >
                  + Ajouter un interlocuteur
                </button>
              )}
            </div>
          </Section>

          {/* Section 6 : Mes liens */}
          <Section
            title="Mes liens"
            icon="🔗"
            open={openSections.liens}
            onToggle={() => toggleSection("liens")}
          >
            <div className="space-y-4">
              <InputField
                label="Site web"
                value={partner.website || ""}
                onChange={(v) => updateField("website", v)}
                placeholder="https://www.monsite.fr"
                type="url"
                disabled={!isEditable}
              />
              <InputField
                label="LinkedIn"
                value={partner.social_links.linkedin || ""}
                onChange={(v) => updateSocialLink("linkedin", v)}
                placeholder="https://www.linkedin.com/company/…"
                type="url"
                disabled={!isEditable}
              />
              <InputField
                label="Facebook"
                value={partner.social_links.facebook || ""}
                onChange={(v) => updateSocialLink("facebook", v)}
                placeholder="https://www.facebook.com/…"
                type="url"
                disabled={!isEditable}
              />
              <InputField
                label="Instagram"
                value={partner.social_links.instagram || ""}
                onChange={(v) => updateSocialLink("instagram", v)}
                placeholder="https://www.instagram.com/…"
                type="url"
                disabled={!isEditable}
              />
            </div>
          </Section>

          {/* Boutons d'action */}
          {isEditable && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
              <button
                type="button"
                onClick={() => save(false)}
                disabled={saving || submitting}
                className="flex-1 px-5 py-3 border border-zinc-200 rounded-xl text-sm font-semibold hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                {saving ? "Enregistrement…" : "Enregistrer le brouillon"}
              </button>
              <button
                type="button"
                onClick={() => save(true)}
                disabled={saving || submitting || !partner.name.trim()}
                className="flex-1 px-5 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Publication…" : "Publier la fiche"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Aperçu en direct */}
      <div className={`${showPreview ? "" : "hidden lg:block"} lg:flex-1 lg:sticky lg:top-4 lg:self-start`}>
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Aperçu de la page publique</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-xs text-zinc-400">En direct</span>
            </div>
          </div>
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
            <PartenairePreview partner={partner} contacts={contacts} />
          </div>
        </div>
      </div>
    </div>
  );
}
