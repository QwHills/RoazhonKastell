import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { discoveryId, action } = await req.json();

  if (!discoveryId || !action) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  if (action === "known" || action === "seen" || action === "skipped") {
    const response = action === "known" ? "connue" : action === "seen" ? "vue" : "reportee";

    const { error } = await supabase
      .from("partner_discoveries")
      .update({ response, is_current: false, updated_at: new Date().toISOString() })
      .eq("id", discoveryId)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cleared: true });
  }

  if (action === "another") {
    await supabase
      .from("partner_discoveries")
      .update({ is_current: false, updated_at: new Date().toISOString() })
      .eq("id", discoveryId)
      .eq("user_id", user.id);

    return NextResponse.json({ cleared: true });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}
