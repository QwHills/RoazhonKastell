"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { PartnerData } from "./page";

export default function PartnerMiniSite({ partner }: { partner: PartnerData }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const contacts = partner.contacts;
  const primaryContact = contacts.find((c) => c.is_primary) || contacts[0];
  const situations = partner.contact_situations;
  const points = partner.why_choose_us_points.filter((p) => p.trim());
  const photos = partner.photos;
  const socialLinks = partner.social_links;

  const hasPresentation = !!(partner.description || partner.services || partner.why_choose_us || points.length > 0);
  const hasBesoins = situations.length > 0;
  const hasContacts = contacts.length > 0;

  const sections = useMemo(() => {
    const s: { id: string; label: string }[] = [];
    if (hasPresentation) s.push({ id: "presentation", label: "Présentation" });
    if (hasBesoins) s.push({ id: "besoins", label: "Vos besoins" });
    if (hasContacts) s.push({ id: "contacts", label: "Contacts" });
    return s;
  }, [hasPresentation, hasBesoins, hasContacts]);

  return (
    <main className="min-h-screen bg-white pt-16">
      {/* Fil d'Ariane */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <nav aria-label="Fil d'Ariane" className="text-sm text-zinc-400">
          <Link href="/partenaires" className="hover:text-zinc-600 transition-colors">
            Partenaires
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-700 font-medium">{partner.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-4 mb-4">
              {partner.logo_url ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-zinc-200 bg-white p-2 flex items-center justify-center flex-shrink-0">
                  <img src={partner.logo_url} alt="" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-100 flex items-center justify-center text-2xl font-bold text-zinc-400 flex-shrink-0">
                  {partner.name[0]}
                </div>
              )}
              <div className="min-w-0 pt-1">
                {partner.category && (
                  <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 mb-2">
                    {partner.category}
                  </span>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 leading-tight">
                  {partner.name}
                </h1>
                {partner.tagline && (
                  <p className="text-zinc-500 mt-1 text-lg">{partner.tagline}</p>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mt-5">
              {hasContacts && (
                <a
                  href="#contacts"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-full text-sm font-semibold hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Contacter l&apos;équipe
                </a>
              )}
              {partner.website && (
                <a
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-200 rounded-full text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Site internet
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Photo de couverture */}
          {partner.cover_photo && (
            <div className="w-full lg:w-[400px] flex-shrink-0 rounded-2xl overflow-hidden">
              <img
                src={partner.cover_photo}
                alt={`${partner.name}`}
                className="w-full h-56 lg:h-64 object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* Navigation par ancres */}
      {sections.length > 1 && (
        <div className="border-b border-zinc-200 sticky top-16 bg-white/95 backdrop-blur-sm z-10">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Sections">
            <div className="flex gap-8 overflow-x-auto">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="py-3 text-sm font-medium text-zinc-500 hover:text-zinc-900 border-b-2 border-transparent hover:border-zinc-900 transition-colors whitespace-nowrap"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-14">
        {/* Situations de contact */}
        {hasBesoins && (
          <section id="besoins">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-6">
              Dans quels cas nous contacter ?
            </h2>
            <div
              className={`grid gap-4 ${
                situations.length === 1
                  ? "grid-cols-1 max-w-md"
                  : situations.length === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {situations.map((situation, i) => (
                <div
                  key={i}
                  className="bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl mb-3">
                    {situation.icon}
                  </div>
                  <h3 className="font-semibold text-zinc-900 mb-1">{situation.title}</h3>
                  {situation.description && (
                    <p className="text-sm text-zinc-500 leading-relaxed">{situation.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Présentation */}
        {hasPresentation && (
          <section id="presentation" className="space-y-10">
            {/* Description + Pourquoi nous choisir */}
            {(partner.description || partner.why_choose_us || points.length > 0) && (
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 min-w-0">
                  {(partner.why_choose_us || partner.description) && (
                    <>
                      <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-4">
                        {partner.why_choose_us ? "Un accompagnement à chaque étape" : "À propos"}
                      </h2>
                      <p className="text-zinc-600 leading-relaxed whitespace-pre-line">
                        {partner.why_choose_us || partner.description}
                      </p>
                      {partner.why_choose_us && partner.description && (
                        <p className="text-zinc-600 leading-relaxed whitespace-pre-line mt-4">
                          {partner.description}
                        </p>
                      )}
                    </>
                  )}

                  {points.length > 0 && (
                    <div className="mt-6 space-y-2.5">
                      {points.map((point, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <svg
                            className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-zinc-700">{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Photos miniatures à côté */}
                {photos.length > 0 && (
                  <div className="flex gap-2 lg:w-72 flex-shrink-0">
                    {photos.slice(0, 2).map((photo, i) => (
                      <button
                        key={i}
                        onClick={() => setLightboxIdx(i)}
                        className="flex-1 rounded-xl overflow-hidden aspect-[4/5] focus-visible:ring-2 focus-visible:ring-emerald-500"
                        aria-label={`Voir la photo ${i + 1}`}
                      >
                        <img
                          src={photo}
                          alt=""
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Services */}
            {partner.services && (
              <div>
                <h3 className="font-semibold text-zinc-900 mb-3">Nos services</h3>
                <div className="flex flex-wrap gap-2">
                  {partner.services.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                    <span
                      key={s}
                      className="text-sm px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Galerie complète */}
            {photos.length > 2 && (
              <div>
                <h3 className="font-semibold text-zinc-900 mb-4">Photos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIdx(i)}
                      className="aspect-[4/3] rounded-xl overflow-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                      aria-label={`Voir la photo ${i + 1}`}
                    >
                      <img
                        src={photo}
                        alt=""
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Contacts */}
        {hasContacts && (
          <section id="contacts">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-6">
              Vos interlocuteurs
            </h2>
            <div
              className={`grid gap-4 ${
                contacts.length === 1
                  ? "grid-cols-1 max-w-md"
                  : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              {/* Contact principal en premier */}
              {primaryContact && (
                <ContactCard contact={primaryContact} isPrimary />
              )}
              {contacts
                .filter((c) => c !== primaryContact)
                .map((contact) => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
            </div>
          </section>
        )}

        {/* Liens / Réseaux */}
        {(partner.website || Object.values(socialLinks).some((v) => v) || partner.remuneration) && (
          <section className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-200">
            {partner.website && (
              <a
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                Site web
              </a>
            )}
            {socialLinks.linkedin && (
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                LinkedIn
              </a>
            )}
            {socialLinks.facebook && (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Facebook
              </a>
            )}
            {socialLinks.instagram && (
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Instagram
              </a>
            )}
            {partner.remuneration && (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 text-sm text-emerald-700 font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Rémunération apporteur
              </span>
            )}
          </section>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && photos.length > 0 && (
        <Lightbox
          photos={photos}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx((lightboxIdx - 1 + photos.length) % photos.length)}
          onNext={() => setLightboxIdx((lightboxIdx + 1) % photos.length)}
        />
      )}
    </main>
  );
}

function ContactCard({
  contact,
  isPrimary = false,
}: {
  contact: PartnerData["contacts"][number];
  isPrimary?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${isPrimary ? "border-zinc-300 bg-zinc-50" : "border-zinc-200 bg-white"}`}>
      <div className="flex items-center gap-4 mb-4">
        {contact.photo_url ? (
          <img
            src={contact.photo_url}
            alt={contact.name}
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-zinc-200 flex items-center justify-center text-xl font-bold text-zinc-500 flex-shrink-0">
            {contact.name[0]}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-zinc-900">{contact.name}</p>
          {contact.role && (
            <p className="text-sm text-zinc-500">{contact.role}</p>
          )}
          {contact.note && (
            <p className="text-xs text-zinc-400 mt-0.5">{contact.note}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {contact.phone && (
          <a
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Appeler
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Écrire
          </a>
        )}
      </div>
    </div>
  );
}

function Lightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Galerie photos"
    >
      {/* Fermer */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
        aria-label="Fermer la galerie"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 p-2 text-white/80 hover:text-white transition-colors"
            aria-label="Photo précédente"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 p-2 text-white/80 hover:text-white transition-colors"
            aria-label="Photo suivante"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Image */}
      <div className="max-w-4xl max-h-[85vh] px-12" onClick={(e) => e.stopPropagation()}>
        <img
          src={photos[index]}
          alt=""
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
      </div>

      {/* Indicateur */}
      {photos.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          {index + 1} / {photos.length}
        </div>
      )}
    </div>
  );
}
