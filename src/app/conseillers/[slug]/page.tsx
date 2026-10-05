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

function iadPhoto(url: string | null, width = 320): string | null {
  if (!url) return null;
  if (url.includes("images.iadfrance.fr") && !url.includes("?")) {
    return `${url}?format=auto&width=${width}`;
  }
  return url;
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
    .select("first_name, last_name, bio, city, specialties, email, phone, photo_url")
    .eq("member_status", "actif")
    .not("roles", "cs", '{"partenaire"}')
    .not("email", "like", "%@roazhonkastell.test");

  const member = (profiles || []).find(
    (p) => getIadSlug(p.first_name, p.last_name) === slug,
  );

  if (!member) notFound();

  const profile = lookupProfile(slug);
  const dbPhoto = member.photo_url as string | null;
  const photoUrl = iadPhoto(dbPhoto)
    || (profile?.photo ? `${profile.photo}?format=auto&width=320` : null);
  const city = (member.city as string | null) || profile?.city || null;
  const bio = member.bio as string | null;
  const email = member.email as string | null;
  const phone = member.phone as string | null;
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

              {(email || phone) && (
                <div className="mt-4 flex flex-col gap-1.5 items-center sm:items-start">
                  {phone && (
                    <a href={`tel:${phone}`} className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      {phone}
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      {email}
                    </a>
                  )}
                </div>
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

          {bio && (
            <div className="mt-10 pt-8 border-t border-zinc-100">
              <h2 className="text-lg font-semibold text-zinc-900 mb-3">À propos</h2>
              <p className="text-sm text-zinc-600 leading-relaxed">{bio}</p>
            </div>
          )}

          <div className={`${bio ? "mt-6" : "mt-10"} pt-8 border-t border-zinc-100`}>
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
