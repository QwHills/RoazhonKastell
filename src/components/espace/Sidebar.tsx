"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

interface NavGroup {
  label?: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function CheckCircleIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function getNavGroups(profile: Profile): NavGroup[] {
  const groups: NavGroup[] = [];
  const roles = profile.roles;

  groups.push({
    items: [
      { label: "Tableau de bord", href: "/espace", icon: <HomeIcon /> },
      { label: "Mon profil", href: "/espace/profil", icon: <UserIcon /> },
    ],
  });

  if (roles.includes("adherent") || roles.includes("admin")) {
    groups.push({
      label: "Réseau",
      items: [
        { label: "Mes biens", href: "/espace/biens", icon: <BuildingIcon /> },
        { label: "Recherches", href: "/espace/recherches", icon: <SearchIcon /> },
        { label: "Mes actions", href: "/espace/actions", icon: <CheckCircleIcon /> },
        { label: "Agenda", href: "/espace/agenda", icon: <CalendarIcon /> },
        { label: "Boîte à idées", href: "/espace/idees", icon: <LightbulbIcon /> },
        { label: "Ressources", href: "/espace/ressources", icon: <FolderIcon /> },
      ],
    });
  } else {
    groups.push({
      label: "Réseau",
      items: [
        { label: "Agenda", href: "/espace/agenda", icon: <CalendarIcon /> },
        { label: "Ressources", href: "/espace/ressources", icon: <FolderIcon /> },
      ],
    });
  }

  const adminItems: NavItem[] = [];
  if (roles.includes("gestionnaire_membres") || roles.includes("admin")) {
    adminItems.push({ label: "Membres", href: "/espace/membres", icon: <UsersIcon /> });
  }
  if (
    roles.includes("gestionnaire_membres") ||
    roles.includes("partenaire") ||
    roles.includes("admin")
  ) {
    adminItems.push({
      label: roles.includes("partenaire") && !roles.includes("gestionnaire_membres") && !roles.includes("admin")
        ? "Ma fiche"
        : "Partenaires",
      href: "/espace/partenaires",
      icon: <BriefcaseIcon />,
    });
  }
  if (roles.includes("gestionnaire_evenements") || roles.includes("admin")) {
    adminItems.push({ label: "Biens du mardi", href: "/espace/mardi-biens", icon: <BuildingIcon /> });
    adminItems.push({ label: "Événements", href: "/espace/evenements", icon: <CalendarIcon /> });
  }
  if (roles.includes("membre_executif") || roles.includes("associe") || roles.includes("admin")) {
    adminItems.push({ label: "Réunions", href: "/espace/reunions", icon: <ClipboardIcon /> });
  }
  if (roles.includes("associe") || roles.includes("admin")) {
    adminItems.push({ label: "Finances", href: "/espace/finances", icon: <ChartIcon /> });
  }
  if (adminItems.length > 0) {
    groups.push({ label: "Gestion", items: adminItems });
  }

  return groups;
}

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navGroups = getNavGroups(profile);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const initials = `${(profile.first_name || "")[0] || ""}${(profile.last_name || "")[0] || ""}`.toUpperCase();

  const nav = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
                {group.label}
              </p>
            )}
            <nav className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/espace"
                    ? pathname === "/espace"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                      isActive
                        ? "bg-white/20 text-white backdrop-blur-sm"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom: user card + logout */}
      <div className="border-t border-white/15 p-3">
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold flex items-center justify-center flex-shrink-0 overflow-hidden">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-[11px] text-white/50 truncate">{profile.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/50 hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center shadow-sm"
        aria-label="Menu"
      >
        <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 flex flex-col transform transition-transform lg:translate-x-0 overflow-hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Background photo */}
        <img
          src="/chateau-drone.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: "center 60%" }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          <div className="px-4 py-5 flex-shrink-0">
            <Link href="/" className="inline-flex flex-col px-4 py-3 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/25 shadow-lg">
              <span className="text-lg font-bold text-white tracking-tight drop-shadow-sm">Roazhon Kastell</span>
              <span className="text-[11px] text-white/70 font-medium tracking-wide -mt-0.5">
                Espace membre
              </span>
            </Link>
          </div>
          {nav}
        </div>
      </aside>
    </>
  );
}

function HomeIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}
function BriefcaseIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  );
}
function LightbulbIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  );
}
function ClipboardIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
