/* ==========================================================================
   lp-ui.js — Préférences d'affichage communes aux Outils LP
   outilslp.netlify.app · Licence MIT
   --------------------------------------------------------------------------
   À charger dans <head>, SANS defer, pour que le thème soit posé avant le
   premier rendu (évite le flash blanc au chargement en thème sombre).

   Expose window.LP = { theme, size, dys, set… }
   ========================================================================== */

(function () {
  'use strict';

  var KEYS = { theme: 'lp-theme', size: 'lp-size', dys: 'lp-dys' };
  var root = document.documentElement;

  function read(key, fallback) {
    try { return localStorage.getItem(key) || fallback; }
    catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* navigation privée */ }
  }

  // ── État initial ────────────────────────────────────────────────────────
  var prefersDark = window.matchMedia &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches;

  var state = {
    theme: read(KEYS.theme, prefersDark ? 'dark' : 'light'),
    size:  read(KEYS.size,  'normal'),
    dys:   read(KEYS.dys,   'off')
  };

  function apply() {
    root.setAttribute('data-theme', state.theme);
    root.setAttribute('data-size',  state.size);
    root.setAttribute('data-dys',   state.dys);
  }
  apply(); // immédiat : avant le rendu du <body>

  // ── Actions ─────────────────────────────────────────────────────────────
  function setTheme(v) { state.theme = v; write(KEYS.theme, v); apply(); sync(); }
  function setSize(v)  { state.size  = v; write(KEYS.size,  v); apply(); sync(); }
  function setDys(v)   { state.dys   = v; write(KEYS.dys,   v); apply(); sync(); }

  function toggleTheme() { setTheme(state.theme === 'dark' ? 'light' : 'dark'); }
  function toggleSize()  { setSize(state.size === 'projection' ? 'normal' : 'projection'); }
  function toggleDys()   { setDys(state.dys === 'on' ? 'off' : 'on'); }

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

    bar.appendChild(els.theme);
    bar.appendChild(els.size);
    bar.appendChild(els.dys);
    document.body.appendChild(bar);
    sync();
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
  });

  // ── Démarrage ───────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildToolbar);
  } else {
    buildToolbar();
  }

  window.LP = window.LP || {};
  window.LP.state = state;
  window.LP.setTheme = setTheme;
  window.LP.setSize = setSize;
  window.LP.setDys = setDys;
})();
