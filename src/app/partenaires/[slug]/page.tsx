import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { PartnerContact, ContactSituation } from "@/lib/supabase/types";
import PartnerMiniSite from "./PartnerMiniSite";

export const revalidate = 3600;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = getAdminClient();
  const { data: partner } = await admin
    .from("partners")
    .select("name, tagline, category, status")
    .eq("slug", slug)
    .single();

  if (!partner || partner.status !== "valide") {
    return { title: "Partenaire introuvable — Roazhon Kastell" };
  }

  return {
    title: `${partner.name} — Partenaire Roazhon Kastell`,
    description:
      partner.tagline ||
      `${partner.name}, partenaire ${partner.category || ""} du réseau Roazhon Kastell à Rennes.`,
    robots: { index: true, follow: true },
  };
}

export interface PartnerData {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  category: string | null;
  sector: string | null;
  description: string | null;
  services: string | null;
  coverage_area: string | null;
  website: string | null;
  social_links: Record<string, string>;
  logo_url: string | null;
  cover_photo: string | null;
  photos: string[];
  why_choose_us: string | null;
  why_choose_us_points: string[];
  contact_situations: ContactSituation[];
  remuneration: boolean;
  contacts: PartnerContact[];
}

export default async function PartnerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = getAdminClient();

  const { data: partner } = await admin
    .from("partners")
    .select("*, partner_contacts(*)")
    .eq("slug", slug)
    .eq("status", "valide")
    .single();

  if (!partner) notFound();

  const contacts: PartnerContact[] = (partner.partner_contacts || []).sort(
    (a: PartnerContact, b: PartnerContact) => a.sort_order - b.sort_order,
  );

  const data: PartnerData = {
    id: partner.id,
    name: partner.name,
    slug: partner.slug,
    tagline: partner.tagline,
    category: partner.category,
    sector: partner.sector,
    description: partner.description,
    services: partner.services,
    coverage_area: partner.coverage_area,
    website: partner.website,
    social_links: partner.social_links || {},
    logo_url: partner.logo_url,
    cover_photo: partner.cover_photo,
    photos: partner.photos || [],
    why_choose_us: partner.why_choose_us,
    why_choose_us_points: partner.why_choose_us_points || [],
    contact_situations: partner.contact_situations || [],
    remuneration: partner.remuneration,
    contacts,
  };

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <PartnerMiniSite partner={data} />
      <Footer />
    </>
  );
}
