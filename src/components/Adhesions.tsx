const plans = [
  {
    nom: "Adhérent IAD",
    prix: "19,99€",
    periode: "TTC / mois",
    perks: [
      "Accès au château",
      "Formations & événements",
      "Communauté IAD locale",
    ],
    cta: "Je m'inscris",
    href: "#form-iad",
    featured: true,
  },
  {
    nom: "Bureau IAD Privatif",
    prix: "80€",
    periode: "TTC / mois",
    perks: [
      "Bureau dédié au château",
      "Accès illimité",
      "Formations & événements",
    ],
    cta: "Je m'inscris",
    href: "#form-iad",
    featured: false,
  },
  {
    nom: "Partenaire Local",
    prix: "250€",
    periode: "TTC / mois",
    perks: [
      "Visibilité réseau IAD local",
      "Présence événements",
      "Mise en relation conseillers",
    ],
    cta: "Je m'inscris",
    href: "#form-partenaire",
    featured: false,
  },
  {
    nom: "Partenaire + Bureau",
    prix: "500€",
    periode: "TTC / mois",
    perks: [
      "Bureau privatif au château",
      "Visibilité réseau IAD local",
      "Accès complet événements",
    ],
    cta: "Je m'inscris",
    href: "#form-partenaire",
    featured: false,
  },
];

export default function Adhesions() {
  return (
    <section id="adhesions" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">Adhésions</h2>
          <p className="mt-4 text-zinc-500 text-lg">Choisissez la formule qui vous correspond.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.nom}
              className={`flex flex-col rounded-3xl border p-6 transition-shadow hover:shadow-lg ${
                plan.featured
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-900"
              }`}
            >
              <h3 className={`text-lg font-semibold ${plan.featured ? "text-white" : "text-zinc-900"}`}>
                {plan.nom}
              </h3>
              <div className="mt-4">
                <span className="text-3xl font-bold">{plan.prix}</span>
                <span className={`text-sm ml-1 ${plan.featured ? "text-zinc-300" : "text-zinc-400"}`}>
                  {plan.periode}
                </span>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm">
                    <svg
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.featured ? "text-zinc-300" : "text-zinc-400"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.featured ? "text-zinc-200" : "text-zinc-600"}>{perk}</span>
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                className={`mt-6 block text-center py-3 px-4 rounded-2xl font-semibold text-sm transition-colors ${
                  plan.featured
                    ? "bg-white text-zinc-900 hover:bg-zinc-100"
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
