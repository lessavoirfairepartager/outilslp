/* ==========================================================================
   sw.js — Service worker des Outils LP
   outilslp.netlify.app · Licence MIT
   --------------------------------------------------------------------------
   Stratégie : LE RÉSEAU D'ABORD, le cache seulement en secours.

   Conséquence voulue : dès qu'un fichier change sur Netlify, l'élève voit la
   nouvelle version au chargement suivant — pas besoin de numéroter les
   versions à chaque correction de faute de frappe. Le cache ne sert que
   lorsque la connexion manque : un outil déjà ouvert une fois reste
   utilisable dans une salle sans wifi.

   Le service worker ne remplace JAMAIS la page sous les doigts de l'élève :
   pas de rechargement automatique, un défi en cours n'est jamais perdu.
   ========================================================================== */

var VERSION = '2026-07-30';
var SHELL   = 'lp-shell-'   + VERSION;
var RUNTIME = 'lp-runtime-' + VERSION;

/* Le strict nécessaire pour que le site s'ouvre hors ligne. Les outils, eux,
   se mettent en cache tout seuls au fur et à mesure des visites. */
var PRECACHE = [
  '/',
  '/offline.html',
  '/assets/lp-ui.css',
  '/assets/lp-ui.js',
  '/assets/lp-fiche.js',
  '/assets/icons/icon-192.png'
];

/* Bibliothèques externes à figer (URL versionnée : le contenu ne change
   jamais). Sans ça, la vue 3D des atomes ne marcherait pas hors ligne. */
var CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(SHELL).then(function (c) {
      // un fichier manquant ne doit pas faire échouer toute l'installation
      return Promise.all(PRECACHE.map(function (u) {
        return c.add(u).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (n) {
        if (n !== SHELL && n !== RUNTIME) return caches.delete(n);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  if (CDN.indexOf(url.href) !== -1) { e.respondWith(cacheFirst(req)); return; }

  // Autres domaines (compteur GoatCounter, polices…) : on ne s'en mêle pas.
  if (url.origin !== self.location.origin) return;

  // Fonctions Netlify : toujours en direct.
  if (url.pathname.indexOf('/.netlify/') === 0) return;

  // Proxy du compteur : jamais mis en cache, sinon le chiffre se fige.
  if (url.pathname.indexOf('/gc/') === 0) return;

  e.respondWith(networkFirst(req));
});

function networkFirst(req) {
  return fetch(req).then(function (fresh) {
    if (fresh && fresh.ok) {
      var copy = fresh.clone();
      caches.open(RUNTIME).then(function (c) { c.put(req, copy); });
    }
    return fresh;
  }).catch(function () {
    return caches.match(req).then(function (hit) {
      if (hit) return hit;
      if (req.mode === 'navigate') {
        return caches.match('/offline.html').then(function (off) {
          return off || Response.error();
        });
      }
      return Response.error();
    });
  });
}

function cacheFirst(req) {
  return caches.match(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (res) {
      var copy = res.clone();   // réponse opaque : stockable, non lisible
      caches.open(RUNTIME).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () { return Response.error(); });
  });
}
