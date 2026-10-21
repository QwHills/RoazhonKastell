import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser, isAdmin, canManageMembers } from "@/lib/supabase/auth";

function formatSiren(rsac: string): string {
  const digits = rsac.replace(/\s/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  }
  return rsac;
}

function getDateDebutContrat(validationDate: Date): Date {
  return new Date(validationDate.getFullYear(), validationDate.getMonth() + 1, 1);
}

function formatDateFR(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateFRLong(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function GET(request: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile || (!isAdmin(profile) && !canManageMembers(profile))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: member, error } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !member) {
    return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
  }

  const today = new Date();
  const dateDebut = getDateDebutContrat(today);
  const cotisation = member.cotisation_mensuelle ?? 19.99;
  const siren = member.rsac_number ? formatSiren(member.rsac_number) : "_______________";
  const rsacCity = member.rsac_city || "Rennes";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contrat adhérent — ${member.first_name} ${member.last_name}</title>
  <style>
    @media print {
      body { margin: 0; padding: 15mm; font-size: 10pt; }
      .no-print { display: none !important; }
      .page { box-shadow: none; border: none; padding: 0; }
      @page { margin: 15mm; size: A4; }
      .page-break { page-break-before: always; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      font-size: 10.5pt;
      line-height: 1.55;
      color: #1a1a1a;
      padding: 30px;
      max-width: 800px;
      margin: 0 auto;
      background: #f5f5f5;
    }
    .page {
      background: white;
      padding: 45px;
      border: 1px solid #e5e5e5;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin-bottom: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .header h1 {
      font-size: 17pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #1e3a5f;
      margin-bottom: 4px;
    }
    .header .sub {
      font-size: 10pt;
      color: #6b7280;
    }
    .parties {
      margin-bottom: 24px;
    }
    .parties-title {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6b7280;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .parties-grid {
      display: flex;
      gap: 24px;
    }
    .partie {
      flex: 1;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 14px;
    }
    .partie h3 {
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #9ca3af;
      margin-bottom: 6px;
    }
    .partie p { margin-bottom: 2px; }
    .partie strong { font-weight: 600; }
    .partie .note {
      font-size: 8.5pt;
      color: #9ca3af;
      font-style: italic;
      margin-top: 6px;
    }
    .intro {
      margin-bottom: 24px;
      font-size: 10pt;
      color: #4b5563;
    }
    .section-title {
      font-size: 13pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #1e3a5f;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 5px;
      margin-bottom: 16px;
      margin-top: 28px;
    }
    .article {
      margin-bottom: 14px;
    }
    .article h4 {
      font-weight: 700;
      font-size: 10.5pt;
      margin-bottom: 4px;
    }
    .article p {
      margin-bottom: 4px;
    }
    .article ul {
      padding-left: 18px;
      margin-bottom: 4px;
    }
    .article li {
      margin-bottom: 2px;
    }
    .tarif-box {
      background: #f0f4ff;
      border: 1px solid #d0d9f0;
      border-radius: 6px;
      padding: 14px;
      text-align: center;
      margin: 10px 0;
    }
    .tarif-box .montant {
      font-size: 22pt;
      font-weight: 700;
      color: #1e3a5f;
    }
    .tarif-box .detail {
      font-size: 9pt;
      color: #6b7280;
      margin-top: 2px;
    }
    .signatures {
      display: flex;
      gap: 30px;
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .signature {
      flex: 1;
      text-align: center;
    }
    .signature .label {
      font-size: 10pt;
      color: #2563eb;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .signature .name {
      font-size: 10pt;
      margin-bottom: 60px;
    }
    .signature .line {
      border-top: 1px solid #d1d5db;
      padding-top: 6px;
      font-size: 9pt;
      color: #9ca3af;
      font-style: italic;
    }
    .fait {
      text-align: center;
      font-size: 10pt;
      color: #6b7280;
      margin-top: 28px;
    }
    .print-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #1e3a5f;
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
    .print-btn:hover { background: #2a4f7a; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Contrat de prestation de service<br />adhérent IAD</h1>
    </div>

    <div class="parties">
      <p class="parties-title">Entre les soussignés</p>
      <div class="parties-grid">
        <div class="partie">
          <h3>Le Prestataire</h3>
          <p><strong>Association Loi 1901 Roazhon Kastell</strong></p>
          <p>Lillion 35000 Rennes</p>
          <p class="note">Ci-après dénommée le « Prestataire »</p>
        </div>
        <div class="partie">
          <h3>Le Bénéficiaire</h3>
          <p><strong>${member.first_name} ${member.last_name}</strong></p>
          <p>Agent commercial${member.address ? `, domicilié au : ${member.address}` : ""}</p>
          <p>Email : ${member.email}</p>
          <p>SIREN : ${siren}</p>
          <p>Immatriculé au RSAC de ${rsacCity} sous le n° : ${siren}</p>
          <p>ID IAD : ${member.iad_id || "—"}</p>
          <p class="note">Ci-après dénommé le « Bénéficiaire »</p>
        </div>
      </div>
    </div>

    <div class="intro">
      <p>Le présent contrat de prestation de services est constitué des conditions particulières prévues dans la partie A ci-dessous les « <strong>Conditions Particulières</strong> » et des conditions générales ci-après les « <strong>Conditions Générales</strong> ».</p>
      <p style="margin-top:6px;">Le présent contrat est l'équivalent commercial d'un contrat d'hébergement hôtelier. L'ensemble de l'espace demeure en la possession et sous le contrôle du Prestataire. Le bénéficiaire prend acte du fait que le Contrat ne constitue pas une tenance, un bail emphytéotique ni ne confère aucun droit de propriété en sa faveur sur le ou les espaces.</p>
      <p style="margin-top:6px;">En cas de contradiction entre une ou plusieurs stipulations figurant dans les Conditions Générales ou les Conditions Particulières, la stipulation figurant dans les Conditions Particulières prévaudra.</p>
    </div>

    <div class="section-title">A. Conditions particulières</div>

    <div class="article">
      <h4>A.1 — Obligation du Prestataire à l'égard du bénéficiaire</h4>
      <p>Le Prestataire fournit au Bénéficiaire plusieurs prestations définies ci-dessous au sein d'un espace de travail dont les caractéristiques sont les suivantes :</p>
      <ul>
        <li><strong>Adresse de l'espace :</strong> LILLION 35000 RENNES</li>
        <li><strong>Surface totale de l'espace :</strong> 550 m² environ</li>
        <li><strong>Description de l'espace :</strong> Voir plan annexe</li>
        <li>Les bureaux réservés partenaires avec réception de clientèle ne seront pas accessibles aux conseillers IAD afin de ne pas générer de confusion, les conseillers IAD ne reçoivent pas de clientèle.</li>
      </ul>
      <p style="margin-top:8px;">Au titre de la fourniture des prestations incombant au Prestataire au profit du Bénéficiaire, le Prestataire devra laisser accéder le Bénéficiaire à l'Espace dans les conditions suivantes :</p>
      <ul>
        <li>Accès à l'espace de 08h à 20h du Lundi au Samedi (hors événements exceptionnels accordés par Le Prestataire Roazhon Kastell).</li>
        <li>Mise à disposition d'une clé d'accès via une boîte sécurisée ou autres moyens mis en œuvre.</li>
        <li>Mise à disposition IAD (roll-up, urne, porte-brochure, télévision, tableau, etc.). Accès aux espaces communs et équipements.</li>
        <li>Paiement des taxes et charges incluses : électricité / chauffage / eau − Connexion Internet fibre optique par wifi ou câble RJ45.</li>
      </ul>
      <p style="margin-top:6px;">Les Parties reconnaissent que le Contrat s'applique à l'ensemble des Prestations énumérées ci-dessus. Toute prestation qui ne serait pas expressément énumérée dans le Contrat sera exclue des présentes et le Bénéficiaire ne pourra pas exiger en bénéficier.</p>
    </div>

    <div class="article">
      <h4>A.2 — Durées</h4>
      <ul>
        <li><strong>Date de début du contrat (prise d'effet) :</strong> ${formatDateFR(dateDebut)}</li>
        <li><strong>Durée initiale et minimum du contrat :</strong> 6 MOIS</li>
        <li><strong>Préavis de résiliation du contrat par le Bénéficiaire :</strong> 1 MOIS</li>
      </ul>
    </div>

    <div class="article">
      <h4>A.3 — Tarifs</h4>
      <div class="tarif-box">
        <div class="montant">${cotisation.toFixed(2).replace(".", ",")} € TTC / mois</div>
        <div class="detail">Hors participations éventuelles lors d'événements exceptionnels</div>
      </div>
      <p style="font-size:9pt;color:#6b7280;font-style:italic;">NB : Le Prestataire pourra faire évoluer le tarif des prestations à tout moment après la durée initiale et minimum du contrat. Le Prestataire devra notifier le Bénéficiaire au moins 3 mois avant toute modification du Tarif. Cette notification pourra être faite par email ou lettre recommandée avec avis de réception.</p>
    </div>

    <div class="article">
      <h4>A.4 — Modalités de paiement</h4>
      <p>Paiement des adhésions mensuelles d'office par <strong>prélèvement SEPA</strong> du 1 au 5 du mois en cours. Chaque mois entamé est dû dans sa totalité.</p>
    </div>

    <div class="article">
      <h4>A.5 — Garanties</h4>
      <p><strong>Dépôt de garantie :</strong> Un mois d'adhésion (soit ${cotisation.toFixed(2).replace(".", ",")} €) pour les paiements mensuels.</p>
    </div>

    <div class="article">
      <h4>A.6 — État des lieux</h4>
      <p>Observations relatives à l'état des lieux d'entrée :</p>
      <ul>
        <li>Le Bénéficiaire est tenu de respecter l'ensemble du site et d'être soigneux avec les matériels mis à sa disposition.</li>
        <li>En cas de manquement, le Bénéficiaire pourrait se voir redevable du montant de remise en état ou du remplacement des matériels.</li>
      </ul>
    </div>

    <div class="article">
      <h4>A.7 — Documents à remettre</h4>
      <p>Documents à remettre à l'Hébergeur :</p>
      <ul>
        <li>Avis de situation SIRENE / justificatif RSAC de moins de 3 mois ;</li>
        <li>Copie de la pièce d'identité du représentant légal / de l'agent commercial.</li>
      </ul>
    </div>
  </div>

  <div class="page page-break">
    <div class="section-title">B. Conditions générales</div>

    <div class="article">
      <h4>B.1 — Objet</h4>
      <p>Le Contrat de prestation de services a pour objet la fourniture de plusieurs prestations d'ordre logistique et bureautique, outre l'accès à des services. Le présent contrat est l'équivalent commercial d'un contrat d'hébergement hôtelier. L'ensemble de l'espace demeure en la possession et sous le contrôle du Prestataire.</p>
      <p>Le bénéficiaire prend acte du fait que le Contrat ne constitue pas une tenance, un bail emphytéotique ni ne confère aucun droit de propriété en sa faveur sur le ou les espaces.</p>
      <p>L'adresse de l'Espace ne pourra en aucun cas être utilisée comme siège social, comme établissement secondaire ou comme lieu principal d'activité du Bénéficiaire. Cette clause constitue une condition déterminante du Prestataire sans l'acceptation de laquelle il n'aurait pas accepté de contracter avec le Bénéficiaire.</p>
      <p>Le non-respect de cette clause entraînera de plein droit la résiliation du Contrat, sans mise en demeure préalable, sur notification adressée par le Prestataire au Bénéficiaire par email ou lettre recommandée avec avis de réception.</p>
    </div>

    <div class="article">
      <h4>B.2 — Prestations</h4>
      <p>Le Prestataire assure, au profit du Bénéficiaire, les Prestations énumérées dans les conditions particulières composées de l'accès à un ou plusieurs Espaces ainsi que de Prestations de services.</p>
    </div>

    <div class="article">
      <h4>B.2.1 — Accès à l'Espace</h4>
      <p>Aux termes du Contrat, le Bénéficiaire bénéficie de l'accès à l'Espace ayant un usage exclusif d'espace de travail lié à l'activité de IAD France, sans réception de clientèle, ni de collègues ne bénéficiant pas d'un contrat de prestation de service sauf autorisation exceptionnelle du prestataire, ce que le Bénéficiaire certifie et garantit. Aucun autre usage qu'un usage d'espace de travail ne pourra être toléré, étant précisé que toute violation de cette stipulation entraînera automatiquement la résiliation du Contrat.</p>
      <p>La localisation et la description des Espaces sont précisées dans les Conditions Particulières ainsi qu'au plan annexe.</p>
    </div>

    <div class="article">
      <h4>B.2.2 — Prestations de services</h4>
      <p>Le Prestataire s'engage à faire bénéficier au Bénéficiaire d'un ensemble d'infrastructures logistiques telles que spécifiées dans les Conditions Particulières (ci-après le(s) « Service(s) »). Seuls les Services listés dans les Conditions Particulières peuvent être exigés par le Bénéficiaire à l'exclusion de tout autre.</p>
    </div>

    <div class="article">
      <h4>B.3 — Obligations des parties</h4>
      <p><strong>B.3.1 — Obligations du Prestataire :</strong> Durant la durée d'exécution du Contrat, le Prestataire s'engage à fournir au Bénéficiaire les prestations des services listées dans les Conditions Particulières.</p>
      <p style="margin-top:8px;"><strong>B.3.2 — Obligations du Bénéficiaire :</strong> Durant l'exécution du Contrat, le Bénéficiaire s'engage à :</p>
      <ul>
        <li>Ne jamais utiliser l'adresse de l'Espace comme siège social ou établissement ;</li>
        <li>Tenir informé le Prestataire de toute modification concernant son activité IAD ;</li>
        <li>Contracter une assurance RCP.</li>
      </ul>
      <p style="margin-top:6px;">Le Bénéficiaire reconnaît et accepte expressément que le Contrat ne lui confère aucun droit identique ou similaire à ceux conférés par :</p>
      <ul>
        <li>Un contrat de bail et notamment les contrats de bail commercial, professionnel, emphytéotique ou précaire ;</li>
        <li>Un contrat de sous-location ;</li>
        <li>Un droit de propriété sur les Espaces ;</li>
        <li>Un droit de propriété commerciale.</li>
      </ul>
      <p style="margin-top:6px;">En particulier, le Bénéficiaire s'engage à ne jamais revendiquer à l'encontre du Prestataire les droits issus des articles L. 145-1 et suivants du Code du commerce. Le Bénéficiaire s'engage à considérer et traiter comme confidentielles toutes les informations concernant les activités du Prestataire et des autres personnes présentes.</p>
      <p>Au terme de la durée du Contrat, le Bénéficiaire devra avoir quitté l'Espace, restitué les clés et remis l'Espace dans son état d'origine.</p>
    </div>

    <div class="article">
      <h4>B.4 — Mandat</h4>
      <p><em>Sans objet</em></p>
    </div>

    <div class="article">
      <h4>B.5 — Durée</h4>
      <p>Le Contrat est consenti pour une durée minimale de 6 mois comme défini dans les Conditions Particulières.</p>
    </div>

    <div class="article">
      <h4>B.6 — Résiliation</h4>
      <p>Le présent Contrat pourra être résilié, à l'issue de la durée minimale du Contrat, à tout moment par l'une ou l'autre des parties par lettre recommandée avec avis de réception (ou par email avec réponse accusant réception) et moyennant un préavis minimum d'un (1) mois prévu dans les Conditions Particulières.</p>
      <p>En cas de manquement à ses obligations contractuelles par l'une des Parties, l'autre Partie pourra procéder à la résiliation du présent Contrat immédiatement après une mise en demeure restée infructueuse.</p>
    </div>

    <div class="article">
      <h4>B.7 — Tarifs des Prestations</h4>
      <p>Les Prestations visées dans les Conditions Particulières sont fournies moyennant des frais mensuels de ${cotisation.toFixed(2).replace(".", ",")} € TTC / mois payable par prélèvement SEPA mensuel du 1 au 5 de chaque mois.</p>
    </div>

    <div class="article">
      <h4>B.8 — Sous-location ou accès à l'espace</h4>
      <p>Sauf autorisation exceptionnelle, le Bénéficiaire n'aura en aucun cas le droit de sous-louer, donner accès à l'Espace à un tiers ou de prêter les clés.</p>
    </div>

    <div class="article">
      <h4>B.9 — Assurance</h4>
      <p>Le Bénéficiaire est responsable du matériel qu'il entrepose. Il est vivement conseillé au Bénéficiaire de s'assurer pour son activité professionnelle (assurance civile professionnelle) et pour les espaces qu'il occupe (assurance multirisque bureaux).</p>
    </div>

    <div class="article">
      <h4>B.10 — Confidentialité</h4>
      <p>Les Parties s'engagent à traiter comme confidentielles toutes les informations qu'elles seraient amenées à obtenir dans le cadre de ce Contrat.</p>
    </div>

    <div class="article">
      <h4>B.11 — Responsabilité des Parties</h4>
      <p>Le Prestataire décline toute responsabilité en cas de dommage indirect ou de force majeure occasionnant une indisponibilité des locaux, sauf faute lourde ou négligence prouvée.</p>
    </div>

    <div class="article">
      <h4>B.12 — Dispositions diverses</h4>
      <p>Si tout ou partie d'une stipulation du présent Contrat est jugée illégale ou inapplicable, les autres stipulations conserveront toute leur force et portée.</p>
    </div>

    <div class="article">
      <h4>Article 13 — Attribution de juridiction</h4>
      <p>Tout litige pouvant survenir entre les Parties à l'occasion de l'exécution du présent contrat devra être porté devant le tribunal de commerce de RENNES.</p>
    </div>

    <div class="article">
      <h4>Article 14 — Élection de domicile</h4>
      <p>Pour l'exécution des présentes et la signification de tous actes, les Parties élisent domicile en leurs sièges / adresses respectifs.</p>
    </div>

    <p class="fait"><strong>Fait à Rennes, le ${formatDateFR(today)}</strong><br />En deux originaux.</p>

    <div class="signatures">
      <div class="signature">
        <div class="label">Pour le Prestataire (Roazhon Kastell)</div>
        <div class="name">Le bureau représenté par<br /><strong>Gianni SCHIARITI</strong></div>
        <div class="line">Lu et approuvé</div>
      </div>
      <div class="signature">
        <div class="label">Pour le Bénéficiaire</div>
        <div class="name"><strong>${member.first_name} ${member.last_name}</strong></div>
        <div class="line">Lu et approuvé</div>
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
