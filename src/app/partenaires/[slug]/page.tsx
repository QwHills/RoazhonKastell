import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Partner, PartnerContact, ContactSituation } from "@/lib/supabase/types";

export const revalidate = 3600;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
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
  const primaryContact = contacts.find((c) => c.is_primary) || contacts[0];
  const otherContacts = contacts.filter((c) => c !== primaryContact);
  const situations: ContactSituation[] = partner.contact_situations || [];
  const points: string[] = partner.why_choose_us_points || [];
  const photos: string[] = partner.photos || [];
  const socialLinks: Record<string, string> = partner.social_links || {};

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-zinc-50 pt-16">
        {/* Hero */}
        {partner.cover_photo ? (
          <div className="relative h-64 sm:h-80 bg-zinc-300">
            <img
              src={partner.cover_photo}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 max-w-5xl mx-auto">
              <div className="flex items-end gap-4">
                {partner.logo_url && (
                  <img
                    src={partner.logo_url}
                    alt=""
                    className="w-16 h-16 object-contain bg-white rounded-xl p-1.5 shadow-lg"
                  />
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{partner.name}</h1>
                  {partner.tagline && (
                    <p className="text-white/80 mt-1">{partner.tagline}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border-b border-zinc-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
              <div className="flex items-center gap-4">
                {partner.logo_url ? (
                  <img src={partner.logo_url} alt="" className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-zinc-400">
                    {partner.name[0]}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{partner.name}</h1>
                  {partner.tagline && (
                    <p className="text-zinc-500 mt-1">{partner.tagline}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-8">
            {partner.category && (
              <span className="text-sm px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-zinc-700">
                {partner.category}
              </span>
            )}
            {partner.sector && (
              <span className="text-sm px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-zinc-700">
                {partner.sector}
              </span>
            )}
            {partner.coverage_area && (
              <span className="text-sm px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-zinc-700">
                📍 {partner.coverage_area}
              </span>
            )}
            {partner.remuneration && (
              <span className="text-sm px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                Rémunération apporteur
              </span>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {partner.description && (
                <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                  <h2 className="font-semibold text-zinc-900 mb-3">À propos</h2>
                  <p className="text-zinc-600 leading-relaxed whitespace-pre-line">{partner.description}</p>
                </section>
              )}

              {/* Services */}
              {partner.services && (
                <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                  <h2 className="font-semibold text-zinc-900 mb-3">Nos services</h2>
                  <p className="text-zinc-600">{partner.services}</p>
                </section>
              )}

              {/* Photos */}
              {photos.length > 0 && (
                <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                  <h2 className="font-semibold text-zinc-900 mb-4">Photos</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((photo, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden">
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Situations de contact */}
              {situations.length > 0 && (
                <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                  <h2 className="font-semibold text-zinc-900 mb-4">Dans quels cas nous contacter</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {situations.map((situation, i) => (
                      <div key={i} className="flex gap-3 p-4 bg-zinc-50 rounded-xl">
                        <span className="text-2xl flex-shrink-0">{situation.icon}</span>
                        <div>
                          <p className="font-medium text-zinc-800">{situation.title}</p>
                          {situation.description && (
                            <p className="text-sm text-zinc-500 mt-1">{situation.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Pourquoi nous choisir */}
              {(partner.why_choose_us || points.length > 0) && (
                <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                  <h2 className="font-semibold text-zinc-900 mb-3">Pourquoi nous choisir</h2>
                  {partner.why_choose_us && (
                    <p className="text-zinc-600 mb-4">{partner.why_choose_us}</p>
                  )}
                  {points.length > 0 && (
                    <div className="space-y-2">
                      {points.filter((p) => p.trim()).map((point, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-zinc-700">{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contacts */}
              {contacts.length > 0 && (
                <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                  <h2 className="font-semibold text-zinc-900 mb-4">
                    {contacts.length > 1 ? "Vos interlocuteurs" : "Votre interlocuteur"}
                  </h2>
                  <div className="space-y-4">
                    {primaryContact && (
                      <div className="p-4 bg-zinc-50 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          {primaryContact.photo_url ? (
                            <img src={primaryContact.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center text-lg font-bold text-zinc-500">
                              {primaryContact.name[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-zinc-900">{primaryContact.name}</p>
                            {primaryContact.role && (
                              <p className="text-sm text-zinc-500">{primaryContact.role}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {primaryContact.phone && (
                            <a
                              href={`tel:${primaryContact.phone.replace(/\s/g, "")}`}
                              className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900"
                            >
                              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              {primaryContact.phone}
                            </a>
                          )}
                          {primaryContact.email && (
                            <a
                              href={`mailto:${primaryContact.email}`}
                              className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900 break-all"
                            >
                              <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              {primaryContact.email}
                            </a>
                          )}
                          {primaryContact.note && (
                            <p className="text-xs text-zinc-500 mt-2">{primaryContact.note}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {otherContacts.map((contact) => (
                      <div key={contact.id} className="flex items-start gap-3 px-2 py-2">
                        {contact.photo_url ? (
                          <img src={contact.photo_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-400 flex-shrink-0">
                            {contact.name[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-800">{contact.name}</p>
                          {contact.role && <p className="text-xs text-zinc-500">{contact.role}</p>}
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            {contact.phone && (
                              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="text-xs text-zinc-500 hover:text-zinc-700">
                                {contact.phone}
                              </a>
                            )}
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} className="text-xs text-zinc-500 hover:text-zinc-700 break-all">
                                {contact.email}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Liens */}
              {(partner.website || Object.values(socialLinks).some((v) => v)) && (
                <section className="bg-white rounded-2xl border border-zinc-200 p-6">
                  <h2 className="font-semibold text-zinc-900 mb-3">Liens</h2>
                  <div className="space-y-2">
                    {partner.website && (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900"
                      >
                        🌐 Site web
                      </a>
                    )}
                    {socialLinks.linkedin && (
                      <a
                        href={socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900"
                      >
                        LinkedIn
                      </a>
                    )}
                    {socialLinks.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900"
                      >
                        Facebook
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a
                        href={socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900"
                      >
                        Instagram
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* Retour à l'annuaire */}
              <Link
                href="/partenaires"
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Retour à l&apos;annuaire
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
