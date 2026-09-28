import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { actionId, status } = await req.json();
  if (!actionId || !["a_faire", "realisee", "declinee"].includes(status)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_action_tracking")
    .upsert(
      { action_id: actionId, user_id: user.id, status, updated_at: new Date().toISOString() },
      { onConflict: "action_id,user_id" },
    )
    .select("id, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
