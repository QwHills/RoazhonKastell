import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canViewReunions } from "@/lib/supabase/auth";

export async function POST(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canViewReunions(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { meeting_id } = await req.json();
  if (!meeting_id) {
    return NextResponse.json({ error: "meeting_id requis" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API Anthropic non configurée" }, { status: 503 });
  }

  const supabase = await createClient();

  const [{ data: meeting }, { data: subjects }, { data: attendees }, { data: todos }] = await Promise.all([
    supabase.from("meetings").select("*").eq("id", meeting_id).single(),
    supabase
      .from("meeting_subjects")
      .select("*, profiles!meeting_subjects_proposed_by_fkey(first_name, last_name)")
      .eq("meeting_id", meeting_id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("meeting_attendees")
      .select("*, profiles!meeting_attendees_user_id_fkey(first_name, last_name)")
      .eq("meeting_id", meeting_id),
    supabase
      .from("meeting_todos")
      .select("*, profiles!meeting_todos_assigned_to_fkey(first_name, last_name)")
      .eq("meeting_id", meeting_id),
  ]);

  if (!meeting) {
    return NextResponse.json({ error: "Réunion introuvable" }, { status: 404 });
  }

  const presentsStr = (attendees || [])
    .filter((a) => a.response === "present")
    .map((a) => a.profiles ? `${a.profiles.first_name} ${a.profiles.last_name}` : "Membre")
    .join(", ");

  const absentsStr = (attendees || [])
    .filter((a) => a.response === "absent")
    .map((a) => a.profiles ? `${a.profiles.first_name} ${a.profiles.last_name}` : "Membre")
    .join(", ");

  const subjectsStr = (subjects || [])
    .map((s, i) => {
      let line = `${i + 1}. ${s.title}`;
      if (s.description) line += ` — ${s.description}`;
      line += ` [Statut: ${s.status}]`;
      if (s.notes) line += `\n   Notes prises pendant la réunion : ${s.notes}`;
      return line;
    })
    .join("\n");

  const todosStr = (todos || [])
    .map((t) => {
      let line = `- ${t.title}`;
      if (t.profiles) line += ` (${t.profiles.first_name} ${t.profiles.last_name})`;
      if (t.due_date) line += ` — échéance ${t.due_date}`;
      return line;
    })
    .join("\n");

  const prompt = `Tu es un secrétaire de séance pour un réseau de conseillers immobiliers (Roazhon Kastell, association IAD à Rennes).
Rédige un compte rendu formel et structuré de la réunion suivante.

INFORMATIONS DE LA RÉUNION :
- Titre : ${meeting.title}
- Date : ${meeting.meeting_date}
- Horaires : ${meeting.starts_time || "?"} – ${meeting.ends_time || "?"}
- Lieu : ${meeting.location || "Non précisé"}
- Présents : ${presentsStr || "Non renseigné"}
- Absents/Excusés : ${absentsStr || "Aucun"}

ORDRE DU JOUR :
${subjectsStr || "Aucun sujet listé"}

${meeting.raw_notes ? `NOTES BRUTES PRISES PENDANT LA RÉUNION :\n${meeting.raw_notes}\n` : ""}

ACTIONS DÉCIDÉES :
${todosStr || "Aucune action"}

CONSIGNES DE RÉDACTION :
- Commence par un en-tête avec le titre, la date, les horaires, le lieu, les présents et absents
- Pour chaque sujet traité : résume les échanges, les décisions prises et les actions qui en découlent
- Termine par la liste des prochaines actions avec responsable et échéance
- Sois factuel, concis et professionnel
- N'invente aucune information qui ne figure pas dans les données ci-dessus
- Si des notes sont incomplètes, indique "[à compléter]"
- Rédige en français

Réponds avec le compte rendu uniquement, sans introduction ni commentaire.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error:", response.status, await response.text());
      return NextResponse.json({ error: "Erreur du service IA" }, { status: 502 });
    }

    const result = await response.json();
    const summary = result.content?.[0]?.text || "";

    const { error: updateError } = await supabase
      .from("meetings")
      .update({ summary, status: "termine", updated_at: new Date().toISOString() })
      .eq("id", meeting_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
