import { getCurrentUser, isAdmin, hasRole } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ActionCard from "./ActionCard";

export const dynamic = "force-dynamic";

export default async function MesActionsPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/?login=1");

  const supabase = await createClient();
  const admin = isAdmin(profile);

  const { data: myTracking } = await supabase
    .from("user_action_tracking")
    .select("id, status, created_at, updated_at, action_id, atelier_actions!inner(title, instruction, duration_minutes, event_id, events!inner(title, starts_at))")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const actions = (myTracking || []).map((t) => {
    const action = t.atelier_actions as unknown as {
      title: string;
      instruction: string;
      duration_minutes: number;
      event_id: string;
      events: { title: string; starts_at: string };
    };
    return {
      id: t.id,
      actionId: t.action_id,
      actionTitle: action.title,
      instruction: action.instruction,
      duration: action.duration_minutes,
      status: t.status as string,
      eventTitle: action.events.title,
      eventDate: action.events.starts_at,
      updatedAt: t.updated_at,
    };
  });

  const doneCount = actions.filter((a) => a.status === "realisee").length;
  const declinedCount = actions.filter((a) => a.status === "declinee").length;
  const pendingCount = actions.filter((a) => a.status === "a_faire").length;

  let adminStats: {
    totalActions: number;
    totalCompletions: number;
    totalRecipients: number;
    actionBreakdown: { title: string; eventTitle: string; eventDate: string; completions: number; recipients: number }[];
  } | null = null;

  if (admin) {
    const { data: allActions } = await supabase
      .from("atelier_actions")
      .select("id, title, event_id, events!inner(title, starts_at)")
      .eq("status", "valide")
      .order("validated_at", { ascending: false })
      .limit(20);

    if (allActions && allActions.length > 0) {
      const actionIds = allActions.map((a) => a.id);

      const { data: trackingData } = await supabase
        .from("user_action_tracking")
        .select("action_id, status")
        .in("action_id", actionIds);

      const breakdown = allActions.map((a) => {
        const ev = a.events as unknown as { title: string; starts_at: string };
        const trackings = (trackingData || []).filter((t) => t.action_id === a.id);
        return {
          title: a.title,
          eventTitle: ev.title,
          eventDate: ev.starts_at,
          completions: trackings.filter((t) => t.status === "realisee").length,
          recipients: trackings.length,
        };
      });

      adminStats = {
        totalActions: allActions.length,
        totalCompletions: breakdown.reduce((s, b) => s + b.completions, 0),
        totalRecipients: breakdown.reduce((s, b) => s + b.recipients, 0),
        actionBreakdown: breakdown,
      };
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Mes actions</h1>
        <p className="text-zinc-500 mt-1">
          Historique des actions proposées après les ateliers du mardi.
        </p>
      </div>

      {/* Stats personnelles */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-emerald-700">{doneCount}</p>
          <p className="text-xs text-emerald-600 mt-1">Réalisée{doneCount > 1 ? "s" : ""}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-amber-700">{pendingCount}</p>
          <p className="text-xs text-amber-600 mt-1">En attente</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-zinc-400">{declinedCount}</p>
          <p className="text-xs text-zinc-400 mt-1">Déclinée{declinedCount > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Liste des actions */}
      {actions.length > 0 ? (
        <div className="space-y-3 mb-12">
          {actions.map((a) => (
            <ActionCard key={a.id} action={a} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 mb-12">
          <p className="text-zinc-400 mb-2">Aucune action pour le moment.</p>
          <p className="text-sm text-zinc-400">
            Les actions apparaîtront ici après les ateliers du mardi.
          </p>
        </div>
      )}

      {/* Stats admin */}
      {adminStats && (
        <div className="border-t border-zinc-200 pt-8">
          <h2 className="text-lg font-bold text-zinc-900 mb-1">Statistiques globales</h2>
          <p className="text-sm text-zinc-500 mb-6">Vue d&apos;ensemble des actions pour tous les membres.</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-zinc-900">{adminStats.totalActions}</p>
              <p className="text-xs text-zinc-400 mt-1">Actions créées</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-zinc-900">{adminStats.totalRecipients}</p>
              <p className="text-xs text-zinc-400 mt-1">Destinataires</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold text-emerald-700">{adminStats.totalCompletions}</p>
              <p className="text-xs text-zinc-400 mt-1">Réalisations</p>
            </div>
          </div>

          <div className="space-y-3">
            {adminStats.actionBreakdown.map((ab, i) => {
              const rate = ab.recipients > 0 ? Math.round((ab.completions / ab.recipients) * 100) : 0;
              return (
                <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm text-zinc-900">{ab.title}</h4>
                      <p className="text-xs text-zinc-400">
                        {ab.eventTitle} · {new Date(ab.eventDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-zinc-700">{rate}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1.5">
                    {ab.completions} réalisation{ab.completions > 1 ? "s" : ""} / {ab.recipients} destinataire{ab.recipients > 1 ? "s" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
