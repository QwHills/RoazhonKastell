"use client";

import { useState } from "react";

const FORMULES = [
  { value: "journee", label: "Journée complète — 300 € TTC" },
  { value: "demi-journee", label: "Demi-journée (à partir de 14h) — 200 € TTC" },
  { value: "week-end", label: "Week-end complet — 500 € TTC" },
  { value: "salle-reunion", label: "Salle de réunion — 150 € TTC / jour" },
];

interface FormData {
  formule: string;
  dateDebut: string;
  dateFin: string;
  objet: string;
  nbPersonnes: string;
  isAdherent: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  societe: string;
  siret: string;
  besoins: string;
}

const INITIAL: FormData = {
  formule: "",
  dateDebut: "",
  dateFin: "",
  objet: "",
  nbPersonnes: "",
  isAdherent: "non",
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  adresse: "",
  codePostal: "",
  ville: "",
  societe: "",
  siret: "",
  besoins: "",
};

export default function LocationForm() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  function set(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMessage("");

    const res = await fetch("/api/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSending(false);

    if (data.error) {
      setMessage("Erreur : " + data.error);
    } else {
      setMessage("Demande envoyée ! Votre demande sera étudiée par le bureau de l'association pour validation.");
      setForm(INITIAL);
    }
  }

  const showDateFin = form.formule === "week-end";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Formule & dates */}
      <fieldset className="border border-zinc-200 rounded-2xl p-6">
        <legend className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-900 px-2">
          Réservation
        </legend>
        <div className="space-y-4 mt-2">
          <Field label="Formule souhaitée" required>
            <select
              value={form.formule}
              onChange={set("formule")}
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="">Sélectionnez une formule</option>
              {FORMULES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>

          <div className={`grid gap-4 ${showDateFin ? "sm:grid-cols-2" : ""}`}>
            <Field label={showDateFin ? "Date de début" : "Date souhaitée"} required>
              <input
                type="date"
                value={form.dateDebut}
                onChange={set("dateDebut")}
                required
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </Field>
            {showDateFin && (
              <Field label="Date de fin" required>
                <input
                  type="date"
                  value={form.dateFin}
                  onChange={set("dateFin")}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </Field>
            )}
          </div>

          <Field label="Objet de la location (type d'événement)" required>
            <input
              type="text"
              value={form.objet}
              onChange={set("objet")}
              required
              placeholder="Ex : Séminaire d'entreprise, formation, réception…"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nombre de personnes attendues" required>
              <input
                type="number"
                min="1"
                value={form.nbPersonnes}
                onChange={set("nbPersonnes")}
                required
                placeholder="Ex : 25"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </Field>
            <Field label="Êtes-vous adhérent Roazhon Kastell ?">
              <select
                value={form.isAdherent}
                onChange={set("isAdherent")}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="non">Non</option>
                <option value="oui">Oui</option>
              </select>
            </Field>
          </div>
        </div>
      </fieldset>

      {/* Identité du locataire */}
      <fieldset className="border border-zinc-200 rounded-2xl p-6">
        <legend className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-900 px-2">
          Identité du locataire
        </legend>
        <div className="space-y-4 mt-2">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nom" required>
              <input
                type="text"
                value={form.nom}
                onChange={set("nom")}
                required
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </Field>
            <Field label="Prénom" required>
              <input
                type="text"
                value={form.prenom}
                onChange={set("prenom")}
                required
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </Field>
            <Field label="Téléphone" required>
              <input
                type="tel"
                value={form.telephone}
                onChange={set("telephone")}
                required
                placeholder="06 12 34 56 78"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </Field>
          </div>

          <Field label="Adresse postale" required>
            <input
              type="text"
              value={form.adresse}
              onChange={set("adresse")}
              required
              placeholder="12 rue de la Paix"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Code postal" required>
              <input
                type="text"
                value={form.codePostal}
                onChange={set("codePostal")}
                required
                placeholder="35000"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </Field>
            <Field label="Ville" required>
              <input
                type="text"
                value={form.ville}
                onChange={set("ville")}
                required
                placeholder="Rennes"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Société / Organisation">
              <input
                type="text"
                value={form.societe}
                onChange={set("societe")}
                placeholder="Facultatif"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </Field>
            <Field label="N° SIRET">
              <input
                type="text"
                value={form.siret}
                onChange={set("siret")}
                placeholder="Facultatif"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </Field>
          </div>
        </div>
      </fieldset>

      {/* Besoins */}
      <fieldset className="border border-zinc-200 rounded-2xl p-6">
        <legend className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-900 px-2">
          Informations complémentaires
        </legend>
        <div className="mt-2">
          <Field label="Besoins particuliers ou remarques">
            <textarea
              value={form.besoins}
              onChange={set("besoins")}
              rows={4}
              placeholder="Équipements spécifiques, aménagement souhaité, horaires précis…"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </Field>
        </div>
      </fieldset>

      {message && (
        <p
          className={`text-sm text-center ${
            message.startsWith("Erreur") ? "text-red-500" : "text-emerald-600"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full py-3.5 bg-zinc-900 text-white rounded-2xl text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
      >
        {sending ? "Envoi en cours…" : "Envoyer ma demande de réservation"}
      </button>

      <p className="text-xs text-zinc-400 text-center leading-relaxed">
        En soumettant ce formulaire, vous acceptez d&apos;être contacté par Roazhon Kastell
        pour l&apos;établissement d&apos;une convention de mise à disposition.
      </p>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
