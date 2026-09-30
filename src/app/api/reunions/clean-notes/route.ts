import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, canViewReunions } from "@/lib/supabase/auth";

export async function POST(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canViewReunions(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { subject_title, raw_notes } = await req.json();

  if (!raw_notes?.trim()) {
    return NextResponse.json({ error: "Notes requises" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API Anthropic non configurée" }, { status: 503 });
  }

  const prompt = `Tu es un assistant de réunion pour un réseau de conseillers immobiliers (Roazhon Kastell, association IAD à Rennes).

SUJET DE LA RÉUNION : ${subject_title || "Non précisé"}

NOTES BRUTES prises pendant la réunion (potentiellement en vrac, avec des fautes, des abréviations, etc.) :
"""
${raw_notes}
"""

Tu dois faire DEUX choses :

1. REMETTRE AU PROPRE les notes : reformule de manière claire et structurée, corrige les fautes, organise les idées. Garde le sens exact, n'invente rien.

2. EXTRAIRE LES ACTIONS : identifie les actions concrètes à réaliser mentionnées dans les notes (tâches, décisions à appliquer, choses à faire). Pour chaque action, donne un titre court.

Réponds UNIQUEMENT avec ce format JSON (aucun texte avant ou après) :
{
  "clean_notes": "Les notes remises au propre ici...",
  "actions": ["Action 1", "Action 2"]
}

Si aucune action n'est identifiable, retourne un tableau vide pour "actions".`;

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
      console.error("Anthropic API error:", response.status, await response.text());
      return NextResponse.json({ error: "Erreur du service IA" }, { status: 502 });
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Réponse IA invalide" }, { status: 502 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      clean_notes: parsed.clean_notes || raw_notes,
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors du nettoyage" }, { status: 500 });
  }
}
