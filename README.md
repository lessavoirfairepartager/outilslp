# outilslp

Outils pédagogiques interactifs de mathématiques et physique-chimie pour le
lycée professionnel (3e prépa-métiers, CAP, 2de/1re/Tle Bac Pro).

Site en ligne : **[outilslp.netlify.app](https://outilslp.netlify.app)**

## Principes

- **Fichiers HTML autonomes.** Chaque outil est une page unique, sans
  dépendance externe (hors bibliothèques ponctuelles chargées en local),
  utilisable hors connexion une fois ouverte.
- **Zéro compte, zéro donnée envoyée.** Rien n'est collecté côté élève ; le
  seul suivi est un compteur de visites global (GoatCounter, agrégé).
- **Hors-ligne par conception.** Le site est une PWA installable
  (`sw.js`, stratégie réseau-d'abord) : une fois visité, un outil reste
  disponible sans connexion.
- **Accessibilité.** Mode projection (texte agrandi pour vidéoprojecteur) et
  mode DYS (interlignage, espacement, pas de police "spéciale dys") sur les
  outils qui suivent le design system commun.

## Structure du dépôt

```
outilslp/
├── index.html              Catalogue de tous les outils
├── assets/                 Design system partagé
│   ├── lp-ui.css           Styles communs, modes projection/DYS
│   ├── lp-ui.js            Barre d'outils, compteur, navigation
│   └── lp-fiche.js         Génération des fiches imprimables
├── outils/                 Outils (maths, physique-chimie)
├── jeux/                   Outils au format jeu
├── profs/                  Ressources réservées à l'usage enseignant
├── sw.js, manifest.webmanifest, offline.html   PWA
├── _redirects, _headers    Configuration Netlify
└── robots.txt
```

Chaque outil suit la même structure : onglets **Explorateur / Mode défi /
Défi⁺**, génération de fiche imprimable (10 questions, page de corrigé
séparée), raccourcis clavier T/P/D. Le modèle de référence pour un nouvel
outil est `outils/perimetre_usinage.html`.

## Déploiement

Hébergement Netlify, déploiement automatique à chaque push sur la branche
principale. Aucune étape de build : les fichiers sont servis tels quels.

## Licence

Ce projet est sous licence **MIT** — voir l'en-tête de chaque fichier ou la
licence complète ci-dessous. Réutilisation, adaptation et redistribution
libres, y compris à des fins commerciales, à condition de conserver la
mention de copyright.

```
MIT License

Copyright (c) Moïse Muller

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## Auteur

Moïse Muller — professeur de lycée professionnel.
Contact : lessavoirfairepartager@gmail.com
