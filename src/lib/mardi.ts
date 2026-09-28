import { createClient } from "@supabase/supabase-js";

export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export function getNextTuesdayDate(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parisStr = fmt.format(now);
  const d = new Date(parisStr + "T12:00:00");
  const day = d.getDay();
  const diff = day <= 2 ? 2 - day : 9 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

export function formatTuesdayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}
