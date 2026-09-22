export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-lg font-semibold text-white mb-2">Roazhon Kastell</p>
        <p className="text-sm mb-4">Association loi 1901 &bull; Pôle de formation IAD &bull; Rennes</p>
        <a
          href="mailto:roazhonkastell@gmail.com"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          roazhonkastell@gmail.com
        </a>
        <p className="text-xs text-zinc-600 mt-6">&copy; {new Date().getFullYear()} Roazhon Kastell. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
