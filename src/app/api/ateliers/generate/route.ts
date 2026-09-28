import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, canManageEvents } from "@/lib/supabase/auth";

export async function POST(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canManageEvents(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { title, description } = await req.json();
  if (!title || !description) {
    return NextResponse.json({ error: "Titre et description requis" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "SERVICE_NOT_CONFIGURED", message: "La variable ANTHROPIC_API_KEY n'est pas configurée. Saisissez l'action manuellement." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Tu es un assistant pour un réseau de conseillers immobiliers indépendants. Après un atelier, tu proposes 3 actions concrètes et réalisables dans la semaine.

Atelier : ${title}
Description : ${description}

Propose 3 actions différentes. Chaque action doit être :
- Directement liée au contenu de l'atelier
- Réalisable par un conseiller immobilier dans son quotidien
- Concrète et spécifique (pas vague)
- Avec un temps estimé réaliste (5 à 30 minutes)

Réponds uniquement en JSON, sans explication :
[
  {"title": "...", "instruction": "...", "duration_minutes": 15},
  {"title": "...", "instruction": "...", "duration_minutes": 10},
  {"title": "...", "instruction": "...", "duration_minutes": 20}
]`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Erreur du service IA" }, { status: 502 });
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Réponse IA invalide" }, { status: 502 });
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
