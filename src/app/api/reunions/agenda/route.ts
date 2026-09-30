import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, canViewReunions } from "@/lib/supabase/auth";

export async function POST(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canViewReunions(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { freeText, selectedSubjects } = await req.json();

  if (!freeText?.trim() && (!selectedSubjects || selectedSubjects.length === 0)) {
    return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "SERVICE_NOT_CONFIGURED", message: "Clé API Anthropic non configurée." },
      { status: 503 },
    );
  }

  const subjectsList = (selectedSubjects || [])
    .map((s: { title: string; description?: string }) => `- ${s.title}${s.description ? ` : ${s.description}` : ""}`)
    .join("\n");

  const prompt = `Tu es un assistant pour un réseau de conseillers immobiliers. Tu structures un ordre du jour de réunion du bureau exécutif à partir des éléments fournis.

${freeText ? `Idées et notes du créateur :\n${freeText}\n` : ""}
${subjectsList ? `Sujets proposés par les membres du bureau :\n${subjectsList}\n` : ""}

Transforme ces éléments en ordre du jour structuré. Pour chaque sujet :
- Un titre clair et concis
- Une courte description (1-2 phrases)
- Une durée indicative en minutes (suggestion)
- Un ordre de passage logique

Règles strictes :
- Ne transforme que les éléments fournis, n'invente rien
- N'attribue pas de référent sauf si explicitement mentionné
- Les durées sont des suggestions, indique-le
- Pas de faits inventés ni d'engagements supposés

Réponds uniquement en JSON, sans explication :
[
  {"title": "...", "description": "...", "duration_minutes": 15},
  {"title": "...", "description": "...", "duration_minutes": 10}
]`;

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
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic API error:", response.status, errBody);
      return NextResponse.json({ error: "Erreur du service IA" }, { status: 502 });
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Réponse IA invalide" }, { status: 502 });
    }

    const subjects = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ subjects });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
