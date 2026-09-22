"use client";

import { useState } from "react";

function FormulaireIAD() {
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [rsac, setRsac] = useState("");
  const [idIad, setIdIad] = useState("");
  const [fileName, setFileName] = useState("");

  const handleSubmit = () => {
    const subject = encodeURIComponent("Inscription Adhérent IAD");
    const body = encodeURIComponent(
      `Nom Prénom : ${nom}\nAdresse postale : ${adresse}\nNuméro RSAC : ${rsac}\nIdentifiant IAD : ${idIad}\n\n(Pensez à joindre votre RIB en pièce jointe)`
    );
    window.location.href = `mailto:gianni.schiariti@iadfrance.fr?subject=${subject}&body=${body}`;
  };

  return (
    <div id="form-iad" className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8">
      <h3 className="text-xl font-bold text-zinc-900">Inscription Adhérent IAD</h3>
      <p className="mt-2 text-sm text-zinc-500">Adhérent IAD ou Bureau IAD Privatif</p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Nom Prénom</label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
            placeholder="Jean Dupont"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Adresse postale</label>
          <input
            type="text"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
            placeholder="12 rue de Rennes, 35000 Rennes"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Numéro RSAC</label>
          <input
            type="text"
            value={rsac}
            onChange={(e) => setRsac(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
            placeholder="123 456 789"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Identifiant IAD</label>
          <input
            type="text"
            value={idIad}
            onChange={(e) => setIdIad(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
            placeholder="IAD-00000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">RIB (PDF ou image)</label>
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setFileName(file ? file.name : "");
            }}
            className="w-full text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 transition"
          />
          {fileName && (
            <p className="mt-1 text-xs text-zinc-500">Fichier sélectionné : {fileName}</p>
          )}
          <p className="mt-2 text-xs text-zinc-400">
            Pensez à joindre votre RIB au mail.
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-8 py-3 bg-zinc-900 text-white font-semibold rounded-2xl hover:bg-zinc-800 transition-colors"
        >
          Envoyer par email
        </button>
      </div>
    </div>
  );
}

function FormulairePartenaire() {
  const [entreprise, setEntreprise] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [metier, setMetier] = useState("");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");

  const handleSubmit = () => {
    const subject = encodeURIComponent("Inscription Partenaire");
    const body = encodeURIComponent(
      `Entreprise : ${entreprise}\nNom Prénom : ${nom}\nEmail : ${email}\nTéléphone : ${telephone}\nMétier / Catégorie : ${metier}\nMessage : ${message}\n\n(Pensez à joindre votre RIB en pièce jointe)`
    );
    window.location.href = `mailto:gianni.schiariti@iadfrance.fr?subject=${subject}&body=${body}`;
  };

  return (
    <div id="form-partenaire" className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8">
      <h3 className="text-xl font-bold text-zinc-900">Inscription Partenaire</h3>
      <p className="mt-2 text-sm text-zinc-500">Partenaire Local ou Partenaire + Bureau</p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Entreprise</label>
          <input
            type="text"
            value={entreprise}
            onChange={(e) => setEntreprise(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
            placeholder="Mon Entreprise"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Nom Prénom du contact</label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
            placeholder="Jean Dupont"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
            placeholder="contact@entreprise.fr"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Téléphone</label>
          <input
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
            placeholder="06 00 00 00 00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Métier / Catégorie</label>
          <input
            type="text"
            value={metier}
            onChange={(e) => setMetier(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
            placeholder="Courtier, Diagnostiqueur, Artisan…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Message (optionnel)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition resize-none"
            placeholder="Votre message…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">RIB (PDF ou image)</label>
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setFileName(file ? file.name : "");
            }}
            className="w-full text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 transition"
          />
          {fileName && (
            <p className="mt-1 text-xs text-zinc-500">Fichier sélectionné : {fileName}</p>
          )}
          <p className="mt-2 text-xs text-zinc-400">
            Pensez à joindre votre RIB au mail.
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-8 py-3 bg-zinc-900 text-white font-semibold rounded-2xl hover:bg-zinc-800 transition-colors"
        >
          Envoyer par email
        </button>
      </div>
    </div>
  );
}

export default function Inscriptions() {
  return (
    <section id="inscriptions" className="py-20 sm:py-28 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">Inscriptions</h2>
          <p className="mt-4 text-zinc-500 text-lg">Remplissez le formulaire correspondant à votre profil.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <FormulaireIAD />
          <FormulairePartenaire />
        </div>
      </div>
    </section>
  );
}
