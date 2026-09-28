"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CreatePartnerForm({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError("");

    const supabase = createClient();

    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .insert({
        name: name.trim(),
        category: category.trim() || null,
        status: "brouillon",
        remuneration: false,
      })
      .select("id")
      .single();

    if (partnerError || !partner) {
      setError("Erreur lors de la création : " + (partnerError?.message || ""));
      setCreating(false);
      return;
    }

    await supabase
      .from("partner_members")
      .insert({ partner_id: partner.id, user_id: userId });

    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto py-20">
      <h1 className="text-2xl font-bold text-zinc-900 mb-2 text-center">Fiche partenaire</h1>
      <p className="text-zinc-500 text-center mb-8">
        Créez votre fiche partenaire pour apparaître sur le site.
      </p>

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Nom de l&apos;entreprise *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ex : EB Expertise"
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Catégorie
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ex : Finance & Assurance"
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="w-full px-6 py-3 bg-zinc-900 text-white rounded-2xl text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {creating ? "Création…" : "Créer ma fiche"}
        </button>
      </form>
    </div>
  );
}
