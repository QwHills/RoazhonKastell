import { getCurrentUser } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Profile } from "@/lib/supabase/types";

export default async function EspacePage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">
        Bonjour {profile.first_name || ""}
      </h1>
      <p className="text-zinc-500 mb-8">
        Bienvenue dans votre espace Roazhon Kastell.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickActions profile={profile} />
      </div>
    </div>
  );
}

function QuickActions({ profile }: { profile: Profile }) {
  const roles = profile.roles;
  const cards: { label: string; description: string; href: string; color: string }[] = [];

  if (roles.includes("adherent") || roles.includes("admin")) {
    cards.push({
      label: "Partager un bien",
      description: "Collez un lien IAD pour partager une annonce.",
      href: "/espace/biens",
      color: "bg-blue-50 text-blue-700",
    });
    cards.push({
      label: "Recherches acquéreurs",
      description: "Créez ou consultez vos recherches.",
      href: "/espace/recherches",
      color: "bg-emerald-50 text-emerald-700",
    });
    cards.push({
      label: "Boîte à idées",
      description: "Proposez une idée ou soutenez celles des autres.",
      href: "/espace/idees",
      color: "bg-amber-50 text-amber-700",
    });
  }

  if (roles.includes("gestionnaire_membres") || roles.includes("admin")) {
    cards.push({
      label: "Gestion des membres",
      description: "Inviter, activer ou désactiver un membre.",
      href: "/espace/membres",
      color: "bg-violet-50 text-violet-700",
    });
  }

  if (roles.includes("gestionnaire_evenements") || roles.includes("admin")) {
    cards.push({
      label: "Gestion des événements",
      description: "Créer ou modifier un événement.",
      href: "/espace/evenements",
      color: "bg-rose-50 text-rose-700",
    });
  }

  if (roles.includes("partenaire")) {
    cards.push({
      label: "Ma fiche partenaire",
      description: "Complétez et soumettez votre fiche.",
      href: "/espace/partenaires",
      color: "bg-teal-50 text-teal-700",
    });
  }

  cards.push({
    label: "Mon profil",
    description: "Modifiez vos informations personnelles.",
    href: "/espace/profil",
    color: "bg-zinc-100 text-zinc-700",
  });

  return (
    <>
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="block p-6 bg-white border border-zinc-200 rounded-2xl hover:shadow-md transition-shadow"
        >
          <div className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold mb-3 ${card.color}`}>
            {card.label}
          </div>
          <p className="text-sm text-zinc-500">{card.description}</p>
        </Link>
      ))}
    </>
  );
}
