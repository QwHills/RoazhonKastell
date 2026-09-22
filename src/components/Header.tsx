"use client";

import { useState } from "react";

const navLinks = [
  { label: "Accueil", href: "#accueil" },
  { label: "Le lieu", href: "#lieu" },
{ label: "Adhésions", href: "#adhesions" },
  { label: "Adhérents", href: "#adherents" },
  { label: "Partenaires", href: "#partenaires" },
  { label: "Vidéos", href: "#videos" },
  { label: "Contact", href: "#contact" },
  { label: "Inscriptions", href: "#inscriptions" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#accueil" className="text-xl font-bold tracking-tight text-zinc-900">
            Roazhon Kastell
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors rounded-xl hover:bg-zinc-100"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#adhesions"
              className="ml-4 px-5 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-colors"
            >
              Adhérer
            </a>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="lg:hidden bg-white border-t border-zinc-100 px-4 pb-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#adhesions"
            onClick={() => setMenuOpen(false)}
            className="block mt-2 px-5 py-3 text-sm font-semibold text-white bg-zinc-900 rounded-2xl text-center hover:bg-zinc-800 transition-colors"
          >
            Adhérer
          </a>
        </nav>
      )}
    </header>
  );
}
