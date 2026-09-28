import { Suspense } from "react";
import { fetchMembersFromSheet } from "@/lib/sheets";
import { createClient } from "@supabase/supabase-js";
import { getIadSlug } from "@/lib/iad-utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConseillersSearch from "./ConseillersSearch";
import type { UserRole } from "@/lib/supabase/types";

export const revalidate = 3600;

const SPECIAL_ROLES: UserRole[] = ["associe", "membre_executif", "gestionnaire_evenements"];

export default async function ConseillersPage() {
  const members = await fetchMembersFromSheet();
  const sorted = members.sort((a, b) =>
    a.firstName.localeCompare(b.firstName, "fr", { sensitivity: "base" }),
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data: profiles } = await supabase
    .from("profiles")
    .select("first_name, last_name, roles")
    .eq("member_status", "actif")
    .not("roles", "cs", '{"partenaire"}');

  const roleMap: Record<string, UserRole[]> = {};
  if (profiles) {
    for (const p of profiles) {
      const special = (p.roles as UserRole[]).filter((r) => SPECIAL_ROLES.includes(r));
      if (special.length > 0) {
        const slug = getIadSlug(p.first_name, p.last_name);
        roleMap[slug] = special;
      }
    }
  }

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-zinc-50 pt-16">
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                Nos conseillers
              </h1>
              <p className="mt-4 text-zinc-500 text-lg">
                Les conseillers IAD du réseau Roazhon Kastell.
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                {members.length} conseiller{members.length > 1 ? "s" : ""}
              </p>
            </div>

            <ConseillersSearch members={sorted} roleMap={roleMap} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
