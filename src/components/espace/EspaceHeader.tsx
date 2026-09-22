"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

export default function EspaceHeader({ profile }: { profile: Profile }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials =
    (profile.first_name?.[0] || "").toUpperCase() +
    (profile.last_name?.[0] || "").toUpperCase();

  return (
    <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-semibold text-zinc-500">
            {initials || "?"}
          </div>
          <span className="text-sm text-zinc-600 hidden sm:block">
            {profile.first_name} {profile.last_name}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}
