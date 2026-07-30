/* ==========================================================================
   lp-ui.js — Préférences d'affichage communes aux Outils LP
   outilslp.netlify.app · Licence MIT
   --------------------------------------------------------------------------
   À charger dans <head>, SANS defer, pour que le thème soit posé avant le
   premier rendu (évite le flash blanc au chargement en thème sombre).

   S'occupe aussi, pour toutes les pages d'un coup :
     · l'application installable (manifeste + service worker)
     · le compteur de visites en pied de page

   Expose window.LP = { theme, size, dys, set… }
   ========================================================================== */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════════
     RÉGLAGE — LA SEULE LIGNE À MODIFIER DANS TOUT LE FICHIER

     Ton code GoatCounter, celui de https://TON-CODE.goatcounter.com
     Laisser vide : aucun compteur, aucune requête vers l'extérieur.

     Les apostrophes doivent être DROITES, celles de la touche 4 du clavier.
     Word et LibreOffice les remplacent automatiquement par des apostrophes
     courbes, et JavaScript refuse alors le fichier ENTIER : plus de barre
     d'affichage, plus de compteur. Éditer avec un éditeur de texte simple.
     Modèle exact à recopier :   var GOATCOUNTER = 'outilslp';
     ═══════════════════════════════════════════════════════════════════════ */

  var GOATCOUNTER = '';

  /* ═══════════════════════════════════════════════════════════════════════ */

  // Tolérant : accepte le code seul ('outilslp') aussi bien que l'URL entière
  // copiée depuis la doc GoatCounter ('https://outilslp.goatcounter.com/count').
  // On ne garde que le sous-domaine, quoi qu'on lui donne.
  function codeGC(v) {
    if (typeof v !== 'string') return '';
    v = v.trim();
    if (!v) return '';
    var m = v.match(/^https?:\/\/([^.\/]+)\.goatcounter\.com/i);
    if (m) return m[1];                    // URL complète → sous-domaine
    return v.replace(/\.goatcounter\.com.*$/i, '')   // au cas où il reste un suffixe
            .replace(/^https?:\/\//i, '')
            .replace(/\/.*$/, '');
  }

  var CONF = {
    gcCode:    codeGC(GOATCOUNTER),
    showCount: true,   // « vues sur cette page · sur le site » en pied de page
    pwa:       true    // application installable et hors ligne
  };

  // Journal de bord, lisible dans la console avec :  LP.diag
  var DIAG = { version: '2026-07-30', gcCode: CONF.gcCode, erreurs: [] };

  // Un module qui tombe ne doit jamais entraîner les autres avec lui.
  function safe(nom, fn) {
    try { fn(); }
    catch (e) {
      DIAG.erreurs.push(nom + ' — ' + (e && e.message ? e.message : e));
      if (window.console && console.error) console.error('[lp-ui] ' + nom, e);
    }
  }

  var KEYS = { theme: 'lp-theme', size: 'lp-size', dys: 'lp-dys', motion: 'lp-motion' };
  var root = document.documentElement;

  // Couleur de la barre système sur Android et en application installée.
  var THEME_COLOR = { light: '#f5f4f0', dark: '#14130f' };

  function read(key, fallback) {
    try { return localStorage.getItem(key) || fallback; }
    catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* navigation privée */ }
  }

  // ── État initial ────────────────────────────────────────────────────────
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var prefersDark   = mq('(prefers-color-scheme: dark)');
  var prefersCalm   = mq('(prefers-reduced-motion: reduce)');

  var state = {
    theme:  read(KEYS.theme,  prefersDark ? 'dark' : 'light'),
    size:   read(KEYS.size,   'normal'),
    dys:    read(KEYS.dys,    'off'),
    // La préférence système n'est qu'un défaut : l'utilisateur peut la surcharger.
    motion: read(KEYS.motion, prefersCalm ? 'off' : 'on')
  };

  function apply() {
    root.setAttribute('data-theme',  state.theme);
    root.setAttribute('data-size',   state.size);
    root.setAttribute('data-dys',    state.dys);
    root.setAttribute('data-motion', state.motion);
    try { setMeta('theme-color', THEME_COLOR[state.theme] || THEME_COLOR.light); }
    catch (e) { /* l'affichage prime sur la couleur de barre système */ }
  }

  function setMeta(name, content) {
    if (!document.head) return;
    var m = document.head.querySelector('meta[name="' + name + '"]');
    if (!m) { m = document.createElement('meta'); m.name = name; document.head.appendChild(m); }
    m.content = content;
  }

  apply(); // immédiat : avant le rendu du <body>

  // ── APPLICATION INSTALLABLE ─────────────────────────────────────────────
  // Le manifeste est injecté ici plutôt que copié dans les 16 pages : une
  // seule ligne à changer le jour où il évolue.
  function pwaHead() {
    if (!CONF.pwa || !document.head) return;
    if (!document.head.querySelector('link[rel="manifest"]')) {
      var m = document.createElement('link');
      m.rel = 'manifest';
      m.href = '/manifest.webmanifest';
      document.head.appendChild(m);
    }
    var a = document.createElement('link');
    a.rel = 'apple-touch-icon';
    a.href = '/assets/icons/apple-touch-icon.png';
    document.head.appendChild(a);
    setMeta('mobile-web-app-capable', 'yes');
    setMeta('application-name', 'Outils LP');
  }
  safe('manifeste', pwaHead);

  // ── Actions ─────────────────────────────────────────────────────────────
  function setTheme(v) { state.theme = v; write(KEYS.theme, v); apply(); sync(); }
  function setSize(v)  { state.size  = v; write(KEYS.size,  v); apply(); sync(); }
  function setDys(v)   { state.dys   = v; write(KEYS.dys,   v); apply(); sync(); }
  function setMotion(v){ state.motion= v; write(KEYS.motion,v); apply(); sync(); }

  function toggleTheme() { setTheme(state.theme === 'dark' ? 'light' : 'dark'); }
  function toggleSize()  { setSize(state.size === 'projection' ? 'normal' : 'projection'); }
  function toggleDys()   { setDys(state.dys === 'on' ? 'off' : 'on'); }
  function toggleMotion(){ setMotion(state.motion === 'on' ? 'off' : 'on'); }

  // ── Barre d'outils ──────────────────────────────────────────────────────
  var els = {};

  function sync() {
    if (!els.theme) return;
    els.theme.textContent = state.theme === 'dark' ? '☀️' : '🌙';
    els.theme.title = state.theme === 'dark'
      ? 'Passer en thème clair  (T)'
      : 'Passer en thème sombre  (T)';
    els.size.setAttribute('aria-pressed', state.size === 'projection');
    els.size.title = state.size === 'projection'
      ? 'Revenir à la taille normale  (P)'
      : 'Agrandir pour la projection  (P)';
    els.dys.setAttribute('aria-pressed', state.dys === 'on');
    els.dys.title = state.dys === 'on'
      ? 'Désactiver la lecture facilitée  (D)'
      : 'Lecture facilitée : plus d\'espace entre les lettres  (D)';
    els.motion.setAttribute('aria-pressed', state.motion === 'on');
    els.motion.title = state.motion === 'on'
      ? 'Figer les animations  (M)'
      : 'Animer les icônes  (M)';
  }

  function buildToolbar() {
    if (document.querySelector('.lp-toolbar')) return;

    var bar = document.createElement('div');
    bar.className = 'lp-toolbar no-print';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Affichage');

    var atHome = /^\/(index\.html)?$/.test(location.pathname);
    if (!atHome) {
      var home = document.createElement('a');
      home.href = '/';
      home.textContent = '🏠';
      home.title = 'Retour au portail des outils';
      home.setAttribute('aria-label', 'Retour au portail des outils');
      bar.appendChild(home);
    }

    els.theme = document.createElement('button');
    els.theme.type = 'button';
    els.theme.addEventListener('click', toggleTheme);

    els.size = document.createElement('button');
    els.size.type = 'button';
    els.size.textContent = '🔍';
    els.size.setAttribute('aria-label', 'Mode projection');
    els.size.addEventListener('click', toggleSize);

    els.dys = document.createElement('button');
    els.dys.type = 'button';
    els.dys.textContent = 'Aa';
    els.dys.style.fontSize = '16px';
    els.dys.style.fontWeight = '700';
    els.dys.setAttribute('aria-label', 'Lecture facilitée');
    els.dys.addEventListener('click', toggleDys);

    els.motion = document.createElement('button');
    els.motion.type = 'button';
    els.motion.textContent = '\u2728';
    els.motion.setAttribute('aria-label', 'Animations');
    els.motion.addEventListener('click', toggleMotion);

    bar.appendChild(els.theme);
    bar.appendChild(els.size);
    bar.appendChild(els.dys);
    bar.appendChild(els.motion);
    document.body.appendChild(bar);
    els.bar = bar;
    sync();
    showInstall();
  }

  // ── BOUTON « INSTALLER » ────────────────────────────────────────────────
  // N'apparaît que si le navigateur propose vraiment l'installation ; sur
  // iPhone il faut passer par Partager › Sur l'écran d'accueil, Safari ne
  // laisse pas le choix.
  var installEvt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installEvt = e;
    showInstall();
  });

  window.addEventListener('appinstalled', function () {
    installEvt = null;
    if (els.install) { els.install.remove(); els.install = null; }
  });

  function showInstall() {
    if (!installEvt || !els.bar || els.install) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = '\u2B07';
    b.title = 'Installer l\'application sur cet appareil';
    b.setAttribute('aria-label', 'Installer l\'application');
    b.addEventListener('click', function () {
      if (!installEvt) return;
      installEvt.prompt();
      installEvt.userChoice.then(function () {
        installEvt = null;
        if (els.install) { els.install.remove(); els.install = null; }
      });
    });
    els.bar.insertBefore(b, els.bar.firstChild);
    els.install = b;
  }

  // ── SERVICE WORKER ──────────────────────────────────────────────────────
  function registerSW() {
    if (!CONF.pwa || !('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(function (reg) {
        reg.update();
        // Retour sur l'onglet : on redemande au serveur s'il y a du neuf.
        // La nouvelle version s'appliquera au chargement suivant, jamais
        // en rechargeant la page pendant qu'on s'en sert.
        document.addEventListener('visibilitychange', function () {
          if (!document.hidden) reg.update();
        });
      })
      .catch(function () { /* sans hors-ligne, le site fonctionne quand même */ });
  }

  // ── COMPTEUR DE VISITES ─────────────────────────────────────────────────
  // GoatCounter : pas de cookie, rien d'écrit sur l'appareil du visiteur.
  // L'adresse IP est hachée avec un sel qui change chaque jour, puis jetée.
  function countPath() {
    return location.pathname.replace(/index\.html$/, '') || '/';
  }

  // Faut-il ARRÊTER de compter ce navigateur ? (test de ses propres pages)
  // ?skipgc dans l'URL pose le drapeau une fois pour toutes.
  function exclu() {
    if (/[?&]skipgc/.test(location.search)) { try { write('skipgc', 't'); } catch (e) {} }
    try { return read('skipgc', '') === 't'; } catch (e) { return false; }
  }

  // Charge count.js UNE seule fois. Ce script sert à deux choses distinctes :
  // enregistrer la visite ET afficher le compteur. On le charge donc même
  // quand ce navigateur est exclu du comptage — sinon le compteur qu'on veut
  // AFFICHER ne s'afficherait pas non plus.
  var gcLoading = false;
  function loadCountJS() {
    if (gcLoading || !CONF.gcCode) return;
    gcLoading = true;
    window.goatcounter = window.goatcounter || {};
    window.goatcounter.path = countPath();
    // no_onload : count.js se charge sans enregistrer automatiquement la
    // visite. C'est trackVisit() qui décidera de compter, ou pas.
    window.goatcounter.no_onload = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', 'https://' + CONF.gcCode + '.goatcounter.com/count');
    document.body.appendChild(s);
  }

  function trackVisit() {
    if (!CONF.gcCode) return;
    loadCountJS();
    if (exclu()) return;               // navigateur exclu : on n'enregistre pas
    whenReady(function () {
      try { window.goatcounter.count({ path: countPath() }); } catch (e) {}
    });
  }

  // Attend que count.js soit prêt (il se charge en async), puis exécute cb.
  function whenReady(cb) {
    if (window.goatcounter && window.goatcounter.count) { cb(); return; }
    var n = 0;
    var t = setInterval(function () {
      if (window.goatcounter && window.goatcounter.count) { clearInterval(t); cb(); }
      else if (++n > 100) { clearInterval(t); }   // ~10 s : on renonce
    }, 100);
  }

  // ── COMPTEUR D'AFFICHAGE ────────────────────────────────────────────────
  // Le JSON de GoatCounter est bloqué par CORS en lecture directe (bug connu),
  // et sa version HTML arrive dans une iframe illisible (police coupée par le
  // CSP). La parade : un PROXY Netlify. La règle dans _redirects fait relayer
  //   /gc/<chemin>   →   https://CODE.goatcounter.com/counter/<chemin>
  // par le serveur Netlify. Côté navigateur, la requête vise TON domaine :
  // same-origin, donc plus de CORS. On reçoit le JSON propre et on l'habille
  // nous-mêmes, en français, à la charte du site.
  function showCount() {
    if (!CONF.gcCode || !CONF.showCount || !window.fetch) return;
    var foot = document.querySelector('.lp-footer');
    if (!foot) return;

    var box = document.createElement('span');
    box.className = 'lp-count no-print';
    box.hidden = true;
    box.title = 'Compteur sans cookie \u00b7 valeurs mises en cache environ 4 h';
    foot.appendChild(box);

    Promise.all([
      grabCount('/gc/' + encodeURIComponent(countPath()) + '.json'),
      grabCount('/gc/TOTAL.json')
    ]).then(function (r) {
      if (r[0] === null && r[1] === null) return;    // hors ligne : on se tait
      box.innerHTML =
        '\uD83D\uDC41 <strong>' + affiche(r[0]) + '</strong> vues ici' +
        '\u00A0\u00B7\u00A0<strong>' + affiche(r[1]) + '</strong> sur le site';
      box.hidden = false;
    });
  }

  function grabCount(url) {
    return fetch(url).then(function (r) {
      if (r.status === 404) return '0';              // page encore jamais vue
      if (!r.ok) return null;
      return r.json().then(function (j) { return j.count; });
    }).catch(function () { return null; });
  }

  function affiche(v) {
    // GoatCounter formate \u00e0 l'anglaise (« 1,234 ») : espace fine.
    return v === null ? '\u2014' : String(v).replace(/,/g, '\u202f');
  }

  // ── Raccourcis clavier ──────────────────────────────────────────────────
  function isTyping(el) {
    if (!el) return false;
    var tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTyping(document.activeElement)) return;
    var k = e.key.toLowerCase();
    if (k === 't') { toggleTheme(); }
    else if (k === 'p') { toggleSize(); }
    else if (k === 'd') { toggleDys(); }
    else if (k === 'm') { toggleMotion(); }
  });

  // ── Démarrage ───────────────────────────────────────────────────────────
  function start() {
    // Ordre volontaire : la barre d'affichage est le cœur du site, elle part
    // en premier et aucun ajout ultérieur ne peut l'empêcher d'exister.
    safe('barre d\'outils', buildToolbar);
    safe('compteur',         trackVisit);
    safe('affichage compteur', showCount);
    safe('service worker',   registerSW);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.LP = window.LP || {};
  window.LP.state = state;
  window.LP.setTheme = setTheme;
  window.LP.setSize = setSize;
  window.LP.setDys = setDys;
  window.LP.setMotion = setMotion;
  window.LP.conf = CONF;
  window.LP.diag = DIAG;
})();
