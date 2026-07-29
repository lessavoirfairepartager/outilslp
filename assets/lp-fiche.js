/* ==========================================================================
   lp-fiche.js — Fiche d'exercices imprimable, 2 pages exactement
   outilslp.netlify.app · Licence MIT
   --------------------------------------------------------------------------
   Page 1 : énoncés (identité élève, aide-mémoire, grille de questions)
   Page 2 : corrigé

   Un ajustement automatique réduit légèrement l'échelle si le contenu
   déborde, de sorte que le résultat tient TOUJOURS sur deux pages.

   Appel :
     LP.fiche({
       icon: '📐',
       title: 'Périmètres des pièces mécaniques',
       subtitle: 'Usinage · Maintenance · 2nde Bac Pro',
       modeLabel: 'Mode défi',
       isPlus: false,
       tolerance: '± 1 mm',
       accent: '#185FA5',
       answerLabel: 'P =',
       unit: 'mm',
       aide: 'Rectangle : P = 2×(L+l) | Cercle : P = π×d',
       questions: [ { num, nom, hint, svg, cotes, answerText } ]
     });
   ========================================================================== */

(function () {
  'use strict';

  function esc(s) { return String(s == null ? '' : s); }

  function build(cfg) {
    var accent   = cfg.accent || '#185FA5';
    var icon     = cfg.icon || '';
    var title    = esc(cfg.title);
    var subtitle = esc(cfg.subtitle);
    var isPlus   = !!cfg.isPlus;
    var modeLbl  = esc(cfg.modeLabel || (isPlus ? 'Défi +' : 'Mode défi'));
    var tol      = esc(cfg.tolerance || '');
    var unit     = esc(cfg.unit || '');
    var ansLbl   = esc(cfg.answerLabel || '=');
    var qs       = cfg.questions || [];

    var today = new Date().toLocaleDateString('fr-FR',
      { day: '2-digit', month: 'long', year: 'numeric' });

    var badgePlus = isPlus ? '<span class="badge-plus">DÉFI +</span>' : '';

    var aideHTML = (!isPlus && cfg.aide)
      ? '<div class="aide"><strong>Aide-mémoire :</strong> ' + cfg.aide + '</div>'
      : '';

    var cards = qs.map(function (q) {
      return '' +
        '<div class="card">' +
          '<div class="card-head">' +
            '<span class="qnum">' + esc(q.num) + '</span>' +
            '<span class="qnom">' + esc(q.nom) + '</span>' +
          '</div>' +
          '<div class="card-body">' +
            '<div class="card-svg"><svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">' + q.svg + '</svg></div>' +
            '<div class="card-info">' +
              '<div class="cotes">' + String(q.cotes).replace(/·/g, '<br>') + '</div>' +
              (!isPlus && q.hint ? '<div class="hint">' + esc(q.hint) + '</div>' : '') +
              '<div class="answer-zone">' +
                '<span class="answer-label">' + ansLbl + '</span>' +
                '<span class="answer-line"></span>' +
                '<span class="answer-unit">' + unit + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    }).join('');

    var corr = qs.map(function (q) {
      var val = q.answerText != null ? q.answerText : q.answer;
      return '' +
        '<div class="card">' +
          '<div class="card-head">' +
            '<span class="qnum">' + esc(q.num) + '</span>' +
            '<span class="qnom">' + esc(q.nom) + '</span>' +
          '</div>' +
          '<div class="card-body corr-body">' +
            '<div class="card-svg corr-svg"><svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">' + q.svg + '</svg></div>' +
            '<div class="card-info">' +
              '<div class="cotes corr-cotes">' + esc(q.cotes) + '</div>' +
              (q.hint ? '<div class="hint">' + esc(q.hint) + '</div>' : '') +
              '<div class="answer-filled">' +
                '<span class="af-label">' + ansLbl + '</span>' +
                '<span class="af-val">' + esc(val) + ' ' + unit + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    }).join('');

    return '<!DOCTYPE html>\n<html lang="fr">\n<head>\n<meta charset="UTF-8">\n' +
'<title>' + title + ' — ' + modeLbl + '</title>\n<style>\n' +
'  @page { size: A4 portrait; margin: 10mm; }\n' +
'  * { box-sizing: border-box; margin: 0; padding: 0; }\n' +
'  :root { --acc: ' + accent + '; }\n' +
'  body { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;\n' +
'         color: #111; background: #e9e8e3; }\n' +
'\n' +
'  /* Une feuille = exactement une page A4 utile (190 × 277 mm) */\n' +
'  .sheet { width: 190mm; height: 277mm; overflow: hidden;\n' +
'           background: #fff; margin: 8mm auto; padding: 0;\n' +
'           box-shadow: 0 2px 10px rgba(0,0,0,.18); }\n' +
'  .sheet-inner { width: 190mm; transform-origin: top left; }\n' +
'  .sheet-corr { page-break-before: always; break-before: page; }\n' +
'\n' +
'  .page-head { display: flex; justify-content: space-between; align-items: flex-end;\n' +
'               border-bottom: 2.5px solid var(--acc); padding-bottom: 5px; margin-bottom: 8px; }\n' +
'  .page-head h1 { font-size: 16pt; color: var(--acc); font-weight: 700; }\n' +
'  .page-head p  { font-size: 10.5pt; color: #555; margin-top: 2px; }\n' +
'  .page-head-right { font-size: 10.5pt; color: #555; text-align: right; line-height: 1.7; white-space: nowrap; }\n' +
'  .badge-plus { display: inline-block; background: #FFF3CD; color: #7A4500;\n' +
'                font-size: 9.5pt; font-weight: 700; padding: 2px 8px;\n' +
'                border-radius: 10px; border: 1px solid #e6c84a; margin-left: 6px;\n' +
'                vertical-align: middle; }\n' +
'\n' +
'  .identity { display: flex; gap: 20px; margin-bottom: 8px; font-size: 12pt; color: #333; }\n' +
'  .identity .f { flex: 1; border-bottom: 1.5px solid #aaa; padding-bottom: 4px; }\n' +
'  .identity .f span { color: #888; font-size: 10.5pt; }\n' +
'\n' +
'  .aide { background: #f0efe9; border: 1px solid #d8d6ce; border-radius: 4px;\n' +
'          padding: 6px 10px; font-size: 10.5pt; color: #333; margin-bottom: 8px;\n' +
'          line-height: 1.65; }\n' +
'\n' +
'  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }\n' +
'  .card { border: 2px solid #b8b6ae; border-radius: 6px; overflow: hidden;\n' +
'          page-break-inside: avoid; break-inside: avoid; }\n' +
'  .card-head { background: #e8e6df; border-bottom: 1.5px solid #c2c0b6;\n' +
'               padding: 5px 9px; display: flex; align-items: center; gap: 7px; }\n' +
'  .qnum { background: var(--acc); color: #fff; font-size: 11pt; font-weight: 700;\n' +
'          width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;\n' +
'          display: flex; align-items: center; justify-content: center; }\n' +
'  .qnom { font-size: 11pt; font-weight: 700; color: #222; }\n' +
'\n' +
'  .card-body { display: flex; align-items: center; gap: 10px; padding: 7px 10px; }\n' +
'  .card-svg { flex-shrink: 0; width: 125px; }\n' +
'  .card-svg svg { width: 125px; height: 100px; }\n' +
'  .card-info { flex: 1; display: flex; flex-direction: column; gap: 5px; }\n' +
'  .cotes { font-size: 11.5pt; color: #222; line-height: 1.6; font-weight: 500; }\n' +
'  .hint  { font-size: 10.5pt; color: var(--acc); background: #eef4fa;\n' +
'           border-radius: 3px; padding: 3px 7px; font-weight: 500; }\n' +
'\n' +
'  .answer-zone { display: flex; align-items: center; gap: 6px; margin-top: 3px; }\n' +
'  .answer-label { font-weight: 900; color: #111; font-size: 16pt; white-space: nowrap; }\n' +
'  .answer-line { flex: 1; border-bottom: 2.5px solid #111; min-width: 50px; height: 24px; }\n' +
'  .answer-unit { font-size: 13pt; color: #333; font-weight: 600; white-space: nowrap; }\n' +
'\n' +
'  /* ── Corrigé : plus compact ─────────────────────────────── */\n' +
'  .corr-head { display: flex; justify-content: space-between; align-items: flex-end;\n' +
'               border-bottom: 2.5px solid var(--acc); padding-bottom: 5px; margin-bottom: 8px; }\n' +
'  .corr-head h2 { font-size: 14pt; color: var(--acc); font-weight: 700; }\n' +
'  .corr-head p  { font-size: 9.5pt; color: #555; margin-top: 2px; }\n' +
'  .corr-badge { background: #d4edda; color: #155724; font-size: 10pt; font-weight: 700;\n' +
'                padding: 3px 11px; border-radius: 10px; border: 1px solid #92d4a8;\n' +
'                white-space: nowrap; }\n' +
'  .sheet-corr .card-head { padding: 3px 8px; }\n' +
'  .sheet-corr .qnum { width: 21px; height: 21px; font-size: 10pt; }\n' +
'  .sheet-corr .qnom { font-size: 10.5pt; }\n' +
'  .sheet-corr .card-info { gap: 3px; }\n' +
'  .sheet-corr .hint { font-size: 9.5pt; padding: 2px 6px; }\n' +
'  .corr-body { padding: 5px 8px; gap: 8px; }\n' +
'  .corr-svg { width: 74px; }\n' +
'  .corr-svg svg { width: 74px; height: 59px; }\n' +
'  .corr-cotes { font-size: 10pt; line-height: 1.45; }\n' +
'  .answer-filled { display: flex; align-items: center; gap: 8px; margin-top: 2px;\n' +
'                   background: #E6F5EC; border: 1.5px solid #9ACFAC; border-radius: 4px;\n' +
'                   padding: 3px 8px; }\n' +
'  .answer-filled .af-label { font-size: 13pt; font-weight: 900; color: #155724; }\n' +
'  .answer-filled .af-val   { font-size: 13pt; font-weight: 700; color: #155724; }\n' +
'\n' +
'  /* ── Barre d\'action (écran seulement) ───────────────────── */\n' +
'  .bar { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);\n' +
'         display: flex; gap: 8px; z-index: 10; }\n' +
'  .bar button { padding: 11px 24px; border: none; border-radius: 8px;\n' +
'                font-family: inherit; font-size: 12pt; font-weight: 700; cursor: pointer;\n' +
'                box-shadow: 0 2px 8px rgba(0,0,0,.25); }\n' +
'  .b-print { background: var(--acc); color: #fff; }\n' +
'  .b-close { background: #fff; color: #444; }\n' +
'\n' +
'  @media print {\n' +
'    body { background: #fff; }\n' +
'    .bar { display: none !important; }\n' +
'    .sheet { margin: 0; box-shadow: none; }\n' +
'  }\n' +
'</style>\n</head>\n<body>\n' +
'\n<section class="sheet sheet-enonce"><div class="sheet-inner">\n' +
'  <div class="page-head">\n' +
'    <div>\n' +
'      <h1>' + icon + ' ' + title + badgePlus + '</h1>\n' +
'      <p>' + subtitle + ' &nbsp;—&nbsp; ' + modeLbl + (isPlus ? ' · Formules masquées' : '') + '</p>\n' +
'    </div>\n' +
'    <div class="page-head-right">Date : ' + today + '<br>' +
       (tol ? 'Tolérance : ' + tol + '<br>' : '') + '/' + qs.length + '</div>\n' +
'  </div>\n' +
'  <div class="identity">\n' +
'    <div class="f"><span>Nom · Prénom :</span>&nbsp;</div>\n' +
'    <div class="f"><span>Classe :</span>&nbsp;</div>\n' +
'  </div>\n' +
   aideHTML + '\n' +
'  <div class="grid">' + cards + '</div>\n' +
'</div></section>\n' +
'\n<section class="sheet sheet-corr"><div class="sheet-inner">\n' +
'  <div class="corr-head">\n' +
'    <div>\n' +
'      <h2>' + icon + ' Corrigé — ' + title + '</h2>\n' +
'      <p>' + subtitle + ' &nbsp;—&nbsp; ' + modeLbl +
       (tol ? ' &nbsp;—&nbsp; Tolérance : ' + tol : '') + '</p>\n' +
'    </div>\n' +
'    <span class="corr-badge">✓ CORRIGÉ</span>\n' +
'  </div>\n' +
'  <div class="grid">' + corr + '</div>\n' +
'</div></section>\n' +
'\n<div class="bar">\n' +
'  <button class="b-print" onclick="window.print()">🖨️ Imprimer / PDF</button>\n' +
'  <button class="b-close" onclick="window.close()">Fermer</button>\n' +
'</div>\n' +
'\n<script>\n' +
'/* Ajustement : si une feuille déborde, on la réduit juste ce qu\'il faut,\n' +
'   pour garantir deux pages exactement. */\n' +
'(function(){\n' +
'  function fit(sheet){\n' +
'    var inner = sheet.firstElementChild;\n' +
'    inner.style.width = "190mm";\n' +
'    inner.style.transform = "none";\n' +
'    var avail = sheet.clientHeight, need = inner.scrollHeight;\n' +
'    if (need > avail) {\n' +
'      var k = Math.max(0.55, (avail / need) - 0.005);\n' +
'      inner.style.width = (190 / k) + "mm";\n' +
'      inner.style.transform = "scale(" + k + ")";\n' +
'    }\n' +
'  }\n' +
'  function run(){ document.querySelectorAll(".sheet").forEach(fit); }\n' +
'  window.addEventListener("load", function(){ run(); setTimeout(function(){ window.print(); }, 350); });\n' +
'  window.addEventListener("beforeprint", run);\n' +
'})();\n' +
'<\/script>\n</body>\n</html>';
  }

  window.LP = window.LP || {};

  window.LP.fiche = function (cfg) {
    var html = build(cfg);
    var win = window.open('', '_blank');
    if (!win) {
      alert("La fenêtre d'impression a été bloquée.\nAutorise les fenêtres surgissantes pour ce site, puis réessaie.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  /* Tire n questions en piochant dans une liste de générateurs,
     sans répéter un générateur tant que tous n'ont pas servi. */
  window.LP.pickQuestions = function (defs, n) {
    var order = defs.map(function (_, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = order[i]; order[i] = order[j]; order[j] = t;
    }
    var out = [];
    while (out.length < n) {
      for (var k = 0; k < order.length && out.length < n; k++) {
        var def = defs[order[k]];
        var gen = def.generate();
        out.push({
          num: out.length + 1,
          nom: def.nom,
          hint: def.hint ? 'Formule : ' + def.hint : '',
          svg: gen.svg,
          cotes: gen.cotes,
          answer: gen.answer
        });
      }
    }
    return out;
  };
})();
