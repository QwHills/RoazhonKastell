"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const formules: Record<string, { nom: string; prix: string; cotisation: number }> = {
  conseiller: { nom: "Conseiller iad", prix: "19,99 €/mois", cotisation: 19.99 },
  bureau: { nom: "Bureau iad privatif", prix: "80 €/mois", cotisation: 80 },
};

function InscriptionForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formuleKey = searchParams.get("formule") || "";
  const formule = formules[formuleKey];

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    iadId: "",
    rsacNumber: "",
    rsacCity: "",
  });
  const [ribFile, setRibFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!formule) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-zinc-900 mb-4">Formule introuvable</h1>
        <p className="text-zinc-500 mb-6">La formule demandée n&apos;existe pas.</p>
        <Link href="/#adhesions" className="text-zinc-900 font-semibold underline underline-offset-4">
          Voir les formules
        </Link>
      </div>
    );
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = new FormData();
      data.append("firstName", form.firstName.trim());
      data.append("lastName", form.lastName.trim());
      data.append("email", form.email.trim());
      data.append("phone", form.phone.trim());
      data.append("iadId", form.iadId.trim());
      data.append("rsacNumber", form.rsacNumber.trim());
      data.append("rsacCity", form.rsacCity.trim());
      data.append("formule", formuleKey);
      if (ribFile) data.append("rib", ribFile);

      const res = await fetch("/api/inscription", { method: "POST", body: data });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Une erreur est survenue.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 px-5">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-3">Inscription envoyée !</h1>
        <p className="text-zinc-500 mb-2">
          Votre demande d&apos;adhésion <strong>{formule.nom}</strong> a bien été enregistrée.
        </p>
        <p className="text-zinc-500 mb-8">
          Gianni va valider votre inscription et vous faire signer votre contrat.
          Vous recevrez un email à <strong>{form.email}</strong> avec vos identifiants de connexion.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-full text-sm font-semibold hover:bg-zinc-800 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-12 sm:py-16">
      <div className="mb-8">
        <Link href="/#adhesions" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour aux formules
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
          Inscription — {formule.nom}
        </h1>
        <p className="mt-2 text-zinc-500">
          Cotisation : <strong>{formule.prix}</strong> TTC
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Prénom" required value={form.firstName} onChange={set("firstName")} />
          <Field label="Nom" required value={form.lastName} onChange={set("lastName")} />
        </div>

        <Field label="Email IAD" type="email" required value={form.email} onChange={set("email")} placeholder="prenom.nom@iadfrance.fr" />

        <Field label="Téléphone" type="tel" required value={form.phone} onChange={set("phone")} placeholder="06 XX XX XX XX" />

        <Field label="Identifiant IAD" required value={form.iadId} onChange={set("iadId")} placeholder="Votre identifiant conseiller" />

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Numéro RSAC" required value={form.rsacNumber} onChange={set("rsacNumber")} />
          <Field label="Ville du RSAC" required value={form.rsacCity} onChange={set("rsacCity")} placeholder="Ex : Rennes" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-1.5">
            RIB <span className="text-zinc-400 font-normal">(PDF ou image)</span>
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setRibFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border file:border-zinc-200 file:text-sm file:font-medium file:bg-white file:text-zinc-700 hover:file:bg-zinc-50 file:cursor-pointer file:transition-colors"
            />
          </div>
          <p className="mt-1.5 text-xs text-zinc-400">
            Nécessaire pour la mise en place de votre contrat. Formats : PDF, JPG, PNG.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Envoi en cours..." : "Envoyer ma demande d'adhésion"}
        </button>

        <p className="text-xs text-zinc-400 text-center">
          Un compte sera créé avec ces informations. Gianni validera votre inscription et vous fera signer votre contrat.
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  type = "text",
  required,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-900 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
      />
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main className="pt-[72px] min-h-screen bg-white">
        <Suspense fallback={
          <div className="max-w-2xl mx-auto px-5 py-20 text-center text-zinc-400">Chargement...</div>
        }>
          <InscriptionForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
