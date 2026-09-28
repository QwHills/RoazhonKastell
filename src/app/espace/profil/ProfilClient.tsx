"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

export default function ProfilClient({ profile: initial }: { profile: Profile }) {
  const [firstName, setFirstName] = useState(initial.first_name);
  const [lastName, setLastName] = useState(initial.last_name);
  const [phone, setPhone] = useState(initial.phone || "");
  const [city, setCity] = useState(initial.city || "");
  const [bio, setBio] = useState(initial.bio || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        city: city || null,
        bio: bio || null,
      })
      .eq("id", initial.id);

    setSaving(false);

    if (error) {
      setMessage("Erreur lors de la sauvegarde.");
    } else {
      setMessage("Profil mis à jour.");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Mon profil</h1>
      <p className="text-zinc-500 mb-8">Modifiez vos informations personnelles.</p>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Prénom" value={firstName} onChange={setFirstName} required />
          <Field label="Nom" value={lastName} onChange={setLastName} required />
        </div>

        <Field label="Email" value={initial.email} onChange={() => {}} disabled />

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Téléphone" value={phone} onChange={setPhone} type="tel" />
          <Field label="Ville" value={city} onChange={setCity} />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Présentation</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            placeholder="Quelques mots sur vous, votre parcours, vos spécialités…"
          />
        </div>

        {message && (
          <p className={`text-sm ${message.startsWith("Erreur") ? "text-red-500" : "text-emerald-600"}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-zinc-900 text-white rounded-2xl text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>

      <div className="mt-10 pt-8 border-t border-zinc-200">
        <h2 className="text-lg font-bold text-zinc-900 mb-1">Changer le mot de passe</h2>
        <p className="text-zinc-500 text-sm mb-6">Saisissez votre nouveau mot de passe.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (newPassword.length < 6) { setPwMessage("Le mot de passe doit contenir au moins 6 caractères."); return; }
            if (newPassword !== confirmPassword) { setPwMessage("Les mots de passe ne correspondent pas."); return; }
            setPwSaving(true);
            setPwMessage("");
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            setPwSaving(false);
            if (error) {
              setPwMessage("Erreur : " + error.message);
            } else {
              setPwMessage("Mot de passe mis à jour !");
              setNewPassword("");
              setConfirmPassword("");
              setTimeout(() => setPwMessage(""), 3000);
            }
          }}
          className="space-y-4 max-w-sm"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          {pwMessage && (
            <p className={`text-sm ${pwMessage.startsWith("Erreur") || pwMessage.startsWith("Le") || pwMessage.startsWith("Les") ? "text-red-500" : "text-emerald-600"}`}>
              {pwMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={pwSaving}
            className="px-6 py-2.5 bg-zinc-900 text-white rounded-2xl text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {pwSaving ? "Mise à jour…" : "Changer le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-2xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
      />
    </div>
  );
}
