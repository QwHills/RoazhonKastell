-- Migration des partenaires existants vers Supabase
-- Données extraites de src/data/partenaires.ts

-- Cafpi
INSERT INTO partners (id, name, category, sector, services, logo_url, remuneration, status)
VALUES (
  gen_random_uuid(), 'Cafpi', 'Finance & Assurance',
  'Prêt immobilier, Prêt professionnel, Assurance emprunteur',
  'Prêt immobilier, Prêt professionnel, Assurance emprunteur',
  '/logos/cafpi.svg', true, 'valide'
);

INSERT INTO partner_contacts (id, partner_id, name, phone, email, note, sort_order)
SELECT gen_random_uuid(), p.id, c.name, c.phone, c.email, c.note, c.sort_order
FROM partners p,
(VALUES
  ('Julie Monreal', '06 42 45 19 77', 'j.monreal@cafpi.fr', 'Prêt immo, Assurance emprunteur', 0),
  ('Sadok Blanchais', '06 48 38 98 09', 's.blanchais@cafpi.fr', 'Prêt immo, Assurance emprunteur', 1),
  ('Florian Morgant', '06 17 80 44 06', 'f.morgant@cafpi.fr', 'Prêt immo, Assurance emprunteur', 2),
  ('Kevin Cabaillot', '06 77 37 69 91', 'k.cabaillot@cafpi.fr', 'Prêt immo, Prêt pro, Assurance emprunteur', 3)
) AS c(name, phone, email, note, sort_order)
WHERE p.name = 'Cafpi';

-- EB Expertise
INSERT INTO partners (id, name, category, sector, logo_url, remuneration, status)
VALUES (gen_random_uuid(), 'EB Expertise', 'Finance & Assurance', 'Expert comptable', '/logos/eb-expertise.jpg', false, 'valide');

INSERT INTO partner_contacts (id, partner_id, name, phone, email, sort_order)
SELECT gen_random_uuid(), p.id, 'Emmanuelle Bourgogne', '06 61 98 43 58', 'emmanuelle.bourgogne@eb-expertise.com', 0
FROM partners p WHERE p.name = 'EB Expertise';

-- AXA
INSERT INTO partners (id, name, category, sector, logo_url, remuneration, status)
VALUES (gen_random_uuid(), 'AXA', 'Finance & Assurance', 'Assurance, mutuelle et prévoyance', '/logos/axa.svg', false, 'valide');

INSERT INTO partner_contacts (id, partner_id, name, phone, email, sort_order)
SELECT gen_random_uuid(), p.id, 'Sébastien Packer', '07 59 66 46 33', 'sebastien.packer.a2p@axa.fr', 0
FROM partners p WHERE p.name = 'AXA';

-- Allegacie
INSERT INTO partners (id, name, category, sector, remuneration, status)
VALUES (gen_random_uuid(), 'Allegacie', 'Finance & Assurance', 'Family Office — Stratégie patrimoniale, fiscalité, transmission et investissement', true, 'valide');

INSERT INTO partner_contacts (id, partner_id, name, phone, email, sort_order)
SELECT gen_random_uuid(), p.id, c.name, c.phone, c.email, c.sort_order
FROM partners p,
(VALUES
  ('Florent Allombert', '06 62 69 99 32', 'fallombert@allegacie.fr', 0),
  ('Julie Ribeiro Fernandes', '06 34 17 02 42', 'jribeirofernandes@allegacie.fr', 1)
) AS c(name, phone, email, sort_order)
WHERE p.name = 'Allegacie';

-- BC2E
INSERT INTO partners (id, name, category, sector, logo_url, remuneration, status)
VALUES (gen_random_uuid(), 'BC2E', 'Diagnostic', 'Diagnostiqueur immobilier', '/logos/bc2e.png', false, 'valide');

INSERT INTO partner_contacts (id, partner_id, name, phone, email, sort_order)
SELECT gen_random_uuid(), p.id, 'Nicolas Wentzinger', '07 60 03 12 83', 'nicolas.wentzinger@bc2e.com', 0
FROM partners p WHERE p.name = 'BC2E';

-- Real Diag
INSERT INTO partners (id, name, category, sector, logo_url, remuneration, status)
VALUES (gen_random_uuid(), 'Real Diag', 'Diagnostic', 'Diagnostiqueur immobilier', '/logos/real-diag.png', false, 'valide');

INSERT INTO partner_contacts (id, partner_id, name, phone, email, sort_order)
SELECT gen_random_uuid(), p.id, 'Christophe Garnier', '06 31 24 44 14', 'contact@real-diag.fr', 0
FROM partners p WHERE p.name = 'Real Diag';

-- Maisons Demeurance
INSERT INTO partners (id, name, category, sector, logo_url, remuneration, status)
VALUES (gen_random_uuid(), 'Maisons Demeurance', 'Travaux & Rénovation', 'Constructeur de maisons individuelles', '/logos/maisons-demeurance.svg', true, 'valide');

INSERT INTO partner_contacts (id, partner_id, name, phone, email, sort_order)
SELECT gen_random_uuid(), p.id, 'Aymeric Lemoine', '06 98 74 98 50', 'alemoine@maisons-demeurance.com', 0
FROM partners p WHERE p.name = 'Maisons Demeurance';

-- Inside Conception
INSERT INTO partners (id, name, category, sector, remuneration, status)
VALUES (gen_random_uuid(), 'Inside Conception', 'Travaux & Rénovation', 'Chiffrage, travaux, rénovation et aménagement', true, 'valide');

INSERT INTO partner_contacts (id, partner_id, name, phone, email, sort_order)
SELECT gen_random_uuid(), p.id, 'Nicolas Paillard', '06 61 62 33 24', 'nicolas.paillard@insideconception.net', 0
FROM partners p WHERE p.name = 'Inside Conception';

-- Inoker
INSERT INTO partners (id, name, category, sector, logo_url, remuneration, status)
VALUES (gen_random_uuid(), 'Inoker', 'Travaux & Rénovation', 'Plomberie, chauffage, sanitaire, électricité et menuiserie', '/logos/inoker.png', false, 'valide');

INSERT INTO partner_contacts (id, partner_id, name, phone, email, note, sort_order)
SELECT gen_random_uuid(), p.id, c.name, c.phone, c.email, c.note, c.sort_order
FROM partners p,
(VALUES
  ('Axel Leullier', '06 29 66 15 92', 'a.leullier@inoker.fr', 'Plomberie, chauffage, sanitaire, élec', 0),
  ('Anthony Gilbert', '06 29 05 29 20', 'a.gilbert@inoker.fr', 'Plomberie, chauffage, sanitaire, élec', 1),
  ('Pierre Henry', '06 43 88 10 81', 'p.henry@inoker.fr', 'Menuiserie', 2)
) AS c(name, phone, email, note, sort_order)
WHERE p.name = 'Inoker';

-- Esmée Services
INSERT INTO partners (id, name, category, sector, logo_url, remuneration, status)
VALUES (gen_random_uuid(), 'Esmée Services', 'Services', 'Nettoyage, vide maison et travaux divers', '/logos/esmee-services.png', true, 'valide');

INSERT INTO partner_contacts (id, partner_id, name, phone, email, sort_order)
SELECT gen_random_uuid(), p.id, 'Didier Goksuguzel', '06 15 57 43 77', 'esmeeservices35@gmail.com', 0
FROM partners p WHERE p.name = 'Esmée Services';

-- Cuisines Envia
INSERT INTO partners (id, name, category, sector, logo_url, remuneration, status)
VALUES (gen_random_uuid(), 'Cuisines Envia', 'Habitat & Équipement', 'Cuisiniste', '/logos/cuisines-envia.png', true, 'valide');

INSERT INTO partner_contacts (id, partner_id, name, phone, email, sort_order)
SELECT gen_random_uuid(), p.id, c.name, c.phone, c.email, c.sort_order
FROM partners p,
(VALUES
  ('Mélanie Cuisinier', '07 56 41 94 67', 'melanie.envia.gusto@gmail.com', 0),
  ('Kevin Lhermenier', '06 17 95 06 48', 'envia35@envia.fr', 1)
) AS c(name, phone, email, sort_order)
WHERE p.name = 'Cuisines Envia';
