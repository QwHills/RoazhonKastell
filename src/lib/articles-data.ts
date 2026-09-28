export interface ArticleHighlight {
  title: string;
  description: string;
}

export interface ArticleTip {
  sectionIndex: number;
  title: string;
  text: string;
}

export interface StaticArticle {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  image_url: string;
  image_alt: string;
  image_position?: string;
  content: string;
  published_at: string;
  cta: { label: string; href: string };
  ctaPhrase: string;
  introTitle: string;
  highlights: ArticleHighlight[];
  tips: ArticleTip[];
}

export const staticArticles: StaticArticle[] = [
  {
    slug: "pourquoi-rejoindre-roazhon-kastell",
    title: "Pourquoi rejoindre le Roazhon Kastell ?",
    category: "Vie du collectif",
    excerpt:
      "Un lieu pour se retrouver, partager ses expériences et développer son activité.",
    image_url: "/articles/pourquoi-rejoindre.jpg",
    image_alt:
      "Conseillers assis dans le parc du château",
    published_at: "2026-09-23T10:00:00+02:00",
    cta: { label: "Découvrir l'adhésion", href: "/#adhesions" },
    ctaPhrase: "Et si on se retrouvait au château ?",
    introTitle: "Indépendant dans votre activité, entouré dans votre quotidien.",
    highlights: [
      { title: "Échanger entre collègues", description: "Des rencontres qui font avancer votre quotidien." },
      { title: "Partager des opportunités", description: "Des biens, des acquéreurs, des mises en relation." },
      { title: "Progresser ensemble", description: "Des retours d'expérience et des conseils concrets." },
    ],
    tips: [
      { sectionIndex: 1, title: "Le bon réflexe", text: "Préparez 3 biens à présenter et une recherche acquéreur précise." },
    ],
    content: `<p class="lead">Au Roazhon Kastell, nous croyons à la force du collectif. Ici, des professionnels de l'immobilier se retrouvent pour échanger, partager des opportunités et progresser ensemble, dans un cadre unique et bienveillant.</p>

<h2>Un lieu pour retrouver ses collègues</h2>
<p>Un échange autour d'un café, une question entre deux rendez-vous, un retour d'expérience : le collectif enrichit le quotidien.</p>
<p>Le château est un point de rencontre pour entretenir ces liens et prendre du recul sur son activité.</p>

<h2>Partager ses biens et ses recherches</h2>
<p>Les mardis coworking permettent de présenter ses biens et de découvrir les recherches de ses collègues.</p>
<p>L'objectif : mieux connaître l'activité de chacun et repérer des possibilités de collaboration. Une présentation peut être le début d'un échange à poursuivre ensemble.</p>

<h2>Continuer à progresser</h2>
<p>Les ateliers et les interventions de partenaires sont des occasions d'approfondir un sujet, de poser ses questions et de découvrir d'autres méthodes de travail.</p>
<p>L'intérêt se prolonge sur le terrain : essayer une pratique, l'adapter à son activité et partager ce que l'on en a retenu.</p>

<h2>Faire vivre le collectif</h2>
<p>Rejoindre le Roazhon Kastell, c'est prendre part à sa dynamique : participer aux rendez-vous, proposer des sujets et partager son expérience.</p>
<p>Que l'on débute ou que l'on exerce depuis plusieurs années, chacun apporte quelque chose aux autres.</p>`,
  },
  {
    slug: "mardis-coworking-biens-opportunites-partager",
    title:
      "Les mardis coworking : des biens à présenter, des opportunités à partager",
    category: "Mardis coworking",
    excerpt:
      "Faire connaître ses mandats, découvrir les recherches de ses collègues et créer des occasions de travailler ensemble.",
    image_url: "/articles/mardis-coworking.webp",
    image_alt:
      "Réunion de conseillers immobiliers dans une salle du château avec présentation sur écran",
    published_at: "2026-09-23T10:00:00+02:00",
    cta: { label: "Voir les prochains rendez-vous", href: "/agenda" },
    ctaPhrase: "Prêt pour le prochain mardi ?",
    introTitle: "Le bon échange, au bon moment.",
    highlights: [
      { title: "Présenter ses biens", description: "Faire connaître ses mandats aux collègues." },
      { title: "Partager ses recherches", description: "Croiser les besoins acquéreurs du réseau." },
      { title: "Poursuivre les échanges", description: "Créer des collaborations après le rendez-vous." },
    ],
    tips: [
      { sectionIndex: 0, title: "Le bon réflexe", text: "Préparez 3 biens à présenter et une recherche acquéreur précise." },
    ],
    content: `<p class="lead">Et si l'acquéreur de l'un de vos biens était déjà en contact avec un autre conseiller ? Pour identifier ces rapprochements, encore faut-il connaître les mandats et les recherches de chacun. Les mardis coworking du Roazhon Kastell donnent une place à ces échanges.</p>

<h2>Présenter un bien avec les bonnes informations</h2>
<p>Une présentation efficace permet aux collègues de comprendre rapidement à qui le bien pourrait correspondre.</p>
<p>Préparez les informations essentielles : secteur, prix, surface, organisation des pièces, principaux atouts et contraintes à connaître.</p>
<p>L'objectif n'est pas de réciter toute l'annonce, mais de donner les éléments utiles pour faire le lien avec leurs acquéreurs.</p>

<h2>Parler aussi de ses recherches acquéreurs</h2>
<p>Les échanges ne concernent pas uniquement les biens disponibles. Présenter une recherche précise peut également ouvrir une piste.</p>
<p>Indiquez le secteur souhaité, le budget et les critères indispensables. Partagez les besoins du projet sans diffuser inutilement les informations personnelles de vos clients.</p>

<h2>Poursuivre les échanges après le rendez-vous</h2>
<p>Lorsqu'une correspondance semble possible, prenez le temps de contacter le collègue concerné. Vérifiez ensemble les critères et la prochaine étape.</p>
<p>Avant d'engager une collaboration, clarifiez les modalités de partage applicables dans votre réseau.</p>

<h2>Profiter des ateliers pour progresser</h2>
<p>Selon le programme, ces rencontres sont aussi l'occasion de participer à un atelier ou d'échanger avec un partenaire.</p>
<p>Venez avec une question concrète. Repartez avec une idée à tester dans votre activité.</p>

<h2>Préparer sa prochaine participation</h2>
<p>Avant de venir, sélectionnez les biens et les recherches que vous souhaitez présenter. Vérifiez que vos informations sont à jour.</p>
<p>La valeur de ces rendez-vous repose sur la participation de chacun : des informations utiles, de l'écoute et un suivi des échanges.</p>`,
  },
  {
    slug: "photos-immobilieres-preparer-seance",
    title:
      "Photos immobilières : bien préparer sa séance, pièce par pièce",
    category: "Conseils métier",
    excerpt:
      "Une méthode pratique pour anticiper la prise de vue et accompagner vos vendeurs dans la préparation du logement.",
    image_url: "/articles/photos-immobilieres.jpg",
    image_alt:
      "Vue aérienne du château et de l'étang",
    image_position: "center 70%",
    published_at: "2026-09-23T10:00:00+02:00",
    cta: { label: "Découvrir les prochains ateliers", href: "/agenda" },
    ctaPhrase: "Envie d'aller plus loin ?",
    introTitle: "Bien préparer pour bien photographier.",
    highlights: [
      { title: "Anticiper avec le vendeur", description: "Transmettre les consignes avant la séance." },
      { title: "Préparer chaque pièce", description: "Dégager, ranger, mettre en valeur." },
      { title: "Vérifier ses prises de vue", description: "Contrôler avant de quitter le logement." },
    ],
    tips: [
      { sectionIndex: 6, title: "Le bon réflexe", text: "Avant de partir, vérifiez : netteté, exposition, verticales, cohérence de la série et toutes les vues nécessaires." },
    ],
    content: `<p class="lead">Une séance photo réussie commence avant de sortir l'appareil. En préparant le logement avec votre vendeur, vous facilitez la prise de vue et obtenez des images fidèles.</p>

<h2>Préparer le vendeur en amont</h2>
<p>Transmettez une courte liste de consignes : dégager les surfaces, ranger les objets du quotidien, nettoyer les vitres et préparer les pièces.</p>
<p>Demandez de mettre à l'abri les documents personnels, les photos de famille et les objets de valeur visibles.</p>

<h2>Dans le séjour : rendre l'espace lisible</h2>
<p>Dégagez les passages et les tables. Replacez les coussins, ouvrez les rideaux et retirez les éléments qui attirent inutilement l'attention.</p>
<p>Choisissez des angles qui montrent l'organisation de la pièce et ses ouvertures.</p>

<h2>Dans la cuisine : simplifier les surfaces</h2>
<p>Libérez une partie du plan de travail, rangez la vaisselle et retirez les produits ménagers.</p>
<p>Quelques éléments sobres peuvent rester en place : la pièce doit paraître entretenue et accueillante.</p>

<h2>Dans les chambres : soigner les détails</h2>
<p>Faites préparer les lits, dégagez les tables de chevet et rangez les vêtements visibles.</p>
<p>Le cadrage doit permettre de comprendre la place du lit, les ouvertures et les possibilités de circulation.</p>

<h2>Dans la salle de bains : vérifier les reflets</h2>
<p>Retirez les produits de toilette, le linge à sécher et les accessoires superflus. Nettoyez les miroirs.</p>
<p>Avant de déclencher, vérifiez que ni vous ni votre matériel n'apparaissez dans les reflets.</p>

<h2>À l'extérieur : préparer l'arrivée</h2>
<p>Si possible, dégagez l'accès, rangez les poubelles et préparez la terrasse ou le balcon.</p>
<p>Choisissez le moment de la prise de vue en fonction de l'exposition et de la lumière disponible.</p>

<h2>Avant de partir : contrôler ses images</h2>
<p>Vérifiez la netteté, l'exposition, les verticales et la cohérence de la série.</p>
<p>Les retouches doivent rester fidèles à la réalité : corriger la lumière ne doit pas masquer un défaut ou modifier les caractéristiques du bien.</p>`,
  },
];
