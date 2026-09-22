"use client";

import { useState } from "react";
import { evenements } from "@/data/evenements";
import type { Evenement } from "@/data/evenements";

/* ─── Icônes SVG inline ─── */

function IconCalendar() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconMapPin() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

/* ─── Carte info pratique ─── */

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 bg-white border border-zinc-200 rounded-3xl p-5">
      <div className="flex-shrink-0 w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-600">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-sm font-semibold text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

/* ─── Styles partagés ─── */

const inputCls =
  "w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition";
const labelCls = "block text-sm font-medium text-zinc-700 mb-1";
const errorCls = "mt-1 text-xs text-red-500";

/* ─── Message de confirmation (partagé) ─── */

function ConfirmationMessage({ evenement, onReset }: { evenement: Evenement; onReset: () => void }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-8 sm:p-10 text-center">
      <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h3 className="mt-6 text-xl font-bold text-zinc-900">Merci pour votre inscription !</h3>
      <p className="mt-3 text-zinc-500 leading-relaxed">
        Votre inscription au <strong>{evenement.titre}</strong> a bien été prise en compte.
        <br />
        On a hâte de vous retrouver le jour J !
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 px-6 py-3 text-sm font-semibold text-zinc-900 bg-zinc-100 rounded-2xl hover:bg-zinc-200 transition-colors"
      >
        Nouvelle inscription
      </button>
    </div>
  );
}

/* ─── Formulaire STANDARD (2 ans du Roazhon Kastell) ─── */

interface StandardFormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adherent: string;
  nbPersonnes: number;
  benevole: string;
  commentaire: string;
  consentement: boolean;
}

const initialStandardForm: StandardFormData = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  adherent: "",
  nbPersonnes: 1,
  benevole: "",
  commentaire: "",
  consentement: false,
};

function FormulaireStandard({ evenement }: { evenement: Evenement }) {
  const [form, setForm] = useState<StandardFormData>(initialStandardForm);
  const [errors, setErrors] = useState<Partial<Record<keyof StandardFormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (field: keyof StandardFormData, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof StandardFormData, string>> = {};
    if (!form.nom.trim()) e.nom = "Le nom est requis.";
    if (!form.prenom.trim()) e.prenom = "Le prénom est requis.";
    if (!form.email.trim()) e.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email invalide.";
    if (!form.adherent) e.adherent = "Merci de préciser.";
    if (form.nbPersonnes < 1) e.nbPersonnes = "Au moins 1 personne.";
    if (!form.benevole) e.benevole = "Merci de préciser.";
    if (!form.consentement) e.consentement = "Vous devez accepter pour continuer.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/inscription.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: evenement.id,
          evenement: evenement.titre,
          formType: "standard",
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          telephone: form.telephone,
          adherent: form.adherent,
          nbPersonnes: form.nbPersonnes,
          benevole: form.benevole,
          commentaire: form.commentaire,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Erreur lors de l'inscription.");
      }
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ConfirmationMessage
        evenement={evenement}
        onReset={() => { setForm(initialStandardForm); setErrors({}); setSubmitted(false); }}
      />
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8">
      <h3 className="text-xl font-bold text-zinc-900">Inscription</h3>
      <p className="mt-2 text-sm text-zinc-500">Remplissez ce formulaire pour participer à l&apos;événement.</p>

      <div className="mt-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nom <span className="text-red-400">*</span></label>
            <input type="text" value={form.nom} onChange={(e) => set("nom", e.target.value)} className={inputCls} placeholder="Dupont" />
            {errors.nom && <p className={errorCls}>{errors.nom}</p>}
          </div>
          <div>
            <label className={labelCls}>Prénom <span className="text-red-400">*</span></label>
            <input type="text" value={form.prenom} onChange={(e) => set("prenom", e.target.value)} className={inputCls} placeholder="Jean" />
            {errors.prenom && <p className={errorCls}>{errors.prenom}</p>}
          </div>
        </div>

        <div>
          <label className={labelCls}>Email <span className="text-red-400">*</span></label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="jean.dupont@email.com" />
          {errors.email && <p className={errorCls}>{errors.email}</p>}
        </div>

        <div>
          <label className={labelCls}>Téléphone (optionnel)</label>
          <input type="tel" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} className={inputCls} placeholder="06 00 00 00 00" />
        </div>

        <div>
          <label className={labelCls}>Êtes-vous adhérent ou partenaire du château ? <span className="text-red-400">*</span></label>
          <div className="flex gap-3 mt-2">
            {["Oui", "Non"].map((opt) => (
              <button key={opt} type="button" onClick={() => set("adherent", opt)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-medium border transition-colors ${form.adherent === opt ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"}`}
              >{opt}</button>
            ))}
          </div>
          {errors.adherent && <p className={errorCls}>{errors.adherent}</p>}
        </div>

        <div>
          <label className={labelCls}>Combien de personnes viendront au total, vous inclus ? <span className="text-red-400">*</span></label>
          <p className="text-xs text-zinc-400 mb-2">Indiquez le nombre total de participants, en vous comptant.</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set("nbPersonnes", Math.max(1, form.nbPersonnes - 1))}
              className="w-10 h-10 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 flex items-center justify-center hover:bg-zinc-100 transition-colors text-lg font-medium">&minus;</button>
            <span className="w-12 text-center text-lg font-bold text-zinc-900">{form.nbPersonnes}</span>
            <button type="button" onClick={() => set("nbPersonnes", Math.min(20, form.nbPersonnes + 1))}
              className="w-10 h-10 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 flex items-center justify-center hover:bg-zinc-100 transition-colors text-lg font-medium">+</button>
          </div>
          {errors.nbPersonnes && <p className={errorCls}>{errors.nbPersonnes}</p>}
        </div>

        <div>
          <label className={labelCls}>Souhaitez-vous donner un coup de main en tant que bénévole ? <span className="text-red-400">*</span></label>
          <p className="text-xs text-zinc-400 mb-2">Cela nous aidera dans l&apos;organisation de l&apos;événement.</p>
          <div className="flex gap-3 mt-1">
            {["Oui", "Non"].map((opt) => (
              <button key={opt} type="button" onClick={() => set("benevole", opt)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-medium border transition-colors ${form.benevole === opt ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"}`}
              >{opt}</button>
            ))}
          </div>
          {errors.benevole && <p className={errorCls}>{errors.benevole}</p>}
        </div>

        <div>
          <label className={labelCls}>Commentaire / précision (optionnel)</label>
          <textarea value={form.commentaire} onChange={(e) => set("commentaire", e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Une info utile à nous communiquer…" />
        </div>

        <div className="flex items-start gap-3 pt-2">
          <input type="checkbox" id="consentement-standard" checked={form.consentement} onChange={(e) => set("consentement", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 accent-zinc-900" />
          <label htmlFor="consentement-standard" className="text-xs text-zinc-500 leading-relaxed">
            J&apos;accepte que mes informations soient utilisées dans le cadre de mon inscription à cet événement. <span className="text-red-400">*</span>
          </label>
        </div>
        {errors.consentement && <p className={errorCls}>{errors.consentement}</p>}
      </div>

      {serverError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-sm text-red-600">{serverError}</p>
        </div>
      )}

      <div className="mt-8 text-center">
        <button type="button" onClick={handleSubmit} disabled={loading}
          className="px-8 py-3.5 bg-zinc-900 text-white font-semibold rounded-2xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Inscription en cours\u2026" : "Participer \u00e0 l\u2019\u00e9v\u00e9nement"}
        </button>
      </div>
    </div>
  );
}

/* ─── Formulaire PROFESSIONNEL (Forum Santé Libérale) ─── */

interface ProFormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  entreprise: string;
  consentement: boolean;
}

const initialProForm: ProFormData = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  entreprise: "",
  consentement: false,
};

function FormulaireProfessionnel({ evenement }: { evenement: Evenement }) {
  const [form, setForm] = useState<ProFormData>(initialProForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ProFormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (field: keyof ProFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof ProFormData, string>> = {};
    if (!form.nom.trim()) e.nom = "Le nom est requis.";
    if (!form.prenom.trim()) e.prenom = "Le prénom est requis.";
    if (!form.email.trim()) e.email = "L'email est requis.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email invalide.";
    if (!form.telephone.trim()) e.telephone = "Le téléphone est requis.";
    if (!form.entreprise.trim()) e.entreprise = "Le nom de l'entreprise est requis.";
    if (!form.consentement) e.consentement = "Vous devez accepter pour continuer.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/inscription.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: evenement.id,
          evenement: evenement.titre,
          formType: "professionnel",
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          telephone: form.telephone,
          entreprise: form.entreprise,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Erreur lors de l'inscription.");
      }
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ConfirmationMessage
        evenement={evenement}
        onReset={() => { setForm(initialProForm); setErrors({}); setSubmitted(false); }}
      />
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8">
      <h3 className="text-xl font-bold text-zinc-900">Inscription</h3>
      <p className="mt-2 text-sm text-zinc-500">Remplissez ce formulaire pour participer à l&apos;événement.</p>

      <div className="mt-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nom <span className="text-red-400">*</span></label>
            <input type="text" value={form.nom} onChange={(e) => set("nom", e.target.value)} className={inputCls} placeholder="Dupont" />
            {errors.nom && <p className={errorCls}>{errors.nom}</p>}
          </div>
          <div>
            <label className={labelCls}>Prénom <span className="text-red-400">*</span></label>
            <input type="text" value={form.prenom} onChange={(e) => set("prenom", e.target.value)} className={inputCls} placeholder="Jean" />
            {errors.prenom && <p className={errorCls}>{errors.prenom}</p>}
          </div>
        </div>

        <div>
          <label className={labelCls}>Email <span className="text-red-400">*</span></label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="jean.dupont@email.com" />
          {errors.email && <p className={errorCls}>{errors.email}</p>}
        </div>

        <div>
          <label className={labelCls}>Téléphone <span className="text-red-400">*</span></label>
          <input type="tel" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} className={inputCls} placeholder="06 00 00 00 00" />
          {errors.telephone && <p className={errorCls}>{errors.telephone}</p>}
        </div>

        <div>
          <label className={labelCls}>Nom de votre entreprise <span className="text-red-400">*</span></label>
          <input type="text" value={form.entreprise} onChange={(e) => set("entreprise", e.target.value)} className={inputCls} placeholder="Mon Cabinet / Mon Entreprise" />
          {errors.entreprise && <p className={errorCls}>{errors.entreprise}</p>}
        </div>

        <div className="flex items-start gap-3 pt-2">
          <input type="checkbox" id="consentement-pro" checked={form.consentement} onChange={(e) => set("consentement", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 accent-zinc-900" />
          <label htmlFor="consentement-pro" className="text-xs text-zinc-500 leading-relaxed">
            J&apos;accepte que mes informations soient utilisées dans le cadre de mon inscription à cet événement. <span className="text-red-400">*</span>
          </label>
        </div>
        {errors.consentement && <p className={errorCls}>{errors.consentement}</p>}
      </div>

      {serverError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-sm text-red-600">{serverError}</p>
        </div>
      )}

      <div className="mt-8 text-center">
        <button type="button" onClick={handleSubmit} disabled={loading}
          className="px-8 py-3.5 bg-zinc-900 text-white font-semibold rounded-2xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Inscription en cours\u2026" : "Participer \u00e0 l\u2019\u00e9v\u00e9nement"}
        </button>
      </div>
    </div>
  );
}

/* ─── Fiche Événement (réutilisable) ─── */

function FicheEvenement({ evenement }: { evenement: Evenement }) {
  const anchorId = `inscription-${evenement.id}`;

  return (
    <div>
      {/* Hero événement avec affiche */}
      <div className="relative rounded-3xl overflow-hidden bg-zinc-900 flex items-center justify-center">
        {evenement.image ? (
          <img
            src={evenement.image}
            alt={evenement.titre}
            className="w-full max-h-[500px] object-contain"
          />
        ) : (
          <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="w-16 h-16 border-2 border-zinc-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500">Visuel à venir</p>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="mt-8">
        <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">{evenement.titre}</h3>
        <p className="mt-3 text-zinc-600 leading-relaxed">{evenement.description}</p>
      </div>

      {/* Informations pratiques */}
      <div className="mt-10">
        <h4 className="text-lg font-bold text-zinc-900 mb-5">Informations pratiques</h4>
        <div className="grid sm:grid-cols-3 gap-4">
          <InfoCard icon={<IconCalendar />} label="Date" value={evenement.date} />
          <InfoCard icon={<IconClock />} label="Horaire" value={evenement.heure} />
          <InfoCard icon={<IconMapPin />} label="Lieu" value={`${evenement.lieu} — ${evenement.adresse}`} />
        </div>
      </div>

      {/* CTA vers inscription */}
      {evenement.inscriptionExterne ? (
        <div className="mt-8 text-center">
          <a
            href={evenement.inscriptionExterne}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-zinc-900 text-white font-semibold rounded-3xl hover:bg-zinc-800 transition-colors shadow-lg"
          >
            Je m&apos;inscris →
          </a>
        </div>
      ) : (
        <>
          <div className="mt-8 text-center">
            <a
              href={`#${anchorId}`}
              className="inline-block px-8 py-4 bg-zinc-900 text-white font-semibold rounded-3xl hover:bg-zinc-800 transition-colors shadow-lg"
            >
              Je m&apos;inscris
            </a>
          </div>

          {/* Formulaire */}
          <div id={anchorId} className="mt-14">
            <h4 className="text-lg font-bold text-zinc-900 mb-5">Inscription à l&apos;événement</h4>
            {evenement.formType === "professionnel" ? (
              <FormulaireProfessionnel evenement={evenement} />
            ) : (
              <FormulaireStandard evenement={evenement} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Section principale ─── */

export default function Evenements() {
  const evenementsActifs = evenements.filter((e) => e.actif);

  if (evenementsActifs.length === 0) return null;

  return (
    <section id="evenements" className="py-20 sm:py-28 bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Titre de section */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
            Événements
          </h2>
          <p className="mt-4 text-zinc-500 text-lg">
            Retrouvez les prochains événements du Roazhon Kastell.
          </p>
        </div>

        {/* Liste des événements */}
        <div className="space-y-20">
          {evenementsActifs.map((evt) => (
            <FicheEvenement key={evt.id} evenement={evt} />
          ))}
        </div>
      </div>
    </section>
  );
}
