<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GMPCIE YONNE SUD</title>
  <style>
    :root{
      --bg: #0f0f0f;
      --card: #1e1b16;
      --text: #f3f0e9;
      --accent: #e07a24;
      --muted: #c9b59a;
      --ring: 0 0 0 3px rgba(224, 122, 36, 0.35);
    }

    /* Layout */
    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: var(--text); background: radial-gradient( circle at 20% -10%, rgba(255,149,0,.25), transparent 40% ),
                                                                                                             radial-gradient( circle at 100% 0%, rgba(255,140,0,.25), transparent 40% ),
                                                                                                             linear-gradient(#2b1e13 0%, #0b0b0b 100%); }

    .wrapper {
      min-height: 100%;
      display: grid;
      place-items: center;
      padding: 40px 20px;
      position: relative;
      overflow: hidden;
    }

    .card {
      width: min(100%, 980px);
      background: rgba(30, 26, 22, 0.92);
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 20px 40px rgba(0,0,0,.4);
      border: 1px solid rgba(255,255,255,.05);
      position: relative;
      overflow: hidden;
      z-index: 2; /* pour être au-dessus des citrouilles */
    }

    /* Autumn decoration */
    .card:before, .card:after {
      content: "";
      position: absolute;
      width: 180px;
      height: 180px;
      background: radial-gradient(circle at 30% 30%, rgba(255, 150, 60, .9), rgba(255, 140, 0, .0) 40%);
      filter: blur(0.5px);
      opacity: .25;
      border-radius: 50%;
      pointer-events: none;
    }
    .card:before { top: -60px; left: -60px; transform: rotate(-20deg); }
    .card:after { bottom: -60px; right: -60px; transform: rotate(20deg); }

    h1 {
      margin: 0 0 16px;
      font-size: 2rem;
      letter-spacing: .5px;
    }
    p.lede {
      color: var(--muted);
      margin: 0 0 20px;
    }

    /* Grid of links */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
    }

    a.link-card {
      display: block;
      text-decoration: none;
      color: #fff;
      background: linear-gradient(135deg, rgba(255,111,0,.15), rgba(255,111,0,.0) 60%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 18px;
      transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
      position: relative;
      overflow: hidden;
    }
    a.link-card:hover {
      transform: translateY(-2px);
      background: linear-gradient(135deg, rgba(255,111,0,.28), rgba(255,111,0,.0) 60%);
      box-shadow: 0 8px 20px rgba(0,0,0,.25);
      outline: none;
    }
    a.link-card:focus {
      outline: none;
      box-shadow: var(--ring);
    }

    .link-title {
      font-size: 1.05rem;
      font-weight: 700;
      margin: 0 0 6px;
    }
    .link-desc {
      margin: 0;
      color: #f1e5d0;
      font-size: .95rem;
    }

    .pumpkin {
      height: 6px;
      border-radius: 3px;
      background: linear-gradient(90deg, #ff8a00, #e24a2a, #ff8a00);
      margin: 14px 0 0;
      opacity: .9;
    }

    /* --- AJOUT : pluie/neige de citrouilles --- */
    .pumpkin-snow {
      position: absolute;
      inset: 0;
      overflow: hidden;
      z-index: 1;
      pointer-events: none;
    }
    .pumpkin-snow svg {
      position: absolute;
      animation: fall linear infinite;
      opacity: 0.8;
      transform-origin: center;
    }

    @keyframes fall {
      0%   { transform: translateY(-10%) rotate(0deg) scale(1); opacity: 0; }
      10%  { opacity: 1; }
      100% { transform: translateY(120%) rotate(360deg) scale(1.1); opacity: 0; }
    }

    @media (max-width: 600px) {
      h1 { font-size: 1.5rem; }
    }
  </style>
</head>
<!-- Effet "neige lente de citrouilles" -->
<svg class="pumpkin-snow" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  z-index: 0;
">
  <defs>
    <!-- Petite citrouille stylisée -->
    <symbol id="pumpkin" viewBox="0 0 32 32">
      <ellipse cx="16" cy="18" rx="10" ry="8" fill="#e07a24" stroke="#b45a1d" stroke-width="1.5"/>
      <ellipse cx="16" cy="18" rx="6" ry="7" fill="#f28c28" stroke="#b45a1d" stroke-width="1"/>
      <rect x="14.5" y="6" width="3" height="5" rx="1" fill="#4b3c22"/>
    </symbol>

    <!-- Animations -->
    <style>
      @keyframes fall {
        0% {
          transform: translateY(-10%) translateX(0) rotate(0deg);
          opacity: 0;
        }
        10% { opacity: 1; }
        50% {
          transform: translateY(50vh) translateX(5px) rotate(180deg);
        }
        100% {
          transform: translateY(110vh) translateX(-5px) rotate(360deg);
          opacity: 0.9;
        }
      }
    </style>
  </defs>

  <!-- Groupe de citrouilles avec vitesses et décalages variés -->
  <g id="pumpkin-group">
    <use href="#pumpkin" x="5%"  y="-10%" width="40" height="40" style="animation: fall 32s linear infinite; animation-delay: 0s;"></use>
    <use href="#pumpkin" x="15%" y="-15%" width="28" height="28" style="animation: fall 36s linear infinite; animation-delay: 3s;"></use>
    <use href="#pumpkin" x="25%" y="-5%"  width="38" height="38" style="animation: fall 30s linear infinite; animation-delay: 5s;"></use>
    <use href="#pumpkin" x="35%" y="-20%" width="42" height="42" style="animation: fall 34s linear infinite; animation-delay: 2s;"></use>
    <use href="#pumpkin" x="45%" y="-12%" width="36" height="36" style="animation: fall 38s linear infinite; animation-delay: 6s;"></use>
    <use href="#pumpkin" x="55%" y="-18%" width="30" height="30" style="animation: fall 31s linear infinite; animation-delay: 4s;"></use>
    <use href="#pumpkin" x="65%" y="-25%" width="34" height="34" style="animation: fall 37s linear infinite; animation-delay: 1s;"></use>
    <use href="#pumpkin" x="75%" y="-10%" width="32" height="32" style="animation: fall 33s linear infinite; animation-delay: 3s;"></use>
    <use href="#pumpkin" x="85%" y="-15%" width="36" height="36" style="animation: fall 40s linear infinite; animation-delay: 8s;"></use>
    <use href="#pumpkin" x="95%" y="-5%"  width="28" height="28" style="animation: fall 29s linear infinite; animation-delay: 2s;"></use>
  </g>
</svg>

<body>
  <main class="wrapper" aria-label="Page de liens sur le thème de l'automne et pumpkins">

    <!-- décor animé -->
    <div class="pumpkin-snow" aria-hidden="true">
      <svg width="0" height="0" style="position:absolute">
        <defs>
          <symbol id="pumpkin" viewBox="0 0 100 80">
            <radialGradient id="g-body" cx="45" cy="40" r="50">
              <stop offset="0" stop-color="#ffb347"/>
              <stop offset="0.6" stop-color="#ff8c00"/>
              <stop offset="1" stop-color="#a84700"/>
            </radialGradient>
            <path d="M10 44 C10 20,30 10,50 12 C70 10,90 20,90 44 C90 60,75 74,50 74 C25 74,10 60,10 44 Z" fill="url(#g-body)"/>
            <path d="M50 12 C48 28,48 50,50 66" stroke="#7a3b00" stroke-opacity="0.3" stroke-width="3" fill="none"/>
            <path d="M46 6 C44 -2,56 -2,54 6 C62 8,60 14,50 14 C48 14,46 9,46 6 Z" fill="#5b3b18"/>
          </symbol>
        </defs>
      </svg>
    </div>

    <section class="card">
      <h1>GMPCIE Yonne Sud</h1>
      <p class="lede">Ressources officielles</p>
      <div class="pumpkin" aria-hidden="true"></div>

      <div class="grid" role="list">
        <a class="link-card" href="https://mathspc-lp.wp.ac-dijon.fr/" target="_blank" rel="noopener noreferrer" role="listitem">
          <div class="link-title">MSLP Dijon</div>
          <p class="link-desc">Maths Physique Chimie Dijon.</p>
        </a>

        <a class="link-card" href="https://mathspc-lp.wp.ac-dijon.fr/productions-gmpcie/" target="_blank" rel="noopener noreferrer" role="listitem">
          <div class="link-title">Productions GMPCIE</div>
          <p class="link-desc">Une sélection de production partagées.</p>
        </a>

        <a class="link-card" href="https://eduscol.education.fr/1793/programmes-et-ressources-en-mathematiques-voie-professionnelle" target="_blank" rel="noopener noreferrer" role="listitem">
          <div class="link-title">Eduscol Mathématiques en LP</div>
          <p class="link-desc">Les ressources Eduscol pour les Mathématiques en Lycée Professionnel.</p>
        </a>

        <a class="link-card" href="https://eduscol.education.fr/1795/programmes-et-ressources-en-physique-chimie-voie-professionnelle" target="_blank" rel="noopener noreferrer" role="listitem">
          <div class="link-title">Eduscol Physique-Chimie en LP</div>
          <p class="link-desc">Les ressources Eduscol pour la Physique et la Chimie en Lycée Professionnel.</p>
        </a>

        <a class="link-card" href="https://eduscol.education.fr/3890/enseigner-des-eleves-besoins-educatifs-particuliers" target="_blank" rel="noopener noreferrer" role="listitem">
          <div class="link-title">Eduscol, les élèves à besoin particulier</div>
          <p class="link-desc">Matériel, ressources et formations pour prendre en charge les élèves à besoin particulier.</p>
        </a>

        <a class="link-card" href="https://eduscol.education.fr/4023/les-savoirs-fondamentaux-au-lycee-professionnel" target="_blank" rel="noopener noreferrer" role="listitem">
          <div class="link-title">Eduscol, les fondamentaux en LP</div>
          <p class="link-desc">Méthodes, ressources et référentiels nécessaires à l’employabilité et de l’insertion professionnelle .</p>
        </a>
      </div>
    </section>
  </main>

  <script>
    // Génère des petites citrouilles flottantes
    const snow = document.querySelector('.pumpkin-snow');
    const nb = 18; // nombre de citrouilles visibles
    for (let i=0; i<nb; i++){
      const el = document.createElementNS('http://www.w3.org/2000/svg','svg');
      const use = document.createElementNS('http://www.w3.org/2000/svg','use');
      use.setAttributeNS('http://www.w3.org/1999/xlink','href','#pumpkin');
      el.appendChild(use);
      const size = 16 + Math.random()*28;
      el.setAttribute('width', size);
      el.setAttribute('height', size * 0.8);
      el.style.left = Math.random()*100 + '%';
      el.style.top = (-20 - Math.random()*60) + 'px';
      el.style.animationDuration = (10 + Math.random()*10) + 's';
      el.style.animationDelay = (Math.random()*8) + 's';
      el.style.opacity = (0.6 + Math.random()*0.4);
      snow.appendChild(el);
    }
  </script>
</body>
</html>
