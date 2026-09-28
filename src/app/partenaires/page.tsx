import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { PartnerContact } from "@/lib/supabase/types";
import PartenairesClient from "./PartenairesClient";

export const revalidate = 3600;

export const metadata = {
  title: "Nos partenaires — Roazhon Kastell",
  description:
    "Les professionnels de confiance sélectionnés par le réseau Roazhon Kastell pour accompagner vos projets immobiliers à Rennes.",
};

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export interface PartnerRow {
  id: string;
  name: string;
  slug: string | null;
  tagline: string | null;
  category: string | null;
  sector: string | null;
  description: string | null;
  services: string | null;
  coverage_area: string | null;
  logo_url: string | null;
  cover_photo: string | null;
  remuneration: boolean;
  contact_situations: { title: string; description: string; icon: string }[];
  partner_contacts: PartnerContact[];
}

export default async function PartenairesPublicPage() {
  const admin = getAdminClient();
  const { data: partners } = await admin
    .from("partners")
    .select(
      "id, name, slug, tagline, category, sector, description, services, coverage_area, logo_url, cover_photo, remuneration, contact_situations, partner_contacts(id, name, role, phone, email, note, photo_url, is_primary, sort_order)",
    )
    .eq("status", "valide")
    .order("name");

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <PartenairesClient partners={(partners || []) as PartnerRow[]} />
      <Footer />
    </>
  );
}
