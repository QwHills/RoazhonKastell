import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canManageEvents } from "@/lib/supabase/auth";

const FORMULE_INFO: Record<string, { label: string; prix: number; prixAdherent: number }> = {
  "salle-reunion": { label: "Salle de réunion (journée complète)", prix: 150, prixAdherent: 0 },
  "demi-journee": { label: "Demi-journée (à partir de 14h00)", prix: 200, prixAdherent: 180 },
  journee: { label: "Journée complète", prix: 300, prixAdherent: 270 },
  "week-end": { label: "Week-end complet (samedi et dimanche)", prix: 500, prixAdherent: 450 },
};

function formatDateFR(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export async function GET(request: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || !canManageEvents(profile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: req, error } = await supabase
    .from("location_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !req) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  const formule = FORMULE_INFO[req.formule] || { label: req.formule, prix: 0, prixAdherent: 0 };
  const prix = req.is_adherent ? formule.prixAdherent : formule.prix;
  const prixText = prix === 0 ? "Gratuit" : `${prix},00 € TTC`;
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Convention de mise à disposition — ${req.prenom} ${req.nom}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20mm 15mm; }
      .no-print { display: none !important; }
      @page { margin: 15mm; size: A4; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      background: #f5f5f5;
    }
    .page {
      background: white;
      padding: 50px;
      border: 1px solid #e5e5e5;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #1a1a1a;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 18pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }
    .header h2 {
      font-size: 13pt;
      font-weight: 400;
      color: #666;
    }
    .header .assoc {
      font-size: 10pt;
      color: #888;
      margin-top: 8px;
    }
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #333;
      border-bottom: 1px solid #ddd;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .parties {
      display: flex;
      gap: 30px;
      margin-bottom: 24px;
    }
    .partie {
      flex: 1;
      border: 1px solid #e5e5e5;
      border-radius: 6px;
      padding: 16px;
    }
    .partie h3 {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      margin-bottom: 8px;
    }
    .partie p {
      margin-bottom: 2px;
    }
    .partie strong { font-weight: 600; }
    .article {
      margin-bottom: 16px;
    }
    .article h4 {
      font-weight: 700;
      margin-bottom: 4px;
    }
    .article p, .article ul {
      margin-bottom: 6px;
    }
    .article ul {
      padding-left: 20px;
    }
    .article li {
      margin-bottom: 3px;
    }
    .prix-box {
      background: #f9f9f9;
      border: 1px solid #e5e5e5;
      border-radius: 6px;
      padding: 16px;
      text-align: center;
      margin: 16px 0;
    }
    .prix-box .montant {
      font-size: 24pt;
      font-weight: 700;
    }
    .prix-box .detail {
      font-size: 9pt;
      color: #888;
      margin-top: 2px;
    }
    .signatures {
      display: flex;
      gap: 30px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .signature {
      flex: 1;
      text-align: center;
    }
    .signature p {
      font-size: 10pt;
      color: #888;
      margin-bottom: 60px;
    }
    .signature .line {
      border-top: 1px solid #ccc;
      padding-top: 8px;
      font-size: 10pt;
    }
    .print-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #1a1a1a;
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 100;
    }
    .print-btn:hover { background: #333; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Convention de mise à disposition</h1>
      <h2>Château de Lillion — Rennes</h2>
      <p class="assoc">Association Roazhon Kastell — Loi 1901</p>
    </div>

    <div class="parties">
      <div class="partie">
        <h3>Le metteur à disposition</h3>
        <p><strong>Association Roazhon Kastell</strong></p>
        <p>Château de Lillion</p>
        <p>Rennes (35)</p>
        <p>contact@roazhonkastell.fr</p>
        <p style="margin-top:8px;font-size:9pt;color:#888;">Ci-après dénommée « l'Association »</p>
      </div>
      <div class="partie">
        <h3>Le bénéficiaire</h3>
        <p><strong>${req.prenom} ${req.nom}</strong></p>
        ${req.societe ? `<p>${req.societe}</p>` : ""}
        ${req.siret ? `<p style="font-size:9pt;color:#888;">SIRET : ${req.siret}</p>` : ""}
        <p>${req.adresse}</p>
        <p>${req.code_postal} ${req.ville}</p>
        <p>${req.email}</p>
        <p>${req.telephone}</p>
        <p style="margin-top:8px;font-size:9pt;color:#888;">Ci-après dénommé(e) « le Bénéficiaire »</p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Objet de la convention</div>
      <div class="article">
        <h4>Article 1 — Objet</h4>
        <p>L'Association met à disposition du Bénéficiaire les locaux du Château de Lillion, situés à Rennes, dans les conditions définies ci-après, pour l'usage suivant :</p>
        <p style="margin-top:8px;padding:10px;background:#f9f9f9;border-radius:4px;"><strong>${req.objet}</strong></p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Conditions de mise à disposition</div>

      <div class="article">
        <h4>Article 2 — Formule et durée</h4>
        <p><strong>Formule :</strong> ${formule.label}</p>
        <p><strong>Date${req.date_fin ? " de début" : ""} :</strong> ${formatDateFR(req.date_debut)}</p>
        ${req.date_fin ? `<p><strong>Date de fin :</strong> ${formatDateFR(req.date_fin)}</p>` : ""}
        <p><strong>Nombre de personnes attendues :</strong> ${req.nb_personnes}</p>
      </div>

      <div class="article">
        <h4>Article 3 — Tarif</h4>
        <div class="prix-box">
          <div class="montant">${prixText}</div>
          <div class="detail">${req.is_adherent ? "Tarif adhérent Roazhon Kastell" : "Tarif non-adhérent — TTC"}</div>
        </div>
        <p>Le règlement est dû à la signature de la présente convention, par virement bancaire ou chèque à l'ordre de « Association Roazhon Kastell ».</p>
      </div>

      <div class="article">
        <h4>Article 4 — État des lieux</h4>
        <p>Un état des lieux contradictoire est établi à l'entrée et à la sortie du Bénéficiaire. Les locaux doivent être restitués dans leur état initial : mobilier repositionné, déchets évacués, surfaces nettoyées.</p>
      </div>

      <div class="article">
        <h4>Article 5 — Remise en propreté</h4>
        <p>La remise en propreté des lieux est à la charge du Bénéficiaire. À défaut, cette prestation sera facturée <strong>100,00 € TTC</strong> en supplément, sans remise adhérent.</p>
      </div>

      <div class="article">
        <h4>Article 6 — Responsabilité</h4>
        <p>Le Bénéficiaire est responsable des dommages causés aux locaux, aux équipements et au mobilier pendant la durée de la mise à disposition. Toute dégradation constatée lors de l'état des lieux de sortie sera facturée au réel.</p>
      </div>

      <div class="article">
        <h4>Article 7 — Obligations du Bénéficiaire</h4>
        <ul>
          <li>Respecter la destination des locaux et ne pas les sous-louer.</li>
          <li>Respecter les horaires convenus et le voisinage.</li>
          <li>Se conformer aux règles de sécurité et d'hygiène en vigueur.</li>
          <li>Ne pas modifier l'agencement permanent des locaux sans accord préalable.</li>
          <li>Signaler immédiatement tout incident ou dégradation.</li>
        </ul>
      </div>

      <div class="article">
        <h4>Article 8 — Annulation</h4>
        <p>Toute annulation doit être communiquée par écrit au moins 15 jours avant la date prévue. En cas d'annulation tardive (moins de 7 jours), 50 % du montant est dû. En cas de non-présentation, le montant total est dû.</p>
      </div>

      ${req.besoins ? `
      <div class="article">
        <h4>Article 9 — Dispositions particulières</h4>
        <p>${req.besoins}</p>
      </div>` : ""}
    </div>

    <div class="section">
      <p style="font-size:10pt;color:#888;text-align:center;margin-bottom:8px;">
        Fait en deux exemplaires originaux, à Rennes, le ${today}.
      </p>
    </div>

    <div class="signatures">
      <div class="signature">
        <p>Pour l'Association<br />Roazhon Kastell</p>
        <div class="line">Signature et cachet</div>
      </div>
      <div class="signature">
        <p>Le Bénéficiaire<br />${req.prenom} ${req.nom}</p>
        <div class="line">Signature précédée de<br />« Lu et approuvé »</div>
      </div>
    </div>
  </div>

  <button class="print-btn no-print" onclick="window.print()">
    Imprimer / Enregistrer en PDF
  </button>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
