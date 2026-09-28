-- Seed: 3 articles pour la rubrique Actualités & conseils
-- Utilise le premier profil admin comme auteur collectif "Roazhon Kastell"
-- À exécuter sur la base locale uniquement.

DO $$
DECLARE
  v_author uuid;
BEGIN
  SELECT id INTO v_author FROM profiles WHERE 'admin' = ANY(roles) LIMIT 1;
  IF v_author IS NULL THEN
    RAISE EXCEPTION 'Aucun profil admin trouvé. Créez un compte admin avant d''exécuter ce seed.';
  END IF;

  -- Article 1 : Pourquoi rejoindre le Roazhon Kastell ?
  INSERT INTO articles (author_id, title, slug, excerpt, category, image_url, status, published_at, content)
  VALUES (
    v_author,
    'Pourquoi rejoindre le Roazhon Kastell ?',
    'pourquoi-rejoindre-roazhon-kastell',
    'Un lieu pour se retrouver, partager ses expériences et développer son activité avec d''autres professionnels de l''immobilier.',
    'Vie du collectif',
    '/articles/pourquoi-rejoindre.webp',
    'publie',
    now(),
    '<p>Être conseiller immobilier indépendant, c''est organiser son activité avec liberté. C''est aussi, parfois, avancer seul face à une question, un dossier ou une période plus calme. Au Roazhon Kastell, nous souhaitons donner une place aux échanges entre professionnels, dans un cadre où chacun peut contribuer et progresser.</p>
<h2>Un lieu pour retrouver ses collègues</h2>
<p>Se retrouver dans un même lieu permet de prendre du recul sur son quotidien. Une conversation autour d''un café, une question posée entre deux rendez-vous ou un retour d''expérience peuvent apporter un nouvel éclairage sur une situation.</p>
<p>Le château est un point de rencontre pour entretenir ces liens et faire vivre un collectif, au-delà des échanges à distance.</p>
<h2>Partager ses biens et ses recherches</h2>
<p>Les mardis coworking permettent de présenter ses biens, de découvrir ceux des autres conseillers et d''échanger sur les recherches de ses acquéreurs.</p>
<p>L''objectif : mieux connaître l''activité de ses collègues et repérer des possibilités de collaboration. Une présentation peut être le début d''un échange à poursuivre ensemble, en fonction des besoins de chacun.</p>
<h2>Continuer à progresser</h2>
<p>Les ateliers et les interventions de partenaires sont des occasions d''approfondir un sujet, de poser ses questions et de découvrir d''autres méthodes de travail.</p>
<p>L''intérêt se prolonge sur le terrain : essayer une pratique, l''adapter à son activité et partager ensuite ce que l''on en a retenu.</p>
<h2>Faire vivre le collectif</h2>
<p>Rejoindre le Roazhon Kastell, c''est aussi prendre part à sa dynamique : participer aux rendez-vous, proposer des sujets et partager son expérience.</p>
<p>Que l''on débute ou que l''on exerce depuis plusieurs années, chacun peut apporter quelque chose aux autres.</p>
<p>Envie de nous rejoindre ? Découvrez les modalités d''adhésion et les prochains rendez-vous du château.</p>'
  ) ON CONFLICT (slug) DO NOTHING;

  -- Article 2 : Les mardis coworking
  INSERT INTO articles (author_id, title, slug, excerpt, category, image_url, status, published_at, content)
  VALUES (
    v_author,
    'Les mardis coworking : des biens à présenter, des opportunités à partager',
    'mardis-coworking-biens-opportunites-partager',
    'Faire connaître ses mandats, découvrir les recherches de ses collègues et créer des occasions de travailler ensemble.',
    'Mardis coworking',
    '/articles/mardis-coworking.webp',
    'publie',
    now(),
    '<p>Et si l''acquéreur de l''un de vos biens était déjà en contact avec un autre conseiller ? Pour identifier ces rapprochements, encore faut-il connaître les mandats et les recherches de chacun. Les mardis coworking du Roazhon Kastell donnent une place à ces échanges.</p>
<h2>Présenter un bien avec les bonnes informations</h2>
<p>Une présentation efficace permet aux collègues de comprendre rapidement à qui le bien pourrait correspondre.</p>
<p>Préparez les informations essentielles : secteur, prix, surface, organisation des pièces, principaux atouts et contraintes à connaître. Quelques photos pertinentes permettent de rendre la présentation plus concrète.</p>
<p>L''objectif n''est pas de réciter toute l''annonce, mais de donner aux autres conseillers les éléments utiles pour faire le lien avec leurs acquéreurs.</p>
<h2>Parler aussi de ses recherches acquéreurs</h2>
<p>Les échanges ne concernent pas uniquement les biens disponibles. Présenter une recherche précise peut également ouvrir une piste.</p>
<p>Indiquez le secteur souhaité, le budget, les critères indispensables et les éventuelles souplesses. Partagez les besoins du projet sans diffuser inutilement les coordonnées ou les informations personnelles de vos clients.</p>
<h2>Poursuivre les échanges après le rendez-vous</h2>
<p>Lorsqu''une correspondance semble possible, prenez le temps de contacter le collègue concerné. Vérifiez ensemble les critères, les informations à transmettre et la prochaine étape.</p>
<p>Avant d''engager une collaboration, clarifiez son organisation et les modalités de partage applicables dans votre réseau. Un fonctionnement compris par chacun facilite la suite.</p>
<h2>Profiter des ateliers pour progresser</h2>
<p>Selon le programme, ces rencontres sont aussi l''occasion de participer à un atelier ou d''échanger avec un partenaire.</p>
<p>Venez avec une question concrète. Repartez avec une idée à tester dans votre activité, puis partagez votre retour lors d''un prochain rendez-vous.</p>
<h2>Préparer sa prochaine participation</h2>
<p>Avant de venir, sélectionnez les biens et les recherches que vous souhaitez présenter. Vérifiez que vos informations sont à jour et préparez des supports lisibles.</p>
<p>La valeur de ces rendez-vous repose sur la participation de chacun : des informations utiles, de l''écoute et un suivi des échanges.</p>'
  ) ON CONFLICT (slug) DO NOTHING;

  -- Article 3 : Photos immobilières
  INSERT INTO articles (author_id, title, slug, excerpt, category, image_url, status, published_at, content)
  VALUES (
    v_author,
    'Photos immobilières : bien préparer sa séance, pièce par pièce',
    'photos-immobilieres-preparer-seance',
    'Une méthode pratique pour anticiper la prise de vue et accompagner vos vendeurs dans la préparation du logement.',
    'Conseils métier',
    '/articles/photos-immobilieres.webp',
    'publie',
    now(),
    '<p>Une séance photo réussie commence avant de sortir l''appareil. En préparant le logement avec votre vendeur, vous facilitez la prise de vue et obtenez des images qui présentent les espaces de manière claire et fidèle.</p>
<h2>Préparer le vendeur en amont</h2>
<p>Avant le rendez-vous, transmettez une courte liste de consignes : dégager les surfaces, ranger les objets du quotidien, nettoyer les vitres et préparer les pièces qui seront photographiées.</p>
<p>Expliquez l''objectif : rendre les volumes et les usages plus lisibles. Demandez également de mettre à l''abri les documents personnels, les photos de famille et les objets de valeur visibles.</p>
<h2>Dans le séjour : rendre l''espace lisible</h2>
<p>Dégagez les passages et les tables. Replacez les coussins, ouvrez les rideaux et retirez les éléments qui attirent inutilement l''attention.</p>
<p>Choisissez des angles qui montrent l''organisation de la pièce et ses ouvertures. Évitez les prises de vue qui exagèrent les volumes.</p>
<h2>Dans la cuisine : simplifier les surfaces</h2>
<p>Libérez une partie du plan de travail, rangez la vaisselle et retirez les produits ménagers. Vérifiez les façades, l''évier et les surfaces réfléchissantes.</p>
<p>Quelques éléments sobres peuvent rester en place : la pièce doit paraître entretenue et accueillante.</p>
<h2>Dans les chambres : soigner les détails</h2>
<p>Faites préparer les lits, dégagez les tables de chevet et rangez les vêtements visibles. Vérifiez aussi ce qui apparaît derrière les portes et dans les miroirs.</p>
<p>Le cadrage doit permettre de comprendre la place du lit, les ouvertures et les possibilités de circulation.</p>
<h2>Dans la salle de bains : vérifier les reflets</h2>
<p>Retirez les produits de toilette, le linge à sécher et les accessoires superflus. Nettoyez les miroirs et les parois de douche.</p>
<p>Avant de déclencher, vérifiez que ni vous ni votre matériel n''apparaissez dans les reflets.</p>
<h2>À l''extérieur : préparer l''arrivée</h2>
<p>Si possible, dégagez l''accès, rangez les poubelles et préparez la terrasse ou le balcon. Prévenez le vendeur si un véhicule doit être déplacé pour la séance.</p>
<p>Choisissez le moment de la prise de vue en fonction de l''exposition et de la lumière disponible.</p>
<h2>Avant de partir : contrôler ses images</h2>
<p>Vérifiez la netteté, l''exposition, les verticales et la cohérence de la série. Assurez-vous d''avoir les vues nécessaires pour comprendre le logement.</p>
<p>Les retouches doivent rester fidèles à la réalité : corriger la lumière ne doit pas conduire à masquer un défaut ou à modifier les caractéristiques du bien.</p>
<p>Une préparation simple et anticipée vous permet de consacrer davantage de temps aux cadrages et à la qualité de votre présentation.</p>'
  ) ON CONFLICT (slug) DO NOTHING;

END $$;
