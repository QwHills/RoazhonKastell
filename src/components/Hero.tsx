import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      id="accueil"
      className="relative overflow-hidden bg-zinc-900"
    >
      {/* Background photo — framed on the château facade */}
      <Image
        src="/chateau-drone.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: "center center" }}
      />

      {/* Gradient — stronger on the left for text readability, light elsewhere */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 40%, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 50%, transparent 80%)",
        }}
      />

      {/* Header spacer */}
      <div className="h-[72px]" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-xl">
          <h1
            className="font-bold text-white tracking-tight"
            style={{
              fontSize: "clamp(2rem, 4.2vw, 3.75rem)",
              lineHeight: 1.1,
            }}
          >
            Un lieu. Un réseau.
            <br />
            Des projets.
          </h1>
          <p
            className="text-white max-w-md"
            style={{
              fontSize: "clamp(0.95rem, 1.4vw, 1.2rem)",
              marginTop: "0.875rem",
              lineHeight: 1.5,
            }}
          >
            Conseillers IAD et partenaires, réunis à Rennes.
          </p>
          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-3">
            {/* Primary — dark translucent with white border */}
            <Link
              href="/#lieu"
              className="inline-flex items-center justify-center gap-2.5 py-3 px-6 font-semibold rounded-full text-base text-white border border-white/30 hover:bg-white/15 active:bg-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{
                background: "rgba(0, 0, 0, 0.35)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              Découvrir le château
              <svg
                className="w-4 h-4 flex-shrink-0"
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
            {/* Secondary — white solid */}
            <Link
              href="/#adhesions"
              className="inline-flex items-center justify-center gap-2.5 py-3 px-6 bg-white text-zinc-900 font-semibold rounded-full text-base hover:bg-zinc-100 active:bg-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Devenir adhérent
            </Link>
          </div>
        </div>
      </div>

      {/* Location badge — large screens only */}
      <div
        className="hidden lg:flex absolute bottom-4 right-6 xl:right-8 z-10 items-center gap-2 rounded-full px-3.5 py-2 border border-white/20"
        style={{
          background: "rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <svg
          className="w-3.5 h-3.5 text-white/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
          />
        </svg>
        <span className="text-xs text-white/80 font-medium">
          Château de caractère aux portes de Rennes
        </span>
      </div>
    </section>
  );
}
