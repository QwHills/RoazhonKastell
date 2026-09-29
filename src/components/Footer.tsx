import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-zinc-900">Roazhon Kastell</span>
            <span className="hidden sm:inline text-zinc-300">|</span>
            <span className="text-sm text-zinc-400">Un réseau, des projets, un territoire.</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/conseillers" className="hover:text-zinc-900 transition-colors">Conseillers</Link>
            <Link href="/partenaires" className="hover:text-zinc-900 transition-colors">Partenaires</Link>
            <Link href="/agenda" className="hover:text-zinc-900 transition-colors">Agenda</Link>
            <a href="mailto:gianni.schiariti@iadfrance.fr" className="hover:text-zinc-900 transition-colors">Contact</a>
          </nav>
        </div>
        <p className="text-xs text-zinc-300 mt-6 text-center sm:text-left">
          &copy; {new Date().getFullYear()} Roazhon Kastell &mdash; Association loi 1901
        </p>
      </div>
    </footer>
  );
}
