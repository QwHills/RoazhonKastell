import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const revalidate = 3600;

interface PartnerContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  note: string | null;
  sort_order: number;
}

interface Partner {
  id: string;
  name: string;
  category: string | null;
  sector: string | null;
  description: string | null;
  services: string | null;
  logo_url: string | null;
  remuneration: boolean;
  partner_contacts: PartnerContact[];
}

export default async function PartenairesPublicPage() {
  const supabase = await createClient();
  const { data: partners } = await supabase
    .from("partners")
    .select("*, partner_contacts(*)")
    .eq("status", "valide")
    .order("name");

  const grouped = groupByCategory(partners || []);

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

function groupByCategory(partners: Partner[]): Record<string, Partner[]> {
  const groups: Record<string, Partner[]> = {};
  for (const p of partners) {
    const cat = p.category || "Autre";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  }
  return groups;
}

function PartnerCard({ partner }: { partner: Partner }) {
  const contacts = (partner.partner_contacts || []).sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        {partner.logo_url ? (
          <img src={partner.logo_url} alt="" className="w-12 h-12 object-contain flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-lg font-bold text-zinc-400 flex-shrink-0">
            {partner.name[0]}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-zinc-900">{partner.name}</h3>
          {partner.sector && (
            <p className="text-sm text-zinc-500">{partner.sector}</p>
          )}
        </div>
      </div>

      {partner.services && (
        <p className="text-sm text-zinc-600 mb-3">{partner.services}</p>
      )}

      {partner.description && (
        <p className="text-sm text-zinc-500 mb-4">{partner.description}</p>
      )}

      {contacts.length > 0 && (
        <div className="border-t border-zinc-100 pt-3">
          <p className="text-xs font-medium text-zinc-400 mb-2">Contacts</p>
          <div className="space-y-1.5">
            {contacts.map((c) => (
              <div key={c.id} className="text-sm">
                <span className="font-medium text-zinc-700">{c.name}</span>
                {c.note && <span className="text-zinc-400 ml-1">— {c.note}</span>}
                <div className="flex flex-wrap gap-3 text-xs text-zinc-500 mt-0.5">
                  {c.phone && (
                    <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="hover:text-zinc-900">
                      {c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="hover:text-zinc-900">
                      {c.email}
                    </a>
                  )}
                </div>
              </div>
            ))}
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
    </div>
  );
}
