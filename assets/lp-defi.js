/* ==========================================================================
   lp-defi.js — Moteur de défi partagé des Outils LP
   outilslp.netlify.app · Licence MIT · © 2026 Moïse Muller
   --------------------------------------------------------------------------
   À charger APRÈS lp-ui.js et lp-fiche.js, en fin de <body> :
     <script src="/assets/lp-defi.js"></script>

   Ce fichier fait trois choses, et rien d'autre :

     1. Il NORMALISE l'objet question. Un générateur d'outil renvoie toujours
        la même forme, quel que soit le type de réponse attendue.
     2. Il PILOTE la boucle de défi, avec le second essai intégré :
              essai 1 raté  → indice seulement
              essai 2 raté  → correction complète
              bonne réponse → correction complète immédiatement
     3. Il ÉMET un événement de fin de série (score, familles, compétences),
        point d'accroche du suivi d'acquis.

   Le rendu est en deux couches. Le moteur (LP.defi.creer) ne touche à rien
   dans la page : il ne connaît que des questions et des réponses. Le pilote
   d'affichage (option dom, activée par défaut) construit la zone de réponse,
   le fil des essais et le retour, à partir du balisage standard du dépôt.
   Un outil au rendu atypique (trigo, tables, graph_stats) garde son propre
   affichage et n'utilise que le moteur : dom: false.

   ── L'OBJET QUESTION ────────────────────────────────────────────────────
   Un générateur renvoie :

     {
       type:    'nombre' | 'choix' | 'multi' | 'texte',   // défaut : 'nombre'
       enonce:  'Calculer la longueur AN',        // ce qui est demandé
       cotes:   'AB = 8 cm ; AC = 12 cm',         // les données lues à l'écran
       figure:  function(opts){ return '<g>…</g>'; },  // SVG, ou :
       svg:     '<g>…</g>',                       // SVG déjà construit
       label:   'AN =',                           // devant le champ de saisie
       unite:   'cm',
       reponse: 6.4,                              // ou 'oui', ou [4, 9]
       tol:     0.05,                             // 0 = réponse exacte
       reponseTexte: '6,4 cm',                    // écriture pour le corrigé
       choix:   [ {val:'oui', label:'Oui, elles sont parallèles'}, … ],
       champs:  [ {label:'Pour x = 3', reponse:11, tol:0, unite:''}, … ],

       rappel:  'Thalès : AM/AB = AN/AC = MN/BC',   // AVANT de répondre
       hint:    'Repère les deux longueurs du MÊME triangle.',  // 1er essai raté
       detail:  'AN = (AM × AC) ÷ AB = … ≈ 6,4',    // correction complète
       comp:    'C3'                                // code de compétence
     }

   Trois niveaux d'étayage, et non deux — c'est le point de conception à
   valider. « rappel » est la propriété ou la formule, affichée d'emblée en
   mode défi et masquée en Défi ⁺. « hint » est l'indice ciblé, gagné après
   un premier essai raté, dans les DEUX modes. « detail » est la correction.
   Un outil qui n'a pas encore d'indice rédigé fonctionne quand même : le
   moteur retombe sur un message neutre et le second essai reste offert.

   ── LES ÉVÉNEMENTS ──────────────────────────────────────────────────────
     lp:defi:reponse  à chaque question close
     lp:defi:fin      à la fin d'une série (serie > 0)
   Écoute :
     document.addEventListener('lp:defi:fin', function(e){ e.detail… });
   ========================================================================== */

(function () {
  'use strict';

  window.LP = window.LP || {};
  if (window.LP.defi) return;          // déjà chargé : on ne redéfinit rien

  /* ═══ OUTILLAGE NUMÉRIQUE ══════════════════════════════════════════════
     Le formateur unifié, jusqu'ici recopié dans les trois entraîneurs.
     Il vit désormais ici : tout outil qui charge lp-defi.js y a accès par
     LP.nb / LP.nb1 / LP.nb2. Les copies locales des outils continuent de
     fonctionner sans conflit (elles sont dans une autre portée). */

  function nb(x, d) {
    var p = (d === undefined) ? 2 : d;
    var f = Math.pow(10, p);
    var s = (Math.round(x * f) / f).toFixed(p);
    s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return s.replace('.', ',');
  }
  function nb1(x) { return nb(x, 1); }
  function nb2(x) { return nb(x, 2); }

  /* Lecture d'un nombre écrit par un élève. Accepte la virgule française,
     les espaces de milliers (y compris l'espace fine insécable), le signe
     moins typographique et le point décimal. Renvoie null si ce n'est pas
     un nombre — un champ vide ne consomme jamais un essai. */
  function lireNombre(s) {
    if (s === null || s === undefined) return null;
    s = String(s)
      .replace(/\u2212|\u2013|\u2014/g, '-')     // moins et tirets typographiques
      .replace(/[\s\u00A0\u202F\u2009]/g, '')    // espaces, y compris fines
      .replace(',', '.')
      .trim();
    if (!s) return null;
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
    var v = parseFloat(s);
    return isFinite(v) ? v : null;
  }

  /* Comparaison à tolérance. Le 1e-6 évite qu'une réponse pile à la limite
     soit refusée par un arrondi binaire : 4,72 + 0,05 ne vaut pas exactement
     4,77 en machine. Ce garde-fou était à ajouter outil par outil ; il est
     maintenant impossible de l'oublier. */
  function proche(rep, att, tol) {
    var t = (typeof tol === 'number' && tol >= 0) ? tol : 0;
    return Math.abs(rep - att) <= t + 1e-6;
  }

  /* Comparaison de texte : casse, accents et espaces ignorés. */
  function normTexte(s) {
    s = String(s === null || s === undefined ? '' : s).toLowerCase().trim();
    if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.replace(/\s+/g, ' ').replace(/\u2019/g, "'");
  }

  /* ═══ PETITS SERVICES ══════════════════════════════════════════════════ */

  function ech(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function $(sel, racine) {
    if (!sel) return null;
    if (sel.nodeType === 1) return sel;
    return (racine || document).querySelector(sel);
  }

  function emettre(nom, info) {
    var ev;
    try {
      ev = new CustomEvent(nom, { detail: info, bubbles: true });
    } catch (e) {
      ev = document.createEvent('CustomEvent');
      ev.initCustomEvent(nom, true, false, info);
    }
    document.dispatchEvent(ev);
  }

  /* Piège connu du dépôt : lp-ui.css contient
       #mode-defi { display: none; }   #mode-defi.active { display: block; }
     Remettre le style inline à chaîne vide rend la main à la feuille de
     style et CACHE l'élément. Il faut poser display explicitement ET
     basculer la classe. Cette fonction fait les deux d'un coup. */
  function montrerBloc(el, visible) {
    el = $(el);
    if (!el) return;
    el.style.display = visible ? 'block' : 'none';
    if (el.classList) el.classList.toggle('active', !!visible);
  }

  function melangerTableau(t) {
    var i, j, tmp;
    for (i = t.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      tmp = t[i]; t[i] = t[j]; t[j] = tmp;
    }
    return t;
  }

  /* ═══ LE MOTEUR ════════════════════════════════════════════════════════ */

  function creer(cfg) {
    cfg = cfg || {};

    var familles = cfg.familles || [];
    var parCle = {};
    var i;
    for (i = 0; i < familles.length; i++) parCle[familles[i].value] = familles[i];

    var essaisMax = (typeof cfg.essaisMax === 'number' && cfg.essaisMax > 0) ? cfg.essaisMax : 2;
    var serie     = (typeof cfg.serie === 'number' && cfg.serie > 0) ? cfg.serie : 0;
    var estPlus   = (typeof cfg.modePlus === 'function') ? cfg.modePlus : function () { return false; };

    var M = {
      cfg:       cfg,
      outil:     cfg.outil || 'outil',
      familles:  familles,
      essaisMax: essaisMax,
      serie:     serie,
      famille:   cfg.familleParDefaut || (cfg.melange === false ? (familles[0] && familles[0].value) : 'mix'),

      q:        null,      // question courante, normalisée
      essai:    0,         // nombre d'essais déjà consommés sur cette question
      verrou:   false,     // la question est close
      dernier:  null,      // dernier résultat de verifier()

      total:    0,
      bons:     0,
      bonsPremier: 0,
      index:    0,         // rang de la question dans la série (1…serie)
      finie:    false,     // série terminée
      debut:    0,
      journal:  [],
      parFam:   {},
      parComp:  {}
    };

    /* ── Normalisation ────────────────────────────────────────────────── */
    function normaliser(brut, cleFam, pourFiche) {
      var f = parCle[cleFam] || {};
      var q = {};
      var k;
      for (k in brut) if (Object.prototype.hasOwnProperty.call(brut, k)) q[k] = brut[k];

      q.fam   = q.fam   || cleFam;
      q.nom   = q.nom   || f.nom || f.label || '';
      q.comp  = q.comp  || f.comp || '';
      q.type  = q.type  || (q.choix ? 'choix' : (q.champs ? 'multi' : 'nombre'));
      q.unite = (q.unite === undefined) ? (f.unite || '') : q.unite;
      q.tol   = (typeof q.tol === 'number') ? q.tol
              : (typeof f.tol === 'number' ? f.tol : 0);

      /* Étayage : ce que le générateur n'a pas dit, la famille le dit. */
      if (q.rappel === undefined) q.rappel = f.aide || f.rappel || '';
      if (q.hint   === undefined) q.hint   = f.hint || '';
      if (q.detail === undefined) q.detail = '';
      if (q.consigne === undefined) q.consigne = f.consigne || '';

      /* Figure : soit une fonction paramétrable, soit une chaîne déjà prête.
         Une question tirée pour la fiche n'a pas besoin du rendu d'écran :
         versFiche redemandera la figure au format papier. */
      if (typeof q.figure === 'function' && q.svg === undefined && !pourFiche) {
        q.svg = q.figure({ fiche: false });
      }

      if (q.reponseTexte === undefined) {
        if (q.type === 'nombre') {
          q.reponseTexte = nb2(q.reponse) + (q.unite ? ' ' + q.unite : '');
        } else if (q.type === 'choix') {
          q.reponseTexte = libelleChoix(q, q.reponse);
        } else {
          q.reponseTexte = String(q.reponse === undefined ? '' : q.reponse);
        }
      }

      /* Ligne de tolérance : toujours lue sur la valeur réellement utilisée
         par le contrôle, donc jamais désynchronisée de la correction. */
      if (q.tolTexte === undefined) q.tolTexte = texteTolerance(q);

      return q;
    }

    function libelleChoix(q, val) {
      var c = q.choix || [], j;
      for (j = 0; j < c.length; j++) if (String(c[j].val) === String(val)) return c[j].label;
      return String(val);
    }

    function texteTolerance(q) {
      if (q.type === 'choix') return q.consigne || '';
      if (q.type === 'texte') return '';
      if (q.type === 'multi') {
        var t = 0, j;
        for (j = 0; j < (q.champs || []).length; j++) t = Math.max(t, q.champs[j].tol || 0);
        return t > 0 ? 'Tolérance \u00B1 ' + nb(t, 3) : 'Réponse exacte attendue';
      }
      if (q.tol > 0) {
        return 'Tolérance \u00B1 ' + nb(q.tol, 3) + (q.unite ? ' ' + q.unite : '');
      }
      return 'Réponse exacte attendue';
    }

    /* ── Tirage ───────────────────────────────────────────────────────── */
    function cleTiree() {
      if (M.famille && M.famille !== 'mix' && parCle[M.famille]) return M.famille;
      var dispo = [], j;
      for (j = 0; j < familles.length; j++) {
        if (familles[j].gen) dispo.push(familles[j].value);
      }
      return dispo[Math.floor(Math.random() * dispo.length)];
    }

    M.tirer = function (cleForcee) {
      if (M.finie) return null;
      if (!M.debut) M.debut = (new Date()).getTime();

      var cle = cleForcee || cleTiree();
      var f = parCle[cle];
      if (!f || typeof f.gen !== 'function') {
        throw new Error('lp-defi : aucun générateur pour la famille ' + cle);
      }
      M.q = normaliser(f.gen(), cle);
      M.essai = 0;
      M.verrou = false;
      M.dernier = null;
      M.index++;
      return M.q;
    };

    /* ── Vérification ─────────────────────────────────────────────────── */

    /* Renvoie
         { vide:true }                       rien de saisi : aucun essai consommé
         { ok, essai, reste, phase, texte, verrou, champs }
       phase vaut 'reussi', 'indice' ou 'correction'. */
    M.verifier = function (rep) {
      if (!M.q || M.verrou) return null;

      var q = M.q, ok = false, det = null;

      if (q.type === 'choix') {
        if (rep === null || rep === undefined || rep === '') return { vide: true };
        ok = (String(rep) === String(q.reponse));

      } else if (q.type === 'texte') {
        if (rep === null || rep === undefined || normTexte(rep) === '') return { vide: true };
        var attendus = q.accepte || [q.reponse];
        var j;
        for (j = 0; j < attendus.length && !ok; j++) {
          ok = (normTexte(rep) === normTexte(attendus[j]));
        }

      } else if (q.type === 'multi') {
        var champs = q.champs || [];
        var vals = (rep && rep.length !== undefined) ? rep : [];
        var vide = true;
        det = [];
        ok = true;
        for (j = 0; j < champs.length; j++) {
          var v = lireNombre(vals[j]);
          if (v !== null) vide = false;
          var att = (champs[j].reponse !== undefined) ? champs[j].reponse : null;
          var bon = (v !== null) && proche(v, att, champs[j].tol || 0);
          det.push(bon);
          if (!bon) ok = false;
        }
        if (vide) return { vide: true };

      } else {                                   // 'nombre'
        var val = lireNombre(rep);
        if (val === null) return { vide: true };
        ok = proche(val, q.reponse, q.tol);
      }

      M.essai++;
      var dernierEssai = (M.essai >= essaisMax);
      var phase = ok ? 'reussi' : (dernierEssai ? 'correction' : 'indice');

      var res = {
        ok: ok,
        essai: M.essai,
        reste: Math.max(0, essaisMax - M.essai),
        phase: phase,
        champs: det,
        verrou: ok || dernierEssai,
        texte: texteRetour(q, phase)
      };
      M.dernier = res;

      if (res.verrou) clore(ok);
      return res;
    };

    /* Le message rendu à l'élève, selon la phase.
       Un outil dont les indices ne sont pas encore rédigés reste utilisable :
       on annonce alors franchement le second essai, sans rien inventer. */
    function texteRetour(q, phase) {
      if (phase === 'reussi') {
        return '<strong>Correct !</strong> ' + (q.detail || '');
      }
      if (phase === 'indice') {
        var t = '<strong>Pas encore.</strong> ';
        if (q.hint) t += q.hint + ' ';
        else if (q.rappel && estPlus()) t += q.rappel + ' ';
        return t + '<em>Il te reste un essai.</em>';
      }
      return '<strong>Pas tout à fait.</strong> ' + (q.detail || '');
    }

    /* ── Clôture, comptage, journal ───────────────────────────────────── */
    function compteur(sac, cle) {
      if (!cle) return null;
      if (!sac[cle]) sac[cle] = { vus: 0, bons: 0, bonsPremier: 0 };
      return sac[cle];
    }

    function clore(ok) {
      var q = M.q;
      M.verrou = true;
      M.total++;
      if (ok) M.bons++;
      var premier = (ok && M.essai === 1);
      if (premier) M.bonsPremier++;

      var cf = compteur(M.parFam, q.fam);
      if (cf) { cf.vus++; if (ok) cf.bons++; if (premier) cf.bonsPremier++; }
      var cc = compteur(M.parComp, q.comp);
      if (cc) { cc.vus++; if (ok) cc.bons++; if (premier) cc.bonsPremier++; }

      var ligne = {
        outil: M.outil, fam: q.fam, comp: q.comp,
        ok: ok, essais: M.essai, premier: premier,
        enonce: q.enonce || '', reponse: q.reponseTexte
      };
      M.journal.push(ligne);

      if (typeof cfg.onReponse === 'function') cfg.onReponse(ligne, M);
      emettre('lp:defi:reponse', ligne);

      if (serie > 0 && M.total >= serie) finirSerie();
    }

    function finirSerie() {
      M.finie = true;
      var b = M.bilan();
      if (typeof cfg.onFin === 'function') cfg.onFin(b, M);
      emettre('lp:defi:fin', b);
    }

    M.bilan = function () {
      return {
        outil:       M.outil,
        serie:       serie,
        total:       M.total,
        bons:        M.bons,
        bonsPremier: M.bonsPremier,
        duree:       M.debut ? Math.round(((new Date()).getTime() - M.debut) / 1000) : 0,
        familles:    M.parFam,
        comps:       M.parComp,
        questions:   M.journal.slice(0)
      };
    };

    M.reinitialiser = function () {
      M.total = 0; M.bons = 0; M.bonsPremier = 0; M.index = 0;
      M.finie = false; M.debut = 0; M.journal = [];
      M.parFam = {}; M.parComp = {};
      M.q = null; M.essai = 0; M.verrou = false; M.dernier = null;
    };

    M.setFamille = function (cle) { M.famille = cle; };
    M.estPlus = estPlus;

    /* ── Passerelle vers la fiche imprimable ──────────────────────────── */
    /* Le même objet question alimente l'écran et le papier. « rappel »
       devient le champ hint de lp-fiche.js, qui l'imprime au-dessus de la
       zone de réponse ; « detail » n'est pas imprimé, le corrigé se
       contentant de reponseTexte. */
    M.versFiche = function (q, num) {
      var svg = (typeof q.figure === 'function')
        ? q.figure({ fiche: true, w: 200, h: 160, sansValeurs: true })
        : (q.svg || '');
      var cotes = q.cotes || '';
      if (q.enonce) cotes = cotes ? (cotes + ' \u00B7 ' + q.enonce) : q.enonce;
      return {
        num:  num,
        nom:  q.nom || '',
        hint: q.consigne || q.rappel || '',
        svg:  svg,
        cotes: cotes,
        answerText: q.reponseTexte
      };
    };

    /* plan = ce que renvoie LP.ficheModal : [{fam, n}, …] */
    M.questionsFiche = function (plan) {
      var out = [], num = 1, j, k;
      for (j = 0; j < plan.length; j++) {
        for (k = 0; k < plan[j].n; k++) {
          out.push(M.versFiche(normaliser(parCle[plan[j].fam].gen(), plan[j].fam, true), num++));
        }
      }
      return out;
    };

    if (cfg.dom !== false) monter(M, cfg);
    return M;
  }

  /* ═══ PILOTE D'AFFICHAGE ═══════════════════════════════════════════════
     Construit ce qui est identique d'un outil à l'autre : onglets de
     familles, zone de réponse, fil des essais, retour, score, barre de
     progression, touche Entrée. L'outil ne fournit qu'un balisage vide. */

  var ID = {
    racine:    '#mode-defi',
    familles:  '#defi-familles',
    aide:      '#defi-aide',
    figure:    '#defi-figure',
    svg:       '#defi-svg',
    cotes:     '#defi-cotes',
    enonce:    '#defi-enonce',
    reponse:   '#defi-reponse',
    tol:       '#defi-tol',
    verifier:  '#btn-check',
    feedback:  '#defi-feedback',
    suivant:   '#btn-next',
    score:     '#defi-score',
    progres:   '#defi-progress',
    badgePlus: '#defi-plus-badge'
  };

  function monter(M, cfg) {
    var sel = {}, k;
    for (k in ID) if (Object.prototype.hasOwnProperty.call(ID, k)) sel[k] = ID[k];
    if (cfg.el) for (k in cfg.el) if (Object.prototype.hasOwnProperty.call(cfg.el, k)) sel[k] = cfg.el[k];

    var racine = $(sel.racine);
    if (!racine) return;                 // page sans mode défi : on se tait

    var el = {};
    for (k in sel) if (Object.prototype.hasOwnProperty.call(sel, k)) {
      el[k] = (k === 'racine') ? racine : $(sel[k], document);
    }

    var choixCourant = null;

    /* ── Onglets de familles ────────────────────────────────────────── */
    function construireOnglets() {
      if (!el.familles) return;
      var html = '', j;
      if (cfg.melange !== false && M.familles.length > 1) {
        var mel = cfg.melange || {};
        html += onglet('mix', mel.label || 'Mélange', mel.couleur || 'purple');
      }
      for (j = 0; j < M.familles.length; j++) {
        html += onglet(M.familles[j].value, M.familles[j].label || M.familles[j].value,
                       M.familles[j].couleur || '');
      }
      el.familles.className = 'shape-tabs';
      el.familles.innerHTML = html;
      var btns = el.familles.querySelectorAll('button');
      for (j = 0; j < btns.length; j++) {
        btns[j].addEventListener('click', function () {
          var b = el.familles.querySelectorAll('button'), i2;
          for (i2 = 0; i2 < b.length; i2++) b[i2].classList.remove('active');
          this.classList.add('active');
          M.setFamille(this.getAttribute('data-fam'));
          suivante();
        });
      }
      marquerOnglet(M.famille);
    }

    /* couleur = un nom de la palette de lp-ui.css (blue, teal, amber, coral,
       purple, pink, green, amber2). C'est data-color qui colore l'onglet
       actif, la pastille ne fait que le rappeler à l'état inactif. */
    function onglet(cle, label, couleur) {
      return '<button type="button" class="shape-tab" data-fam="' + ech(cle) + '"'
           + (couleur ? ' data-color="' + ech(couleur) + '"' : '') + '>'
           + (couleur ? '<span class="dot" style="background:var(--' + ech(couleur) + ')"></span>' : '')
           + ech(label) + '</button>';
    }

    function marquerOnglet(cle) {
      if (!el.familles) return;
      var b = el.familles.querySelectorAll('button'), j;
      for (j = 0; j < b.length; j++) {
        b[j].classList.toggle('active', b[j].getAttribute('data-fam') === cle);
      }
    }

    /* ── Zone de réponse ────────────────────────────────────────────── */
    function construireReponse(q) {
      if (!el.reponse) return;
      choixCourant = null;
      var h = '', j;

      if (q.type === 'choix') {
        h = '<div class="defi-choix">';
        for (j = 0; j < q.choix.length; j++) {
          h += '<button type="button" class="defi-choice" data-val="'
             + ech(q.choix[j].val) + '">' + q.choix[j].label + '</button>';
        }
        h += '</div>';

      } else if (q.type === 'multi') {
        h = '<div class="defi-champs">';
        for (j = 0; j < q.champs.length; j++) {
          h += '<div class="defi-champ" data-i="' + j + '">'
             + '<label for="defi-champ-' + j + '">' + ech(q.champs[j].label || '') + '</label>'
             + '<input type="text" inputmode="decimal" autocomplete="off" id="defi-champ-' + j + '">'
             + (q.champs[j].unite ? '<span class="unit">' + ech(q.champs[j].unite) + '</span>' : '')
             + '</div>';
        }
        h += '</div>';

      } else {
        /* type="text" + inputmode="decimal" et non type="number" : sur un
           clavier français la virgule vide la valeur d'un champ number dans
           plusieurs navigateurs, et l'élève voit « entre une valeur » alors
           qu'il a bien répondu. */
        h = '<div class="defi-input-row">'
          + '<label for="defi-input">' + ech(q.label || '=') + '</label>'
          + '<input type="text" inputmode="' + (q.type === 'texte' ? 'text' : 'decimal')
          + '" autocomplete="off" id="defi-input" placeholder="?">'
          + (q.unite ? '<span class="unit">' + ech(q.unite) + '</span>' : '')
          + '</div>';
      }

      el.reponse.innerHTML = h;

      if (q.type === 'choix') {
        var btns = el.reponse.querySelectorAll('.defi-choice');
        for (j = 0; j < btns.length; j++) {
          btns[j].addEventListener('click', function () {
            if (M.verrou || this.classList.contains('elimine')) return;
            var b = el.reponse.querySelectorAll('.defi-choice'), i2;
            for (i2 = 0; i2 < b.length; i2++) b[i2].classList.remove('selected');
            this.classList.add('selected');
            choixCourant = this.getAttribute('data-val');
          });
        }
      } else {
        var prem = el.reponse.querySelector('input');
        if (prem && prem.focus) { try { prem.focus(); } catch (e) {} }
      }
    }

    function lireSaisie(q) {
      if (q.type === 'choix') return choixCourant;
      if (q.type === 'multi') {
        var inp = el.reponse.querySelectorAll('input'), out = [], j;
        for (j = 0; j < inp.length; j++) out.push(inp[j].value);
        return out;
      }
      var i1 = el.reponse.querySelector('input');
      return i1 ? i1.value : '';
    }

    /* ── Affichage d'une question ───────────────────────────────────── */
    function afficher(q) {
      if (el.badgePlus) el.badgePlus.classList.toggle('visible', !!M.estPlus());

      if (el.svg) el.svg.innerHTML = q.svg || '';
      if (el.figure) el.figure.style.display = (q.svg || q.cotes) ? '' : 'none';
      if (el.cotes) el.cotes.innerHTML = q.cotes || '';
      if (el.enonce) el.enonce.innerHTML = q.enonce ? '<strong>' + q.enonce + '</strong>' : '';

      /* Le rappel n'est offert qu'en mode défi ; en Défi ⁺ l'élève doit
         retrouver la propriété. L'indice du second essai, lui, existe
         dans les deux modes : c'est le filet, pas la béquille. */
      if (el.aide) {
        if (!M.estPlus() && q.rappel) {
          el.aide.style.display = 'block';
          el.aide.innerHTML = '<b>Rappel :</b> ' + q.rappel;
        } else {
          el.aide.style.display = 'none';
          el.aide.innerHTML = '';
        }
      }

      if (el.tol) {
        el.tol.innerHTML = q.tolTexte || '';
        el.tol.style.display = q.tolTexte ? '' : 'none';
      }

      construireReponse(q);
      viderRetour();
      if (el.verifier) { el.verifier.style.display = ''; el.verifier.disabled = false; }
      if (el.suivant) el.suivant.style.display = 'none';
      majScore();
    }

    function viderRetour() {
      if (!el.feedback) return;
      el.feedback.className = 'feedback-box';
      el.feedback.innerHTML = '';          // :empty reprend la main sur le CSS
    }

    /* ── Vérification ───────────────────────────────────────────────── */
    function verifier() {
      if (!M.q || M.verrou) return;
      var res = M.verifier(lireSaisie(M.q));
      if (!res) return;

      if (res.vide) {
        el.feedback.className = 'feedback-box wrong';
        el.feedback.innerHTML = M.q.type === 'choix'
          ? '<strong>Choisis une réponse</strong> avant de vérifier.'
          : '<strong>Entre une valeur</strong> avant de vérifier.';
        return;
      }

      el.feedback.className = 'feedback-box ' + (res.ok ? 'correct' : 'wrong');
      el.feedback.innerHTML = res.texte
        + (res.verrou ? '' : ' <span class="defi-essai">Essai ' + res.essai
                             + ' sur ' + M.essaisMax + '</span>');

      marquerChamps(res);

      if (res.verrou) {
        if (el.verifier) el.verifier.style.display = 'none';
        if (el.suivant) {
          el.suivant.style.display = 'block';
          el.suivant.textContent = M.finie ? 'Nouvelle série \u2192' : 'Question suivante \u2192';
        }
        if (res.ok) confettis();
        if (M.finie) afficherBilan();
      } else {
        /* Second essai : on laisse la saisie en place pour qu'elle soit
           corrigée, et on la présélectionne pour un remplacement rapide. */
        var i1 = el.reponse.querySelector('input');
        if (i1 && i1.select) { try { i1.focus(); i1.select(); } catch (e) {} }
      }
      majScore();
    }

    function marquerChamps(res) {
      var q = M.q, j;
      if (q.type === 'choix') {
        var btns = el.reponse.querySelectorAll('.defi-choice');
        for (j = 0; j < btns.length; j++) {
          var v = btns[j].getAttribute('data-val');
          if (res.verrou) {
            btns[j].classList.add('locked');
            if (String(v) === String(q.reponse)) btns[j].classList.add('correct');
            else if (btns[j].classList.contains('selected')) btns[j].classList.add('incorrect');
          } else if (btns[j].classList.contains('selected')) {
            /* Premier essai raté : on élimine la proposition choisie plutôt
               que de dévoiler la bonne. L'élève rejoue sur ce qui reste. */
            btns[j].classList.remove('selected');
            btns[j].classList.add('elimine');
            choixCourant = null;
          }
        }
      } else if (q.type === 'multi' && res.champs) {
        var cases = el.reponse.querySelectorAll('.defi-champ');
        for (j = 0; j < cases.length; j++) {
          cases[j].classList.remove('ok', 'ko');
          cases[j].classList.add(res.champs[j] ? 'ok' : 'ko');
        }
      }
    }

    /* ── Score, progression, bilan ──────────────────────────────────── */
    function majScore() {
      if (el.score) {
        var t = M.bons + ' / ' + M.total + ' correct' + (M.bons > 1 ? 's' : '');
        if (M.serie) t += ' \u00B7 question ' + Math.min(M.index, M.serie) + ' sur ' + M.serie;
        el.score.textContent = t;
      }
      if (el.progres) {
        var pct = M.serie
          ? (M.total / M.serie * 100)
          : (M.total > 0 ? M.bons / M.total * 100 : 0);
        el.progres.style.width = Math.max(0, Math.min(100, pct)) + '%';
      }
    }

    function afficherBilan() {
      var b = M.bilan();
      var pct = b.total ? Math.round(b.bons / b.total * 100) : 0;
      var lignes = '', cle;
      for (cle in b.familles) if (Object.prototype.hasOwnProperty.call(b.familles, cle)) {
        var f = b.familles[cle], nom = cle, j;
        for (j = 0; j < M.familles.length; j++) {
          if (M.familles[j].value === cle) nom = M.familles[j].label || cle;
        }
        lignes += '<li>' + ech(nom) + ' : ' + f.bons + ' / ' + f.vus
                + (f.bonsPremier ? ' (dont ' + f.bonsPremier + ' du premier coup)' : '') + '</li>';
      }
      el.feedback.className = 'feedback-box ' + (pct >= 60 ? 'correct' : 'wrong');
      el.feedback.innerHTML =
        '<strong>Série terminée \u00B7 ' + b.bons + ' / ' + b.total + ' (' + pct + ' %)</strong>'
        + '<ul class="defi-bilan">' + lignes + '</ul>';
    }

    /* ── Enchaînement ───────────────────────────────────────────────── */
    function suivante() {
      if (M.finie) M.reinitialiser();
      M.tirer();
      afficher(M.q);
    }

    /* Recopiés jusqu'ici dans Thalès et Pythagore. Respectent le réglage
       « figer les animations » de la barre d'affichage (touche M). */
    function confettis() {
      if (cfg.confettis === false) return;
      if (typeof cfg.confettis === 'function') { cfg.confettis(); return; }
      if (document.documentElement.getAttribute('data-motion') === 'off') return;
      var couleurs = ['#993C1D', '#185FA5', '#0F6E56', '#854F0B', '#534AB7', '#3B6D11'];
      for (var j = 0; j < 26; j++) {
        (function (r) {
          setTimeout(function () {
            var c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = Math.round(Math.random() * 100) + 'vw';
            c.style.top = '-12px';
            c.style.background = couleurs[Math.floor(Math.random() * couleurs.length)];
            document.body.appendChild(c);
            setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 2600);
          }, r * 28);
        })(j);
      }
    }

    /* ── Branchements ───────────────────────────────────────────────── */
    construireOnglets();
    if (el.verifier) el.verifier.addEventListener('click', verifier);
    if (el.suivant) el.suivant.addEventListener('click', suivante);

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      if (window.LP.ficheModal && LP.ficheModal.isOpen && LP.ficheModal.isOpen()) return;
      if (!el.racine.classList.contains('active')) return;
      if (M.verrou) suivante(); else verifier();
    });

    M.ui = {
      afficher:  afficher,
      suivante:  suivante,
      verifier:  verifier,
      majScore:  majScore,
      el:        el,
      marquerOnglet: marquerOnglet
    };

    M.demarrer = function () { suivante(); };
  }

  /* ═══ EXPORTS ══════════════════════════════════════════════════════════ */
  window.LP.defi = {
    creer:        creer,
    montrerBloc:  montrerBloc,
    lireNombre:   lireNombre,
    proche:       proche,
    melanger:     melangerTableau,
    version:      '2026-08-10'
  };

  window.LP.nb  = window.LP.nb  || nb;
  window.LP.nb1 = window.LP.nb1 || nb1;
  window.LP.nb2 = window.LP.nb2 || nb2;
})();
