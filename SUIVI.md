# Suivi de la refonte — Roazhon Kastell v2

## Architecture

| Élément | Avant (v1) | Après (v2) |
|---------|-----------|-----------|
| Framework | Next.js 16 static export | Next.js 16 SSR |
| Hébergement front | OVH mutualisé (FTP) | Vercel (gratuit) |
| Base de données | Aucune (fichiers .ts + Google Sheets) | Supabase PostgreSQL |
| Authentification | Aucune | Supabase Auth (magic link email) |
| Stockage fichiers | Public dans /public | Supabase Storage |
| Backend API | PHP (inscriptions CSV) | Next.js API routes + Supabase |
| Emails transactionnels | Aucun | Resend (à configurer) |

## Décisions prises

- [x] Hébergement : Vercel (front) + Supabase (backend) — gratuit
- [x] Emails : Resend pour les notifications (auth gérée par Supabase)
- [x] Auth : Magic link par email (pas de mot de passe)
- [ ] Finances : fonctionnement actuel à clarifier avec Quentin

## Lot 1 — Fondations

- [x] Commit de référence du site vitrine actuel (4807b7f)
- [x] Branche `refonte-v2` créée
- [x] Supabase JS + SSR installés
- [x] Client Supabase (browser + server)
- [x] Middleware d'authentification
- [x] Route callback auth
- [x] Schéma SQL complet (toutes les tables + RLS)
- [x] Types TypeScript
- [ ] **ACTION REQUISE** : Créer le projet Supabase et configurer .env.local

## Lot 2 — Comptes, rôles et gestion des membres

- [ ] Page de connexion (magic link)
- [ ] Layout espace privé avec navigation par rôle
- [ ] Interface Gianni : gestion des membres
- [ ] Migration des adhérents existants

## Lot 3 — Fiches partenaires et conseillers

- [ ] Fiches conseillers (refonte depuis données existantes)
- [ ] Fiches partenaires autonomes + workflow validation
- [ ] Migration des partenaires existants

## Lot 4 — Vitrine publique

- [ ] Nouvelle navigation
- [ ] Accueil refait
- [ ] Pages conseillers et partenaires publiques

## Lot 5 — Agenda et interface Julien

- [ ] CRUD événements
- [ ] Interface Julien (mini-sites IAD, mardis)
- [ ] Inscriptions avec jauge

## Lot 6 — Biens, recherches, rapprochements

- [ ] Partage de bien par lien IAD
- [ ] Recherches acquéreurs
- [ ] Moteur de rapprochement

## Lot 7 — Boîte à idées et ressources

## Lot 8 — Finances

## Lot 9 — Blog / Actualités

## Lot 10 — Tests et déploiement

## Procédure de déploiement (à compléter)

1. Créer le projet Supabase en production
2. Exécuter le schéma SQL
3. Connecter Vercel au dépôt
4. Configurer les variables d'environnement
5. Migrer les données existantes
6. Vérifier les accès et les rôles
7. Basculer le DNS roazhonkastell.fr
