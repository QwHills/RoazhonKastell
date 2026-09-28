import Link from "next/link";

const cartes = [
  {
    titre: "Se former et progresser",
    description:
      "Des formations et des ateliers pour enrichir ses connaissances.",
    icon: (
      <svg className="w-6 h-6 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    titre: "Partager et collaborer",
    description:
      "Les mardis coworking pour présenter ses biens et échanger.",
    icon: (
      <svg className="w-6 h-6 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
  {
    titre: "Se rencontrer et créer des liens",
    description:
      "Des rencontres et des moments conviviaux pour mieux se connaître.",
    icon: (
      <svg className="w-6 h-6 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
      </svg>
    ),
  },
];

export default function Lieu() {
  return (
    <section id="lieu" className="pt-6 sm:pt-8 pb-8 sm:pb-10 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <p
          className="text-xs font-semibold tracking-widest text-zinc-400 mb-5"
          style={{ letterSpacing: "0.15em" }}
        >
          LE LIEU
        </p>

        {/* Photo banner with overlay text */}
        <div
          className="relative overflow-hidden"
          style={{ borderRadius: "20px" }}
        >
          <div
            className="relative w-full"
            style={{ minHeight: "420px" }}
          >
            <img
              src="/chateau.jpg"
              alt="Le château du Roazhon Kastell"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "center 35%" }}
            />
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.15) 65%, transparent 100%)",
              }}
            />
            {/* Mobile: additional bottom gradient for text readability */}
            <div
              className="absolute inset-0 sm:hidden"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
              }}
            />

            {/* Text content */}
            <div className="relative z-10 flex flex-col justify-center h-full px-8 sm:px-12 lg:px-14 py-12 sm:py-14">
              <h2
                className="text-white font-bold tracking-tight"
                style={{
                  fontSize: "clamp(28px, 4vw, 48px)",
                  lineHeight: 1.15,
                  maxWidth: "620px",
                }}
              >
                Un lieu pour se retrouver.
                <br />
                Un collectif pour avancer.
              </h2>

              <p
                className="text-white mt-5 sm:mt-6"
                style={{
                  fontSize: "clamp(15px, 1.6vw, 20px)",
                  lineHeight: 1.5,
                  maxWidth: "540px",
                  opacity: 0.9,
                }}
              >
                Au Roazhon Kastell, les conseillers immobiliers et les
                partenaires se retrouvent pour travailler, partager leur
                expérience et développer des projets ensemble.
              </p>

              <div className="mt-10 sm:mt-12">
                <Link
                  href="/agenda"
                  className="inline-flex items-center gap-3 bg-white text-zinc-900 font-semibold rounded-full hover:bg-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                  style={{
                    fontSize: "clamp(14px, 1.2vw, 16px)",
                    padding: "16px 32px",
                  }}
                >
                  Prochain rendez-vous
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Three cards below */}
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 mt-6">
          {cartes.map((c) => (
            <div
              key={c.titre}
              className="flex items-start gap-4 bg-white border border-zinc-200 p-6 sm:p-7 hover:shadow-md transition-shadow"
              style={{
                borderRadius: "18px",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                {c.icon}
              </div>
              <div className="min-w-0">
                <h3
                  className="font-semibold text-zinc-900"
                  style={{ fontSize: "17px" }}
                >
                  {c.titre}
                </h3>
                <p
                  className="text-zinc-500 mt-1.5 leading-relaxed"
                  style={{ fontSize: "15px" }}
                >
                  {c.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
