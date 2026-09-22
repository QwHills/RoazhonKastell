export default function Hero() {
  return (
    <section
      id="accueil"
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-zinc-900"
      style={{
        backgroundImage: "url(/chateau.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight drop-shadow-lg">
          Le château qui connecte
          <br />
          les conseillers IAD
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto drop-shadow-md">
          Roazhon Kastell est un pôle de formation IAD et un lieu associatif à Rennes.
          On s&apos;y retrouve entre conseillers IAD pour travailler, se former,
          échanger et partager du business ensemble — avec coworking, networking
          et événements (afterworks, formations, soirées networking). Rejoignez une communauté active.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#adhesions"
            className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-900 font-semibold rounded-3xl hover:bg-zinc-100 transition-colors text-center shadow-lg"
          >
            Voir les adhésions
          </a>
          <a
            href="#adherents"
            className="w-full sm:w-auto px-8 py-4 bg-white/15 text-white font-semibold rounded-3xl hover:bg-white/25 backdrop-blur-sm transition-colors text-center border border-white/30"
          >
            Nos conseillers
          </a>
        </div>
        <p className="mt-10 text-sm text-zinc-300">
          Association loi 1901 &bull; Pôle de formation IAD &bull; Rennes &amp; alentours
        </p>
      </div>
    </section>
  );
}
