import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LocationForm from "./LocationForm";

export const metadata = {
  title: "Location du château — Roazhon Kastell",
  description:
    "Louez le Château de Lillion à Rennes pour vos réunions, formations, séminaires et réceptions. Tarifs et formulaire de réservation.",
};

const FORMULES = [
  {
    label: "FORMULE 1",
    name: "Salle de réunion",
    detail: "Journée complète, salle équipée",
    price: 150,
    priceAdherent: 0,
  },
  {
    label: "FORMULE 2",
    name: "Demi-journée",
    detail: "À partir de 14h00 et jusqu'en fin de journée",
    price: 200,
    priceAdherent: 180,
  },
  {
    label: "FORMULE 3",
    name: "Journée complète",
    detail: "À partir du matin et jusqu'en fin de journée",
    price: 300,
    priceAdherent: 270,
  },
  {
    label: "FORMULE 4",
    name: "Week-end complet",
    detail: "Du samedi 8h00 au dimanche en fin de journée",
    price: 500,
    priceAdherent: 450,
  },
];

export default function LocationPage() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main className="bg-white">
        {/* Hero */}
        <section className="relative bg-zinc-900 text-white overflow-hidden">
          <img
            src="/chateau.jpg"
            alt="Château de Lillion"
            className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-400 mb-4">
              Roazhon Kastell
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              Location du château
            </h1>
            <p className="text-zinc-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Un cadre d&apos;exception pour vos réunions, formations, séminaires et réceptions.
              Espaces privatisés, mobilier et équipements inclus.
            </p>
          </div>
        </section>

        {/* Tarifs */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-600 text-center mb-2">
              Grille tarifaire
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 text-center mb-3">
              Mise à disposition du château
            </h2>
            <p className="text-zinc-500 text-center text-sm mb-12 max-w-lg mx-auto">
              Tarifs TTC, applicables aux non-adhérents. Les adhérents bénéficient d&apos;une remise de 10&nbsp;%.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FORMULES.map((f) => (
                <div
                  key={f.name}
                  className="border border-zinc-200 rounded-2xl p-6 text-center hover:shadow-lg hover:border-zinc-300 transition-all"
                >
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-amber-600 mb-3">
                    {f.label}
                  </p>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">{f.name}</h3>
                  <p className="text-xs text-zinc-500 mb-5 leading-relaxed">{f.detail}</p>
                  <p className="text-4xl font-bold text-zinc-900">
                    {f.price}&nbsp;<span className="text-lg">€</span>
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 mt-1 mb-4">TTC</p>
                  <div className="border-t border-zinc-100 pt-3">
                    <p className="text-sm text-zinc-500">
                      Adhérent{" "}
                      <span className="font-bold text-amber-600">
                        {f.priceAdherent === 0 ? "Gratuit" : `${f.priceAdherent} €`}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Remise adhérent */}
            <div className="mt-10 bg-zinc-900 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <span className="text-3xl sm:text-4xl font-bold text-amber-400 shrink-0">
                −10&nbsp;%
              </span>
              <div>
                <p className="font-semibold text-white mb-1">
                  Avantage réservé aux adhérents du château
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Remise de 10&nbsp;% appliquée sur l&apos;ensemble des formules de mise à disposition.
                  La prestation de ménage est exclue de cette remise.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Conditions */}
        <section className="bg-zinc-50 py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8">
                <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-900 mb-4">
                  Remise en propreté
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                  La remise en propreté des lieux est <strong>à la charge du locataire</strong>.
                  Les espaces sont restitués dans leur état initial&nbsp;: mobilier repositionné,
                  déchets évacués, surfaces nettoyées.
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  À défaut, la prestation est prise en charge par le château et facturée{" "}
                  <strong>100&nbsp;€ TTC</strong>, sans remise adhérent.
                </p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8">
                <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-900 mb-4">
                  Conditions
                </h3>
                <ul className="space-y-2 text-sm text-zinc-600">
                  <li className="flex gap-2">
                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                    Tous les tarifs s&apos;entendent <strong>TTC</strong>.
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                    Réservation confirmée à réception de la convention signée.
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                    État des lieux d&apos;entrée et de sortie systématique.
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                    Respect du voisinage et des horaires convenus.
                  </li>
                  <li className="flex gap-2">
                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                    Toute dégradation constatée est facturée au réel.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Formulaire */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 text-center mb-3">
              Demande de réservation
            </h2>
            <p className="text-zinc-500 text-center text-sm mb-4 max-w-lg mx-auto">
              Remplissez ce formulaire avec les informations nécessaires à l&apos;établissement
              du contrat de location.
            </p>
            <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-xl text-center text-sm px-4 py-3 mb-10 max-w-lg mx-auto">
              Toute demande de réservation sera étudiée par le bureau de l&apos;association
              Roazhon Kastell pour validation.
            </p>
            <LocationForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
