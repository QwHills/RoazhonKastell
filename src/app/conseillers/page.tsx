import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { getIadSlug } from "@/lib/iad-utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConseillersSearch from "./ConseillersSearch";
import type { UserRole } from "@/lib/supabase/types";

export const revalidate = 3600;

export type ConseillerMember = {
  firstName: string;
  lastName: string;
  slug: string;
  roles: UserRole[];
};

export default async function ConseillersPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("first_name, last_name, roles")
    .eq("member_status", "actif")
    .not("roles", "cs", '{"partenaire"}')
    .order("first_name", { ascending: true });

  const members: ConseillerMember[] = (profiles || []).map((p) => ({
    firstName: p.first_name as string,
    lastName: p.last_name as string,
    slug: getIadSlug(p.first_name, p.last_name),
    roles: (p.roles as UserRole[]) || [],
  }));

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

            <ConseillersSearch members={members} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
