import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();

  const {
    formule,
    dateDebut,
    dateFin,
    objet,
    nbPersonnes,
    isAdherent,
    nom,
    prenom,
    email,
    telephone,
    adresse,
    codePostal,
    ville,
    societe,
    siret,
    besoins,
  } = body;

  if (!formule || !dateDebut || !objet || !nbPersonnes || !nom || !prenom || !email || !telephone || !adresse || !codePostal || !ville) {
    return NextResponse.json({ error: "Veuillez remplir tous les champs obligatoires." }, { status: 400 });
  }

  const FORMULE_LABELS: Record<string, string> = {
    journee: "Journée complète — 300 € TTC",
    "demi-journee": "Demi-journée — 200 € TTC",
    "week-end": "Week-end complet — 500 € TTC",
    "salle-reunion": "Salle de réunion — 150 € TTC / jour",
  };

  const supabase = await createClient();
  const { error: dbError } = await supabase.from("location_requests").insert({
    formule,
    date_debut: dateDebut,
    date_fin: dateFin || null,
    objet,
    nb_personnes: parseInt(nbPersonnes, 10),
    is_adherent: isAdherent === "oui",
    nom,
    prenom,
    email,
    telephone,
    adresse,
    code_postal: codePostal,
    ville,
    societe: societe || null,
    siret: siret || null,
    besoins: besoins || null,
    status: "nouvelle",
  });

  if (dbError) {
    console.error("Erreur insertion location_requests:", dbError);
  }

  const htmlContent = `
    <h2>Nouvelle demande de réservation du château</h2>
    <p><strong>⚠️ Cette demande doit être étudiée et validée par le bureau de l'association.</strong></p>
    <hr />
    <h3>Réservation</h3>
    <ul>
      <li><strong>Formule :</strong> ${FORMULE_LABELS[formule] || formule}</li>
      <li><strong>Date${dateFin ? " de début" : ""} :</strong> ${dateDebut}</li>
      ${dateFin ? `<li><strong>Date de fin :</strong> ${dateFin}</li>` : ""}
      <li><strong>Objet :</strong> ${objet}</li>
      <li><strong>Nombre de personnes :</strong> ${nbPersonnes}</li>
      <li><strong>Adhérent :</strong> ${isAdherent === "oui" ? "Oui" : "Non"}</li>
    </ul>
    <h3>Identité du locataire</h3>
    <ul>
      <li><strong>Nom :</strong> ${nom} ${prenom}</li>
      <li><strong>Email :</strong> ${email}</li>
      <li><strong>Téléphone :</strong> ${telephone}</li>
      <li><strong>Adresse :</strong> ${adresse}, ${codePostal} ${ville}</li>
      ${societe ? `<li><strong>Société :</strong> ${societe}</li>` : ""}
      ${siret ? `<li><strong>SIRET :</strong> ${siret}</li>` : ""}
    </ul>
    ${besoins ? `<h3>Besoins particuliers</h3><p>${besoins}</p>` : ""}
  `;

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Roazhon Kastell <no-reply@roazhonkastell.fr>",
        to: [process.env.CONTACT_EMAIL || "contact@roazhonkastell.fr"],
        subject: `Demande de location — ${nom} ${prenom} — ${FORMULE_LABELS[formule] || formule}`,
        html: htmlContent,
        replyTo: email,
      });
    } catch (e) {
      console.error("Erreur envoi email:", e);
    }
  }

  return NextResponse.json({ success: true });
}
