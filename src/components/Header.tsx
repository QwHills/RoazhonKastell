"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LoginModal from "./LoginModal";

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Le lieu", href: "/#lieu" },
  { label: "Conseillers", href: "/conseillers" },
  { label: "Partenaires", href: "/partenaires" },
  { label: "Agenda", href: "/agenda" },
  { label: "Actualités", href: "/actualites" },
  { label: "Réussites", href: "/reussites" },
  { label: "Vidéos", href: "/#videos" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const scrollToHash = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const hash = href.split("#")[1];
    if (!hash) return;
    if (pathname === "/") {
      e.preventDefault();
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", `/#${hash}`);
    }
  }, [pathname]);

  useEffect(() => {
    if (searchParams.get("login") === "1") {
      setLoginOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  const glassStyle = {
    background: "rgba(255, 255, 255, 0.72)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
  } as const;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        style={glassStyle}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-[20px] sm:text-[22px] font-bold tracking-tight text-zinc-900 leading-tight">
                Roazhon Kastell
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={link.href.includes("#") ? (e) => scrollToHash(e, link.href) : undefined}
                  className="px-4 py-2 text-[14px] font-medium text-zinc-700 hover:text-zinc-900 transition-colors rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="hidden lg:flex items-center gap-3">
              {isLoggedIn ? (
                <Link
                  href="/espace"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-semibold text-zinc-800 bg-white/80 border border-zinc-300 rounded-full hover:bg-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Mon espace
                </Link>
              ) : (
                <button
                  onClick={() => setLoginOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-semibold text-zinc-800 bg-white/80 border border-zinc-300 rounded-full hover:bg-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Mon espace
                </button>
              )}
              <Link
                href="/#adhesions"
                onClick={(e) => scrollToHash(e, "/#adhesions")}
                className="px-5 py-2.5 text-[13px] font-semibold text-white bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors"
              >
                Adhérer
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-xl text-zinc-700 hover:bg-white/50 transition-colors"
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
          <nav
            className="lg:hidden border-t border-zinc-200/40 px-4 pb-4 pt-2"
            style={{
              background: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => { setMenuOpen(false); if (link.href.includes("#")) scrollToHash(e, link.href); }}
                className="block px-3 py-3 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-white/60 rounded-xl transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-3">
              {isLoggedIn ? (
                <Link
                  href="/espace"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-zinc-800 bg-white/80 border border-zinc-300 rounded-full text-center hover:bg-white transition-colors"
                >
                  Mon espace
                </Link>
              ) : (
                <button
                  onClick={() => { setMenuOpen(false); setLoginOpen(true); }}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-zinc-800 bg-white/80 border border-zinc-300 rounded-full text-center hover:bg-white transition-colors"
                >
                  Mon espace
                </button>
              )}
              <Link
                href="/#adhesions"
                onClick={(e) => { setMenuOpen(false); scrollToHash(e, "/#adhesions"); }}
                className="flex-1 px-5 py-3 text-sm font-semibold text-white bg-zinc-900 rounded-full text-center hover:bg-zinc-800 transition-colors"
              >
                Adhérer
              </Link>
            </div>
          </nav>
        )}
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
