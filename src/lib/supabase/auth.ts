import { cache } from "react";
import { createClient } from "./server";
import type { Profile, UserRole } from "./types";

export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
});

export function hasRole(profile: Profile, role: UserRole): boolean {
  return profile.roles.includes(role);
}

export function hasAnyRole(profile: Profile, roles: UserRole[]): boolean {
  return roles.some((r) => profile.roles.includes(r));
}

export function isStaff(profile: Profile): boolean {
  return hasAnyRole(profile, ["admin", "gestionnaire_membres", "gestionnaire_evenements"]);
}

export function isAdmin(profile: Profile): boolean {
  return hasRole(profile, "admin");
}

export function canManageMembers(profile: Profile): boolean {
  return hasAnyRole(profile, ["admin", "gestionnaire_membres"]);
}

export function canManageEvents(profile: Profile): boolean {
  return hasAnyRole(profile, ["admin", "gestionnaire_evenements"]);
}

export function canViewFinances(profile: Profile): boolean {
  return hasAnyRole(profile, ["admin", "associe"]);
}

export function canViewReunions(profile: Profile): boolean {
  return hasAnyRole(profile, ["admin", "membre_executif", "associe"]);
}
