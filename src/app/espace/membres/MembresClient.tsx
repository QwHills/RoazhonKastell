"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole, MemberStatus } from "@/lib/supabase/types";

const ROLE_LABELS: Record<UserRole, string> = {
  adherent: "Adhérent",
  partenaire: "Partenaire",
  gestionnaire_membres: "Gestion membres",
  gestionnaire_evenements: "Gestion événements",
  membre_executif: "Membre exécutif",
  associe: "Associé",
  admin: "Administrateur",
};

const STATUS_LABELS: Record<MemberStatus, string> = {
  actif: "Actif",
  inactif: "Inactif",
  en_attente: "En attente",
};

const STATUS_COLORS: Record<MemberStatus, string> = {
  actif: "bg-emerald-100 text-emerald-700",
  inactif: "bg-zinc-100 text-zinc-500",
  en_attente: "bg-amber-100 text-amber-700",
};

const ALL_ROLES: UserRole[] = [
  "adherent",
  "partenaire",
  "gestionnaire_membres",
  "gestionnaire_evenements",
  "membre_executif",
  "associe",
  "admin",
];

export default function MembresClient({
  members: initialMembers,
}: {
  members: Profile[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");

  const filtered = members
    .filter((m) => {
      const name = `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase();
      const matchesSearch = search === "" || name.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "" || m.member_status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const statusOrder: Record<string, number> = { en_attente: 0, actif: 1, inactif: 2 };
      const sa = statusOrder[a.member_status] ?? 1;
      const sb = statusOrder[b.member_status] ?? 1;
      if (sa !== sb) return sa - sb;
      const firstA = (a.first_name || "").toLowerCase();
      const firstB = (b.first_name || "").toLowerCase();
      if (firstA !== firstB) return firstA.localeCompare(firstB, "fr");
      return (a.last_name || "").toLowerCase().localeCompare((b.last_name || "").toLowerCase(), "fr");
    });

  const counts = {
    total: members.length,
    actif: members.filter((m) => m.member_status === "actif").length,
    en_attente: members.filter((m) => m.member_status === "en_attente").length,
    inactif: members.filter((m) => m.member_status === "inactif").length,
  };

  const totalCotisations = members
    .filter((m) => m.member_status === "actif" && m.cotisation_mensuelle)
    .reduce((sum, m) => sum + (m.cotisation_mensuelle || 0), 0);

  async function updateMember(id: string, updates: Partial<Profile>) {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update(updates).eq("id", id);
    if (error) {
      alert("Erreur : " + error.message);
      return;
    }
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    );
    setEditingId(null);
  }

  async function deleteMember(id: string) {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    const confirmed = confirm(
      `Supprimer définitivement ${member.first_name} ${member.last_name} (${member.email}) ?\n\nCette action est irréversible.`,
    );
    if (!confirmed) return;

    const res = await fetch("/api/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    const data = await res.json();
    if (data.error) {
      alert("Erreur : " + data.error);
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setEditingId(null);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMessage("");

    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        firstName: inviteFirstName,
        lastName: inviteLastName,
      }),
    });

    const data = await res.json();
    setInviteLoading(false);

    if (data.error) {
      setInviteMessage("Erreur : " + data.error);
    } else {
      setInviteMessage("Invitation envoyée !");
      setInviteEmail("");
      setInviteFirstName("");
      setInviteLastName("");
      setTimeout(() => {
        setInviteOpen(false);
        setInviteMessage("");
        window.location.reload();
      }, 1500);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Gestion des membres</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {counts.actif} actif{counts.actif > 1 ? "s" : ""} · {counts.en_attente} en attente · {counts.inactif} inactif{counts.inactif > 1 ? "s" : ""}
          </p>
          {totalCotisations > 0 && (
            <p className="text-sm font-medium text-emerald-600 mt-1">
              {totalCotisations.toLocaleString("fr-FR")} € / mois de cotisations
            </p>
          )}
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="px-5 py-2.5 bg-zinc-900 text-white rounded-2xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
        >
          Inviter un membre
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher par nom ou email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MemberStatus | "")}
          className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="en_attente">En attente</option>
          <option value="inactif">Inactifs</option>
        </select>
      </div>

      {/* Members list */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center text-zinc-400 py-12">Aucun membre trouvé.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filtered.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isEditing={editingId === member.id}
                onEdit={() => setEditingId(member.id)}
                onCancel={() => setEditingId(null)}
                onSave={(updates) => updateMember(member.id, updates)}
                onDelete={() => deleteMember(member.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setInviteOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">Inviter un membre</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              {inviteMessage && (
                <p className={`text-sm ${inviteMessage.startsWith("Erreur") ? "text-red-500" : "text-emerald-600"}`}>
                  {inviteMessage}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {inviteLoading ? "Envoi…" : "Envoyer l'invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MemberRow({
  member,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  member: Profile;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (updates: Partial<Profile>) => void;
  onDelete: () => void;
}) {
  const [roles, setRoles] = useState<UserRole[]>(member.roles);
  const [status, setStatus] = useState<MemberStatus>(member.member_status);
  const [cotisation, setCotisation] = useState<string>(
    member.cotisation_mensuelle != null ? String(member.cotisation_mensuelle) : "",
  );
  const [dateAdhesion, setDateAdhesion] = useState<string>(member.date_adhesion || "");
  const [jourPrelevement, setJourPrelevement] = useState<string>(
    member.jour_prelevement != null ? String(member.jour_prelevement) : "",
  );

  function toggleRole(role: UserRole) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-zinc-900">
              {member.first_name} {member.last_name}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[member.member_status]}`}>
              {STATUS_LABELS[member.member_status]}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">{member.email}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {!isEditing && member.roles.map((role) => (
              <span key={role} className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs">
                {ROLE_LABELS[role]}
              </span>
            ))}
            {!isEditing && member.cotisation_mensuelle != null && member.cotisation_mensuelle > 0 && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
                {member.cotisation_mensuelle} € / mois
                {member.jour_prelevement && ` (le ${member.jour_prelevement})`}
              </span>
            )}
            {!isEditing && member.date_adhesion && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-xs">
                Depuis le {new Date(member.date_adhesion).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>
          {!isEditing && (member.iad_id || member.rsac_number || member.rib_url) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {member.iad_id && (
                <span className="px-2 py-0.5 bg-zinc-50 text-zinc-500 rounded-lg text-xs">
                  IAD : {member.iad_id}
                </span>
              )}
              {member.rsac_number && (
                <span className="px-2 py-0.5 bg-zinc-50 text-zinc-500 rounded-lg text-xs">
                  RSAC : {member.rsac_number}{member.rsac_city ? ` (${member.rsac_city})` : ""}
                </span>
              )}
              {member.rib_url && (
                <a
                  href={member.rib_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 bg-violet-50 text-violet-600 rounded-lg text-xs font-medium hover:bg-violet-100 transition-colors"
                >
                  Voir le RIB
                </a>
              )}
            </div>
          )}
        </div>
        {!isEditing && (
          <button
            onClick={onEdit}
            className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors flex-shrink-0"
          >
            Modifier
          </button>
        )}
      </div>

      {isEditing && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-2">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MemberStatus)}
              className="px-3 py-2 rounded-xl border border-zinc-200 text-sm bg-white"
            >
              <option value="en_attente">En attente</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
          {member.roles.includes("partenaire") ? (
            <div className="mb-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-sm text-zinc-600">
                La cotisation de ce partenaire se gère depuis la page{" "}
                <a href="/espace/partenaires" className="text-blue-600 font-medium hover:underline">Partenaires</a>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Cotisation (€/mois)</label>
                <select
                  value={cotisation}
                  onChange={(e) => setCotisation(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-zinc-200 text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">Aucune</option>
                  <option value="19.99">19,99 €</option>
                  <option value="40">40 €</option>
                  <option value="80">80 €</option>
                  <option value="100">100 €</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Jour de prélèvement</label>
                <select
                  value={jourPrelevement}
                  onChange={(e) => setJourPrelevement(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-zinc-200 text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">Non défini</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>Le {d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Date d&apos;adhésion</label>
                <input
                  type="date"
                  value={dateAdhesion}
                  onChange={(e) => setDateAdhesion(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-zinc-200 text-sm w-full focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>
          )}
          {member.rib_url && (
            <div className="mb-4 p-3 bg-violet-50 rounded-xl flex items-center gap-3">
              <span className="text-sm text-zinc-700">RIB du membre :</span>
              <a
                href={member.rib_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-violet-600 hover:underline"
              >
                Télécharger le RIB
              </a>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-2">Rôles</label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    roles.includes(role)
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-zinc-200 rounded-xl text-sm hover:bg-zinc-50"
            >
              Annuler
            </button>
            <button
              onClick={() => onSave({
                roles,
                member_status: status,
                cotisation_mensuelle: cotisation ? parseFloat(cotisation) : null,
                date_adhesion: dateAdhesion || null,
                jour_prelevement: jourPrelevement ? parseInt(jourPrelevement) : null,
              })}
              className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800"
            >
              Enregistrer
            </button>
            <button
              onClick={onDelete}
              className="ml-auto px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
