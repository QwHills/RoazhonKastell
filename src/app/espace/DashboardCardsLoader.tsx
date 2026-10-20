"use client";

import { useState, useEffect } from "react";
import type {
  WeeklyActionData,
  MeetSuggestionData,
  PartnerDiscoveryData,
  PartnerFicheAction,
  SuccessesCardData,
} from "@/lib/dashboard-cards";
import {
  ActionWeekCard,
  MeetCounselorCard,
  PartnerDiscoverCard,
  PartnerFicheCard,
  SuccessesCard,
} from "./DashboardCards";

interface DashboardCardsData {
  weeklyAction: WeeklyActionData | null;
  meetSuggestion: MeetSuggestionData | null;
  partnerDiscovery: PartnerDiscoveryData | null;
  partnerFicheAction: PartnerFicheAction | null;
  successesCard: SuccessesCardData | null;
}

export default function DashboardCardsLoader({
  nextEventId,
  isPartner,
}: {
  nextEventId: string | null;
  isPartner: boolean;
}) {
  const [data, setData] = useState<DashboardCardsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (nextEventId) params.set("nextEventId", nextEventId);
    fetch(`/api/espace/dashboard-cards?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [nextEventId]);

  if (loading) {
    return (
      <div className="space-y-4 mb-8">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-32 bg-zinc-50 rounded-2xl animate-pulse" />
          <div className="h-32 bg-zinc-50 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { weeklyAction, meetSuggestion, partnerDiscovery, partnerFicheAction, successesCard } =
    data;
  const hasCards = !!(weeklyAction || meetSuggestion || partnerDiscovery);

  return (
    <>
      {hasCards && (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {weeklyAction && <ActionWeekCard data={weeklyAction} />}
          {meetSuggestion && nextEventId && (
            <MeetCounselorCard data={meetSuggestion} eventId={nextEventId} />
          )}
          {partnerDiscovery && <PartnerDiscoverCard data={partnerDiscovery} />}
        </div>
      )}
      {partnerFicheAction && (
        <div className="mb-8">
          <PartnerFicheCard data={partnerFicheAction} />
        </div>
      )}
      {successesCard && (
        <div className="mb-8">
          <SuccessesCard data={successesCard} />
        </div>
      )}
    </>
  );
}
