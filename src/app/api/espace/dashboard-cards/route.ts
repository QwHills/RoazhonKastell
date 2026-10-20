import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasRole } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getWeeklyAction,
  getMeetSuggestion,
  getPartnerDiscovery,
  getPartnerFicheAction,
  getSuccessesCard,
} from "@/lib/dashboard-cards";

export async function GET(request: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const isPartner = hasRole(profile, "partenaire");
  const nextEventId = request.nextUrl.searchParams.get("nextEventId");

  const [weeklyAction, meetSuggestion, partnerDiscovery, partnerFicheAction, successesCard] =
    await Promise.all([
      !isPartner ? getWeeklyAction(supabase, profile.id) : Promise.resolve(null),
      !isPartner && nextEventId
        ? getMeetSuggestion(supabase, profile.id, nextEventId)
        : Promise.resolve(null),
      !isPartner ? getPartnerDiscovery(supabase, profile.id) : Promise.resolve(null),
      isPartner ? getPartnerFicheAction(supabase, profile.id) : Promise.resolve(null),
      !isPartner ? getSuccessesCard(supabase, profile.id) : Promise.resolve(null),
    ]);

  return NextResponse.json({
    weeklyAction,
    meetSuggestion,
    partnerDiscovery,
    partnerFicheAction,
    successesCard,
  });
}
