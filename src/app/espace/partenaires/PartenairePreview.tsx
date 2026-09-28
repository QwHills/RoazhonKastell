"use client";

import type { Partner, PartnerContact } from "@/lib/supabase/types";

export default function PartenairePreview({
  partner,
  contacts,
}: {
  partner: Partner;
  contacts: PartnerContact[];
}) {
  const primaryContact = contacts.find((c) => c.is_primary) || contacts[0];
  const otherContacts = contacts.filter((c) => c !== primaryContact);

  return (
    <div className="bg-white">
      {/* Header avec photo de couverture */}
      {partner.cover_photo ? (
        <div className="relative h-40 bg-zinc-200">
          <img
            src={partner.cover_photo}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-lg font-bold text-white">{partner.name || "Nom de l'entreprise"}</h2>
            {partner.tagline && (
              <p className="text-sm text-white/80 mt-0.5">{partner.tagline}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="px-5 pt-5">
          <div className="flex items-center gap-3">
            {partner.logo_url ? (
              <img src={partner.logo_url} alt="" className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-sm font-bold text-zinc-400">
                {(partner.name || "?")[0]}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-zinc-900">{partner.name || "Nom de l'entreprise"}</h2>
              {partner.tagline && (
                <p className="text-sm text-zinc-500">{partner.tagline}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-5 py-4 space-y-5">
        {/* Infos rapides */}
        <div className="flex flex-wrap gap-2">
          {partner.category && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">{partner.category}</span>
          )}
          {partner.sector && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">{partner.sector}</span>
          )}
          {partner.coverage_area && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">
              📍 {partner.coverage_area}
            </span>
          )}
          {partner.remuneration && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
              Rémunération apporteur
            </span>
          )}
        </div>

        {/* Description */}
        {partner.description && (
          <div>
            <p className="text-sm text-zinc-600 leading-relaxed">{partner.description}</p>
          </div>
        )}

        {/* Services */}
        {partner.services && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Services</h3>
            <p className="text-sm text-zinc-700">{partner.services}</p>
          </div>
        )}

        {/* Galerie photos */}
        {(partner.photos || []).length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Photos</h3>
            <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
              {(partner.photos || []).slice(0, 6).map((photo, i) => (
                <div key={i} className="aspect-square">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dans quels cas nous contacter */}
        {partner.contact_situations.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Dans quels cas nous contacter
            </h3>
            <div className="space-y-2.5">
              {partner.contact_situations.map((situation, i) => (
                <div key={i} className="flex gap-3 p-3 bg-zinc-50 rounded-xl">
                  <span className="text-lg flex-shrink-0">{situation.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-800">
                      {situation.title || "Titre de la situation"}
                    </p>
                    {situation.description && (
                      <p className="text-xs text-zinc-500 mt-0.5">{situation.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pourquoi nous choisir */}
        {(partner.why_choose_us || partner.why_choose_us_points.length > 0) && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Pourquoi nous choisir
            </h3>
            {partner.why_choose_us && (
              <p className="text-sm text-zinc-600 mb-3">{partner.why_choose_us}</p>
            )}
            {partner.why_choose_us_points.length > 0 && (
              <div className="space-y-1.5">
                {partner.why_choose_us_points
                  .filter((p) => p.trim())
                  .map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-zinc-700">{point}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Interlocuteurs */}
        {contacts.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              {contacts.length > 1 ? "Vos interlocuteurs" : "Votre interlocuteur"}
            </h3>

            {/* Contact principal */}
            {primaryContact && (
              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl mb-2">
                {primaryContact.photo_url ? (
                  <img src={primaryContact.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-bold text-zinc-500 flex-shrink-0">
                    {(primaryContact.name || "?")[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-900 truncate">{primaryContact.name || "Nom"}</p>
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-900 text-white rounded-full flex-shrink-0">Principal</span>
                  </div>
                  {primaryContact.role && (
                    <p className="text-xs text-zinc-500">{primaryContact.role}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-1">
                    {primaryContact.phone && (
                      <span className="text-xs text-zinc-500">{primaryContact.phone}</span>
                    )}
                    {primaryContact.email && (
                      <span className="text-xs text-zinc-500 truncate">{primaryContact.email}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Autres contacts */}
            {otherContacts.length > 0 && (
              <div className="space-y-1.5">
                {otherContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3 px-3 py-2">
                    {contact.photo_url ? (
                      <img src={contact.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-400 flex-shrink-0">
                        {(contact.name || "?")[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-800 truncate">{contact.name}</p>
                      {contact.role && (
                        <p className="text-xs text-zinc-500">{contact.role}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Liens */}
        {(partner.website || Object.values(partner.social_links || {}).some((v) => v)) && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Liens</h3>
            <div className="flex flex-wrap gap-2">
              {partner.website && (
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-zinc-100 rounded-lg text-zinc-700">
                  🌐 Site web
                </span>
              )}
              {partner.social_links?.linkedin && (
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-zinc-100 rounded-lg text-zinc-700">
                  LinkedIn
                </span>
              )}
              {partner.social_links?.facebook && (
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-zinc-100 rounded-lg text-zinc-700">
                  Facebook
                </span>
              )}
              {partner.social_links?.instagram && (
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-zinc-100 rounded-lg text-zinc-700">
                  Instagram
                </span>
              )}
            </div>
          </div>
        )}

        {/* Message si peu de contenu */}
        {!partner.description && contacts.length === 0 && partner.contact_situations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-zinc-400">
              Remplissez le formulaire pour voir l&apos;aperçu de votre page
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
