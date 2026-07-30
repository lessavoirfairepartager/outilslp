/* ==========================================================================
   compteur.mjs — Compteur de visites maison, sans service tiers
   --------------------------------------------------------------------------
   VERSION CORRIGÉE de netlify/functions/counter.bak.

   Pourquoi l'ancienne ne marchait pas : elle appelait `@netlify/blob-storage`,
   un paquet qui n'existe pas sur npm. Le bon nom est `@netlify/blobs`, et son
   API n'est pas writeBlob/readBlob mais getStore().get() / setJSON().

   Deux conditions pour que ça fonctionne :
     1. un package.json à la racine du dépôt qui déclare @netlify/blobs
        (Netlify lancera alors un npm install au déploiement — ton dépôt
        n'aura plus le luxe du « je dépose les fichiers, c'est en ligne ») ;
     2. le site doit tourner sur Netlify (les jetons Blobs sont injectés
        automatiquement dans les fonctions).

   Appel côté page :  fetch('/api/compteur?p=' + encodeURIComponent(chemin))
   Réponse         :  { "page": "/outils/…", "vues": 42 }
   ========================================================================== */

import { getStore } from '@netlify/blobs';

export default async (req) => {
  try {
    const url  = new URL(req.url);
    const page = (url.searchParams.get('p') || '/').slice(0, 200);

    // Une clé par page, caractères exotiques neutralisés.
    const key = 'p' + page.replace(/[^a-zA-Z0-9._-]/g, '_');

    // consistency: 'strong' — sans ça, deux visites rapprochées peuvent lire
    // la même valeur et n'en compter qu'une.
    const store = getStore({ name: 'compteur-visites', consistency: 'strong' });

    const data = (await store.get(key, { type: 'json' })) || { vues: 0 };
    data.vues++;
    data.dernier = new Date().toISOString();
    await store.setJSON(key, data);

    return Response.json(
      { page, vues: data.vues },
      { headers: { 'cache-control': 'no-store' } }
    );
  } catch (err) {
    // Un compteur cassé ne doit jamais casser la page qui l'appelle.
    return Response.json({ erreur: String(err && err.message) }, { status: 500 });
  }
};

export const config = { path: '/api/compteur' };
