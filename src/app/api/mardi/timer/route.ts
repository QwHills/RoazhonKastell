import { NextResponse } from "next/server";
import { getCurrentUser, canManageEvents } from "@/lib/supabase/auth";
import { getAdminClient } from "@/lib/mardi";

export async function POST(request: Request) {
  const profile = await getCurrentUser();
  if (!profile || !canManageEvents(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { sessionId, action, remaining_ms } = await request.json();
  const admin = getAdminClient();

  const { data: session } = await admin
    .from("tuesday_sessions")
    .select("timer_state")
    .eq("id", sessionId)
    .single();

  if (!session) return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });

  const timer = session.timer_state as { status: string; remaining_ms: number; started_at: string | null };
  let newTimer = { ...timer };

  if (action === "start") {
    newTimer = {
      status: "running",
      remaining_ms: timer.remaining_ms,
      started_at: new Date().toISOString(),
    };
  } else if (action === "pause") {
    if (timer.status === "running" && timer.started_at) {
      const elapsed = Date.now() - new Date(timer.started_at).getTime();
      const left = Math.max(0, timer.remaining_ms - elapsed);
      newTimer = { status: "paused", remaining_ms: left, started_at: null };
    }
  } else if (action === "resume") {
    newTimer = {
      status: "running",
      remaining_ms: timer.remaining_ms,
      started_at: new Date().toISOString(),
    };
  } else if (action === "finish") {
    newTimer = { status: "finished", remaining_ms: 0, started_at: null };
  } else if (action === "sync" && typeof remaining_ms === "number") {
    newTimer = { ...timer, remaining_ms };
  } else {
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }

  const { error } = await admin
    .from("tuesday_sessions")
    .update({ timer_state: newTimer })
    .eq("id", sessionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ timer: newTimer });
}
