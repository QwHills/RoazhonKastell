import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { suggestionId, action, eventId } = await req.json();

  if (action === "known" && suggestionId) {
    const { data: sugg } = await supabase
      .from("meet_suggestions")
      .select("suggested_user_id, event_id")
      .eq("id", suggestionId)
      .eq("user_id", user.id)
      .single();

    if (!sugg) return NextResponse.json({ error: "Suggestion introuvable" }, { status: 404 });

    await supabase
      .from("known_contacts")
      .upsert({ user_id: user.id, known_user_id: sugg.suggested_user_id, source: "self_declared" }, { onConflict: "user_id,known_user_id" });

    await supabase.from("meet_suggestions").delete().eq("id", suggestionId);

    return NextResponse.json({ cleared: true });
  }

  if (action === "accepted" && suggestionId) {
    const { error } = await supabase
      .from("meet_suggestions")
      .update({ status: "acceptee", updated_at: new Date().toISOString() })
      .eq("id", suggestionId)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ status: "acceptee" });
  }

  if (action === "exchanged" && suggestionId) {
    const { data: sugg } = await supabase
      .from("meet_suggestions")
      .select("suggested_user_id, event_id")
      .eq("id", suggestionId)
      .eq("user_id", user.id)
      .single();

    if (!sugg) return NextResponse.json({ error: "Suggestion introuvable" }, { status: 404 });

    await supabase
      .from("meet_suggestions")
      .update({ status: "echangee", updated_at: new Date().toISOString() })
      .eq("id", suggestionId);

    await supabase
      .from("known_contacts")
      .upsert(
        { user_id: user.id, known_user_id: sugg.suggested_user_id, source: "met_at_event", event_id: sugg.event_id },
        { onConflict: "user_id,known_user_id" },
      );

    return NextResponse.json({ status: "echangee" });
  }

  if (action === "declined" && suggestionId) {
    const { error } = await supabase
      .from("meet_suggestions")
      .update({ status: "declinee", updated_at: new Date().toISOString() })
      .eq("id", suggestionId)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ status: "declinee" });
  }

  if (action === "another" && eventId) {
    await supabase
      .from("meet_suggestions")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);

    return NextResponse.json({ cleared: true });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}
