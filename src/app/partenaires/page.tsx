import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { PartnerContact } from "@/lib/supabase/types";

export const revalidate = 3600;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

interface PartnerRow {
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
  partner_contacts: PartnerContact[];
}

export default async function PartenairesPublicPage() {
  const admin = getAdminClient();
  const { data: partners } = await admin
    .from("partners")
    .select("id, name, slug, tagline, category, sector, description, services, coverage_area, logo_url, cover_photo, remuneration, partner_contacts(id, name, role, phone, email, note, photo_url, is_primary, sort_order)")
    .eq("status", "valide")
    .order("name");

  const grouped = groupByCategory((partners || []) as PartnerRow[]);

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-zinc-50 pt-16">
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                Nos partenaires
              </h1>
              <p className="mt-4 text-zinc-500 text-lg max-w-2xl mx-auto">
                Les professionnels de confiance sélectionnés par le réseau Roazhon Kastell
                pour accompagner vos projets immobiliers.
              </p>
            </div>

            {Object.keys(grouped).length === 0 ? (
              <p className="text-center text-zinc-400 py-12">Aucun partenaire pour le moment.</p>
            ) : (
              <div className="space-y-12">
                {Object.entries(grouped).map(([category, categoryPartners]) => (
                  <div key={category}>
                    <h2 className="text-xl font-bold text-zinc-900 mb-6">{category}</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryPartners.map((partner) => (
                        <PartnerCard key={partner.id} partner={partner} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function groupByCategory(partners: PartnerRow[]): Record<string, PartnerRow[]> {
  const groups: Record<string, PartnerRow[]> = {};
  for (const p of partners) {
    const cat = p.category || "Autre";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  }
  return groups;
}

function PartnerCard({ partner }: { partner: PartnerRow }) {
  const contacts = (partner.partner_contacts || []).sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const primaryContact = contacts.find((c) => c.is_primary) || contacts[0];

  const content = (
    <>
      {partner.cover_photo && (
        <div className="h-32 bg-zinc-200">
          <img src={partner.cover_photo} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start gap-4 mb-3">
          {partner.logo_url ? (
            <img src={partner.logo_url} alt="" className="w-12 h-12 object-contain flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-lg font-bold text-zinc-400 flex-shrink-0">
              {partner.name[0]}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-900">{partner.name}</h3>
            {partner.tagline ? (
              <p className="text-sm text-zinc-500 truncate">{partner.tagline}</p>
            ) : partner.sector ? (
              <p className="text-sm text-zinc-500 truncate">{partner.sector}</p>
            ) : null}
          </div>
        </div>

        {partner.services && (
          <p className="text-sm text-zinc-600 mb-2 line-clamp-2">{partner.services}</p>
        )}

        {partner.coverage_area && (
          <p className="text-xs text-zinc-400 mb-3">📍 {partner.coverage_area}</p>
        )}

        {primaryContact && (
          <div className="border-t border-zinc-100 pt-3">
            <div className="flex items-center gap-2">
              {primaryContact.photo_url ? (
                <img src={primaryContact.photo_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-400 flex-shrink-0">
                  {primaryContact.name[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-700 truncate">{primaryContact.name}</p>
                {primaryContact.phone && (
                  <p className="text-xs text-zinc-500">{primaryContact.phone}</p>
                )}
              </div>
              {contacts.length > 1 && (
                <span className="text-xs text-zinc-400">+{contacts.length - 1}</span>
              )}
            </div>
          </div>
        )}

        {partner.remuneration && (
          <div className="mt-3 pt-3 border-t border-zinc-100">
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Rémunération apporteur
            </span>
          </div>
        )}

        {partner.slug && (
          <div className="mt-3 text-right">
            <span className="text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors">
              Voir la fiche →
            </span>
          </div>
        )}
      </div>
    </>
  );

  if (partner.slug) {
    return (
      <Link
        href={`/partenaires/${partner.slug}`}
        className="block bg-white border border-zinc-200 rounded-3xl overflow-hidden hover:shadow-lg hover:border-zinc-300 transition-all group"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden hover:shadow-lg transition-shadow">
      {content}
    </div>
  );
}
