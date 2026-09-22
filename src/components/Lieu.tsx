const features = [
  "Espaces coworking & salles de réunion",
  "Ateliers & masterclass IAD",
  "Afterworks & soirées networking",
];

const cartes = [
  {
    titre: "Parcours IAD",
    description: "Formations du cursus obligatoire (validation 42h de la loi ALUR).",
  },
  {
    titre: "Mardi Co-working",
    description: "Présentation des biens et recherche acquéreurs.",
  },
  {
    titre: "Business Booster",
    description: "Partenariats, opérations locales, synergies avec le réseau.",
  },
];

export default function Lieu() {
  return (
    <section id="lieu" className="py-20 sm:py-28 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">Le lieu</h2>
            <p className="mt-6 text-lg text-zinc-500 leading-relaxed">
              Un cadre inspirant pour travailler, se former et faire du business
              entre conseillers IAD et partenaires.
            </p>
            <p className="mt-4 text-zinc-500 leading-relaxed">
              En tant que pôle de formation IAD, le château est aussi un lieu pensé pour
              apprendre et transmettre : salles équipées, programme régulier et
              accompagnement par les pairs.
            </p>
            <ul className="mt-8 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-zinc-700">
                  <span className="flex-shrink-0 w-2 h-2 bg-zinc-900 rounded-full" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — 3 cards */}
          <div className="grid gap-4">
            {cartes.map((c) => (
              <div
                key={c.titre}
                className="bg-white border border-zinc-200 rounded-3xl p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold text-zinc-900">{c.titre}</h3>
                <p className="mt-2 text-zinc-500 text-sm leading-relaxed">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
