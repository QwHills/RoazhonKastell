import Link from "next/link";

const conseillerPlans = [
  {
    nom: "Conseiller iad",
    phrase: "Prenez part à la vie du collectif.",
    prix: "19,99 €",
    perks: [
      "Accès au château",
      "Formations & événements",
      "Communauté iad locale",
    ],
    cta: "Devenir adhérent",
    href: "/inscription?formule=conseiller",
    featured: true,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
  {
    nom: "Bureau iad privatif",
    phrase: "Un espace dédié à votre activité.",
    prix: "80 €",
    perks: [
      "Bureau dédié au château",
      "Accès illimité",
      "Formations & événements",
    ],
    cta: "Choisir cette formule",
    href: "/inscription?formule=bureau",
    featured: false,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
];

const partenairePlans = [
  {
    nom: "Partenaire local",
    phrase: "Faites connaître votre expertise.",
    prix: "250 €",
    perks: [
      "Fiche dédiée sur le site",
      "Lien partageable aux conseillers",
      "Présentation de vos services",
      "Présence aux événements",
    ],
    cta: "Devenir partenaire",
    href: "mailto:roazhonkastell@gmail.com?subject=Demande%20de%20partenariat%20%E2%80%93%20Partenaire%20local&body=Bonjour%2C%0A%0AJe%20souhaite%20devenir%20partenaire%20local%20du%20Roazhon%20Kastell.%0A%0AMerci%20de%20me%20recontacter.%0A%0ACordialement",
    featured: false,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
      </svg>
    ),
  },
  {
    nom: "Partenaire + bureau",
    phrase: "Travaillez au cœur du collectif.",
    prix: "500 €",
    perks: [
      "Bureau privatif au château",
      "Visibilité réseau iad local",
      "Accès complet aux événements",
    ],
    cta: "Choisir cette formule",
    href: "mailto:roazhonkastell@gmail.com?subject=Demande%20de%20partenariat%20%E2%80%93%20Partenaire%20%2B%20bureau&body=Bonjour%2C%0A%0AJe%20souhaite%20devenir%20partenaire%20avec%20bureau%20au%20Roazhon%20Kastell.%0A%0AMerci%20de%20me%20recontacter.%0A%0ACordialement",
    featured: false,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
      </svg>
    ),
  },
];

function PlanCard({
  plan,
}: {
  plan: (typeof conseillerPlans)[number];
}) {
  const dark = plan.featured;
  return (
    <div
      className={`flex flex-col h-full border p-6 sm:p-7 transition-shadow hover:shadow-lg ${
        dark
          ? "border-zinc-800 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-900"
      }`}
      style={{ borderRadius: "20px" }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className={`flex-shrink-0 mt-0.5 ${dark ? "text-white" : "text-zinc-900"}`}>
          {plan.icon}
        </div>
        <div>
          <h4
            className={`font-bold ${dark ? "text-white" : "text-zinc-900"}`}
            style={{ fontSize: "18px" }}
          >
            {plan.nom}
          </h4>
          <p
            className={`mt-0.5 ${dark ? "text-zinc-400" : "text-zinc-500"}`}
            style={{ fontSize: "14px" }}
          >
            {plan.phrase}
          </p>
        </div>
      </div>

      <div
        className={`mt-3 pt-3 border-t ${dark ? "border-zinc-700" : "border-zinc-100"}`}
      >
        <span className="font-bold" style={{ fontSize: "38px", lineHeight: 1 }}>
          {plan.prix}
        </span>
        <span
          className={`ml-2 text-sm ${dark ? "text-zinc-400" : "text-zinc-500"}`}
        >
          TTC / mois
        </span>
      </div>

      <ul className="mt-6 space-y-3 flex-1">
        {plan.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2.5 text-sm">
            <svg
              className={`w-5 h-5 mt-0.5 flex-shrink-0 ${dark ? "text-emerald-400" : "text-emerald-500"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <span className={dark ? "text-zinc-300" : "text-zinc-600"}>
              {perk}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={plan.href}
        className={`mt-6 block text-center py-3.5 px-5 font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          dark
            ? "bg-white text-zinc-900 hover:bg-zinc-100 focus-visible:ring-white"
            : "bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:ring-zinc-900"
        }`}
        style={{ borderRadius: "14px" }}
      >
        {plan.cta}
      </Link>
    </div>
  );
}

export default function Adhesions() {
  return (
    <section id="adhesions" className="pt-6 sm:pt-8 pb-10 sm:pb-12 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* Intro */}
        <div className="text-center mb-12 sm:mb-14">
          <p
            className="text-xs font-semibold tracking-widest text-zinc-400 mb-4"
            style={{ letterSpacing: "0.15em" }}
          >
            REJOINDRE LE COLLECTIF
          </p>
          <h2
            className="font-bold text-zinc-900 tracking-tight"
            style={{ fontSize: "clamp(26px, 3.5vw, 40px)" }}
          >
            Votre place au Roazhon Kastell
          </h2>
          <p className="mt-3 text-zinc-500" style={{ fontSize: "clamp(15px, 1.4vw, 18px)" }}>
            Conseillers immobiliers et partenaires : choisissez la formule
            adaptée à votre activité.
          </p>
        </div>

        {/* Two groups */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Conseillers group */}
          <div
            className="flex flex-col border border-zinc-200 p-5 sm:p-6"
            style={{
              borderRadius: "24px",
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-zinc-900" style={{ fontSize: "16px" }}>
                  Pour les conseillers iad
                </h3>
                <p className="text-zinc-500 text-sm">
                  Rejoignez un collectif dynamique et développez votre activité.
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 flex-1">
              {conseillerPlans.map((plan) => (
                <PlanCard key={plan.nom} plan={plan} />
              ))}
            </div>
          </div>

          {/* Partenaires group */}
          <div
            className="flex flex-col border border-zinc-200 p-5 sm:p-6"
            style={{
              borderRadius: "24px",
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-zinc-900" style={{ fontSize: "16px" }}>
                  Pour les partenaires
                </h3>
                <p className="text-zinc-500 text-sm">
                  Développez votre visibilité et créez des opportunités au sein du réseau iad.
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 flex-1">
              {partenairePlans.map((plan) => (
                <PlanCard key={plan.nom} plan={plan} />
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
