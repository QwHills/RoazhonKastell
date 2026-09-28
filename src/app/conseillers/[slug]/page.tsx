import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getIadSlug, buildIadMiniSiteUrl, getInitials } from "@/lib/iad-utils";
import PROFILES from "@/data/conseillers-profiles";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const revalidate = 3600;

function lookupProfile(slug: string) {
  if (slug in PROFILES) return PROFILES[slug];
  const canonical = slug.replace(/-/g, "");
  for (const [key, value] of Object.entries(PROFILES)) {
    if (key.replace(/-/g, "") === canonical) return value;
  }
  return undefined;
}

export default async function ConseillerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("member_status", "actif")
    .not("roles", "cs", '{"partenaire"}');

  const member = (profiles || []).find(
    (p) => getIadSlug(p.first_name, p.last_name) === slug,
  );

  if (!member) notFound();

  const profile = lookupProfile(slug);
  const photoUrl = profile?.photo
    ? `${profile.photo}?format=auto&width=320`
    : null;
  const city = profile?.city;
  const initials = getInitials(member.first_name, member.last_name);
  const miniSiteUrl = buildIadMiniSiteUrl(member.first_name, member.last_name);

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-zinc-50 pt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <Link
          href="/conseillers"
          className="text-sm text-zinc-400 hover:text-zinc-600 mb-8 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Tous les conseillers
        </Link>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="w-32 h-32 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`${member.first_name} ${member.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-zinc-400">{initials}</span>
              )}
            </div>

            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl font-bold text-zinc-900">
                {member.first_name} {member.last_name}
              </h1>
              <p className="text-zinc-500 mt-1">Conseiller immobilier IAD France</p>

              {city && (
                <p className="text-sm text-zinc-400 mt-2 flex items-center gap-1.5 justify-center sm:justify-start">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {city}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3 justify-center sm:justify-start">
                <a
                  href={miniSiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-zinc-900 text-white rounded-2xl text-sm font-semibold hover:bg-zinc-800 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Voir le mini-site IAD
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-zinc-100">
            <h2 className="text-lg font-semibold text-zinc-900 mb-3">Réseau</h2>
            <p className="text-sm text-zinc-600">
              Membre du réseau <strong>Roazhon Kastell</strong>, un collectif de conseillers immobiliers
              IAD France basés dans la métropole rennaise et ses alentours.
            </p>
          </div>
        </div>
      </div>
    </main>
      <Footer />
    </>
  );
}
