"use client";

import { useState, useRef } from "react";
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
  const [photoUrl, setPhotoUrl] = useState(initial.photo_url || "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = `${(firstName || "")[0] || ""}${(lastName || "")[0] || ""}`.toUpperCase();

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoMessage("Veuillez sélectionner une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoMessage("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    setPhotoUploading(true);
    setPhotoMessage("");

    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/profile/photo", { method: "POST", body });
    const data = await res.json();

    setPhotoUploading(false);

    if (!res.ok) {
      setPhotoMessage(data.error || "Erreur lors de l'envoi de la photo.");
    } else {
      setPhotoUrl(`${data.url}?t=${Date.now()}`);
      setPhotoMessage("Photo mise à jour !");
      setTimeout(() => setPhotoMessage(""), 3000);
    }
  }

  async function handleRemovePhoto() {
    setPhotoUploading(true);
    setPhotoMessage("");

    await fetch("/api/profile/photo", { method: "DELETE" });

    setPhotoUrl("");
    setPhotoUploading(false);
    setPhotoMessage("Photo supprimée.");
    setTimeout(() => setPhotoMessage(""), 3000);
  }

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

      {/* Photo de profil */}
      <div className="mb-8 flex items-center gap-6">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {photoUrl ? (
              <img src={photoUrl} alt="Photo de profil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-zinc-400">{initials}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoUploading}
            className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-700">Photo de profil</p>
          <p className="text-xs text-zinc-400 mt-0.5">JPG, PNG. 5 Mo max.</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="text-xs font-medium text-zinc-900 hover:text-zinc-600 transition-colors disabled:opacity-50"
            >
              {photoUploading ? "Envoi…" : "Changer la photo"}
            </button>
            {photoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={photoUploading}
                className="text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                Supprimer
              </button>
            )}
          </div>
          {photoMessage && (
            <p className={`text-xs mt-1 ${photoMessage.startsWith("Erreur") ? "text-red-500" : "text-emerald-600"}`}>
              {photoMessage}
            </p>
          )}
        </div>
      </div>

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
