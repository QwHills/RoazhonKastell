import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReussitesPublic from "./ReussitesPublic";

export const revalidate = 3600;

export type PublicSuccess = {
  id: string;
  type: string;
  title: string;
  story: string | null;
  origin: string;
  stage: string;
  stage_date: string | null;
  photo_url: string | null;
  featured: boolean;
  created_at: string;
  participants: {
    first_name: string;
    last_name: string;
    photo_url: string | null;
    role: string;
    is_partner: boolean;
  }[];
};

export default async function ReussitesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const [successesRes, countsRes] = await Promise.all([
    supabase
      .from("successes")
      .select(`
        id, type, title, story, origin, stage, stage_date, photo_url, featured, created_at,
        success_participants (
          role,
          user_id,
          partner_id,
          publish_consent
        )
      `)
      .eq("status", "publie")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("successes")
      .select("type")
      .eq("status", "publie"),
  ]);

  const profiles = new Map<string, { first_name: string; last_name: string; photo_url: string | null }>();
  const partners = new Map<string, { company_name: string }>();

  const rawSuccesses = successesRes.data || [];

  const userIds = rawSuccesses.flatMap((s) =>
    ((s.success_participants as Array<{ user_id: string | null }>) || [])
      .map((p) => p.user_id)
      .filter(Boolean),
  ) as string[];
  const partnerIds = rawSuccesses.flatMap((s) =>
    ((s.success_participants as Array<{ partner_id: string | null }>) || [])
      .map((p) => p.partner_id)
      .filter(Boolean),
  ) as string[];

  if (userIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, photo_url")
      .in("id", [...new Set(userIds)]);
    for (const p of data || []) profiles.set(p.id, p);
  }
  if (partnerIds.length > 0) {
    const { data } = await supabase
      .from("partners")
      .select("id, company_name")
      .in("id", [...new Set(partnerIds)]);
    for (const p of data || []) partners.set(p.id, p);
  }

  const successes: PublicSuccess[] = rawSuccesses.map((s) => ({
    id: s.id,
    type: s.type,
    title: s.title,
    story: s.story,
    origin: s.origin,
    stage: s.stage,
    stage_date: s.stage_date,
    photo_url: s.photo_url,
    featured: s.featured,
    created_at: s.created_at,
    participants: ((s.success_participants as Array<{
      role: string;
      user_id: string | null;
      partner_id: string | null;
      publish_consent: boolean;
    }>) || [])
      .filter((p) => p.publish_consent)
      .map((p) => {
        if (p.user_id && profiles.has(p.user_id)) {
          const prof = profiles.get(p.user_id)!;
          return {
            first_name: prof.first_name,
            last_name: prof.last_name,
            photo_url: prof.photo_url,
            role: p.role,
            is_partner: false,
          };
        }
        if (p.partner_id && partners.has(p.partner_id)) {
          const part = partners.get(p.partner_id)!;
          return {
            first_name: part.company_name,
            last_name: "",
            photo_url: null,
            role: p.role,
            is_partner: true,
          };
        }
        return null;
      })
      .filter(Boolean) as PublicSuccess["participants"],
  }));

  const allPublished = countsRes.data || [];
  const uniqueParticipants = new Set(
    successes.flatMap((s) => s.participants.map((p) => p.first_name + p.last_name)),
  );
  const counts = {
    total: allPublished.length,
    ventes: allPublished.filter((s) => s.type === "vente_partage").length,
    partenaires: allPublished.filter((s) => s.type === "dossier_partenaire").length,
    coups: allPublished.filter((s) => s.type === "coup_de_pouce").length,
    membres: uniqueParticipants.size,
  };

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-white pt-16">
        <ReussitesPublic successes={successes} counts={counts} />
      </main>
      <Footer />
    </>
  );
}
