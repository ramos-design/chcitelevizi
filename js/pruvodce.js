/* ═══════════════════════════════════════════════════════
   PRŮVODCE VÝBĚREM TV — interaktivní kvíz
   CHCI TELEVIZI — Premium TV Installation, Prague
═══════════════════════════════════════════════════════ */

'use strict';

(() => {
  const overlay = document.getElementById('guide');
  if (!overlay) return;

  const body = overlay.querySelector('.pg-body');
  const progressFill = overlay.querySelector('.pg-progress-fill');
  const stepCount = overlay.querySelector('.pg-step-count');
  const backBtn = overlay.querySelector('.pg-back');
  const nextBtn = overlay.querySelector('.pg-next');
  const closeBtn = overlay.querySelector('.pg-close');

  /* ── Otázky ── */
  const QUESTIONS = [
    {
      id: 'room', q: 'Kam bude televize umístěná?', multi: false, cols: 2,
      options: [
        { v: 'obyvak', emoji: '🛋️', label: 'Obývací pokoj' },
        { v: 'loznice', emoji: '🛏️', label: 'Ložnice' },
        { v: 'kuchyne', emoji: '🍳', label: 'Kuchyně' },
        { v: 'kancelar', emoji: '🏢', label: 'Kancelář / firma' },
      ],
    },
    {
      id: 'distance', q: 'Jak daleko od televize budete sedět?', hint: 'Určí ideální úhlopříčku.', multi: false, cols: 2,
      options: [
        { v: 'd1', emoji: '📏', label: 'Do 2 metrů' },
        { v: 'd2', emoji: '📏', label: '2 – 3 metry' },
        { v: 'd3', emoji: '📏', label: '3 – 4 metry' },
        { v: 'd4', emoji: '📏', label: 'Více než 4 metry' },
      ],
    },
    {
      id: 'mount', q: 'Jak chcete televizi umístit?', multi: false,
      options: [
        { v: 'stolek', emoji: '🪑', label: 'Na stolek', sub: 'Postavit na TV stolek nebo komodu' },
        { v: 'zed_fix', emoji: '🧱', label: 'Na zeď – fixní držák', sub: 'Pevně u stěny' },
        { v: 'zed_pol', emoji: '🔧', label: 'Na zeď – polohovatelný držák', sub: 'Naklápění / vysunutí' },
        { v: 'nevim', emoji: '🤔', label: 'Zatím nevím – poraďte', sub: 'Doporučíme při zaměření' },
      ],
    },
    {
      id: 'use', q: 'K čemu ji budete hlavně používat?', hint: 'Můžete vybrat více možností.', multi: true, cols: 2,
      options: [
        { v: 'filmy', emoji: '🎬', label: 'Filmy a seriály' },
        { v: 'sport', emoji: '⚽', label: 'Sport' },
        { v: 'hry', emoji: '🎮', label: 'Hraní her' },
        { v: 'bezna', emoji: '📺', label: 'Běžná TV a zprávy' },
        { v: 'prace', emoji: '💼', label: 'Práce a prezentace' },
      ],
    },
    {
      id: 'light', q: 'Sledujete často ve dne / ve světlé místnosti?', hint: 'Ovlivní potřebný jas a typ panelu.', multi: false,
      options: [
        { v: 'svetlo', emoji: '☀️', label: 'Ano, hodně světla', sub: 'Velká okna, sledování přes den' },
        { v: 'tma', emoji: '🌙', label: 'Spíš zatemněno', sub: 'Večerní sledování, kino atmosféra' },
        { v: 'smis', emoji: '🌤️', label: 'Smíšeně', sub: 'Den i večer' },
      ],
    },
    {
      id: 'quality', q: 'Jak důležitá je pro vás kvalita obrazu?', multi: false,
      options: [
        { v: 'spicka', emoji: '🏆', label: 'Chci špičku', sub: 'Domácí kino, dokonalá černá' },
        { v: 'stredni', emoji: '👍', label: 'Střední třída', sub: 'Skvělý poměr cena/výkon' },
        { v: 'cena', emoji: '💶', label: 'Hlavní je cena', sub: 'Solidní obraz za rozumné peníze' },
      ],
    },
    {
      id: 'gaming', q: 'Hrajete moderní hry na konzoli nebo PC?', hint: 'PS5 / Xbox / herní PC – kvůli 120 Hz a HDMI 2.1.', multi: false, cols: 2,
      options: [
        { v: 'ano', emoji: '🎮', label: 'Ano, hodně' },
        { v: 'obcas', emoji: '🕹️', label: 'Občas' },
        { v: 'ne', emoji: '🚫', label: 'Ne' },
      ],
    },
    {
      id: 'budget', q: 'Jaký je váš rozpočet na televizi?', multi: false, cols: 2,
      options: [
        { v: 'b1', emoji: '💰', label: 'Do 10 000 Kč' },
        { v: 'b2', emoji: '💰', label: '10 – 20 000 Kč' },
        { v: 'b3', emoji: '💰', label: '20 – 35 000 Kč' },
        { v: 'b4', emoji: '💎', label: '35 000 Kč a více' },
      ],
    },
    {
      id: 'brand', q: 'Máte preferovanou značku?', multi: false, cols: 2,
      options: [
        { v: 'Samsung', emoji: '📺', label: 'Samsung' },
        { v: 'LG', emoji: '📺', label: 'LG' },
        { v: 'Sony', emoji: '📺', label: 'Sony' },
        { v: 'Hisense', emoji: '📺', label: 'Hisense' },
        { v: 'TCL', emoji: '📺', label: 'TCL' },
        { v: 'Philips', emoji: '📺', label: 'Philips' },
        { v: 'bez', emoji: '✨', label: 'Bez preference – doporučte' },
      ],
    },
    {
      id: 'service', q: 'Jakou službu od nás chcete?', multi: false,
      options: [
        { v: 'poradit', emoji: '💬', label: 'Jen poradit s výběrem', sub: 'Online / telefonická konzultace' },
        { v: 'instalovat', emoji: '🚚', label: 'Dovézt a nainstalovat', sub: 'Doprava + instalace na místě' },
        { v: 'naklic', emoji: '🌟', label: 'Komplet na klíč', sub: 'Výběr, instalace i kompletní nastavení' },
      ],
    },
  ];

  const answers = {};
  let step = 0;

  /* ── Otevření / zavření ── */
  function open() {
    Object.keys(answers).forEach((k) => delete answers[k]);
    nextBtn.style.display = '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    step = 0;
    render();
  }
  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });

  // Spouštěče (jakýkoliv prvek s [data-open-guide])
  document.querySelectorAll('[data-open-guide]').forEach((el) => {
    el.addEventListener('click', (e) => { e.preventDefault(); open(); });
  });

  /* ── Render otázky ── */
  function render() {
    const total = QUESTIONS.length;
    const Q = QUESTIONS[step];

    progressFill.style.width = `${(step / total) * 100}%`;
    stepCount.textContent = `Otázka ${step + 1} z ${total}`;
    backBtn.hidden = step === 0;

    const sel = answers[Q.id];
    const optsHtml = Q.options.map((o) => {
      const isSel = Q.multi ? Array.isArray(sel) && sel.includes(o.v) : sel === o.v;
      return `
        <button type="button" class="pg-opt${isSel ? ' selected' : ''}" data-val="${o.v}">
          <span class="pg-opt-emoji">${o.emoji}</span>
          <span class="pg-opt-main">
            <span class="pg-opt-label">${o.label}</span>
            ${o.sub ? `<span class="pg-opt-sub">${o.sub}</span>` : ''}
          </span>
          <span class="pg-opt-check">${isSel ? '✓' : ''}</span>
        </button>`;
    }).join('');

    body.innerHTML = `
      <div class="pg-question">${Q.q}</div>
      ${Q.hint ? `<div class="pg-hint">${Q.hint}</div>` : ''}
      <div class="pg-options${Q.cols === 2 ? ' cols-2' : ''}">${optsHtml}</div>
    `;
    body.scrollTop = 0;

    nextBtn.textContent = step === total - 1 ? 'Zobrazit doporučení →' : 'Pokračovat →';
    updateNext();

    body.querySelectorAll('.pg-opt').forEach((btn) => {
      btn.addEventListener('click', () => choose(Q, btn.dataset.val));
    });
  }

  function choose(Q, val) {
    if (Q.multi) {
      const cur = Array.isArray(answers[Q.id]) ? answers[Q.id] : [];
      answers[Q.id] = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
      render();
    } else {
      answers[Q.id] = val;
      // jednovýběr posune automaticky
      if (step < QUESTIONS.length - 1) {
        step++;
        render();
      } else {
        render();
        setTimeout(showResult, 220);
      }
    }
  }

  function updateNext() {
    const Q = QUESTIONS[step];
    const sel = answers[Q.id];
    const has = Q.multi ? Array.isArray(sel) && sel.length > 0 : !!sel;
    nextBtn.disabled = !has;
  }

  nextBtn.addEventListener('click', () => {
    const Q = QUESTIONS[step];
    const sel = answers[Q.id];
    const has = Q.multi ? Array.isArray(sel) && sel.length > 0 : !!sel;
    if (!has) return;
    if (step < QUESTIONS.length - 1) { step++; render(); }
    else showResult();
  });

  backBtn.addEventListener('click', () => {
    if (step > 0) { step--; render(); }
  });

  /* ── Vyhodnocení ── */
  function evaluate() {
    const a = answers;
    const use = Array.isArray(a.use) ? a.use : [];

    // Úhlopříčka dle vzdálenosti
    const sizeMap = {
      d1: { range: '40 – 50"', mid: 48 },
      d2: { range: '55 – 65"', mid: 60 },
      d3: { range: '65 – 75"', mid: 70 },
      d4: { range: '75 – 85"', mid: 80 },
    };
    const size = sizeMap[a.distance] || sizeMap.d2;

    // Technologie panelu
    let tech, techWhy;
    if (a.quality === 'cena') {
      tech = 'Kvalitní LED / základní QLED';
      techWhy = 'Spolehlivý obraz za rozumnou cenu.';
    } else if (a.light === 'svetlo') {
      tech = 'QLED nebo Mini LED';
      techWhy = 'Vysoký jas, který si poradí se světlou místností a odlesky.';
    } else if (a.quality === 'spicka') {
      tech = 'OLED';
      techWhy = 'Dokonalá černá a kontrast pro filmový zážitek v zatemnění.';
    } else {
      tech = 'QLED / Mini LED';
      techWhy = 'Skvělý poměr jasu, barev a ceny pro každodenní sledování.';
    }

    // Herní poznámka
    const gamingNote = a.gaming === 'ano'
      ? 'Pro konzole zvolte model se 120 Hz panelem a HDMI 2.1.'
      : (a.gaming === 'obcas' ? 'Pro občasné hraní postačí běžný herní režim (ALLM).' : '');

    // Doporučené značky
    let brands;
    if (a.brand && a.brand !== 'bez') {
      brands = `${a.brand} – skvělá volba, vybereme konkrétní model dle parametrů.`;
    } else if (tech.indexOf('OLED') !== -1) {
      brands = 'LG, Sony nebo Philips (špička v OLED panelech).';
    } else if (a.quality === 'cena' || a.budget === 'b1') {
      brands = 'TCL nebo Hisense (nejlepší poměr cena/výkon).';
    } else {
      brands = 'Samsung, TCL nebo Hisense (skvělý jas a barvy).';
    }

    // Balíček
    const onWall = a.mount === 'zed_fix' || a.mount === 'zed_pol';
    let pkg;
    if (a.service === 'poradit') {
      pkg = { name: 'Support', price: '490 Kč', desc: 'Online, e-mailová či telefonická konzultace s doporučením vhodné TV podle vašeho rozpočtu a představ.' };
    } else if (a.service === 'instalovat') {
      pkg = onWall
        ? { name: 'Standard', price: 'od 2 490 Kč', desc: 'Výběr TV, doprava po Praze a instalace na zeď včetně držáku a uložení kabeláže.' }
        : { name: 'Basic', price: 'od 1 490 Kč', desc: 'Výběr TV, doprava po Praze a instalace na stolek včetně připojení k síti a podpory.' };
    } else { // naklic
      pkg = onWall
        ? { name: 'Exclusive PRO', price: 'od 4 990 Kč', desc: 'Kompletní řešení na klíč – výběr, instalace na zeď, konfigurace aplikací i finální nastavení s neomezenou podporou.' }
        : { name: 'Exclusive', price: 'od 3 990 Kč', desc: 'Individuální konfigurace pro nejnáročnější – instalace, nastavení aplikací, optimalizace obrazu a neomezená podpora.' };
    }

    // Poznámka k limitu Basic do 55"
    let pkgNote = '';
    if (pkg.name === 'Basic' && size.mid > 55) {
      pkgNote = 'Doporučená úhlopříčka přesahuje 55". Balíček Basic je do 55" – pro větší TV zvolte Standard (instalace na zeď je u velkých TV ideální).';
    }
    if (a.mount === 'nevim' && a.service !== 'poradit') {
      pkgNote = pkgNote || 'Způsob umístění (zeď/stolek) doladíme zdarma při zaměření – cena se případně upraví podle zvoleného balíčku.';
    }

    return { size, tech, techWhy, gamingNote, brands, pkg, pkgNote };
  }

  /* ── Výsledková obrazovka ── */
  function showResult() {
    const r = evaluate();
    progressFill.style.width = '100%';
    stepCount.textContent = 'Hotovo · vaše doporučení';
    backBtn.hidden = false;
    nextBtn.style.display = 'none';

    body.innerHTML = `
      <div class="pg-result-head">
        <span class="pg-result-badge">Na míru vám</span>
        <div class="pg-result-title">Naše doporučení</div>
      </div>

      <div class="pg-result-grid">
        <div class="pg-spec">
          <span class="pg-spec-emoji">📐</span>
          <div>
            <div class="pg-spec-label">Úhlopříčka</div>
            <div class="pg-spec-value">${r.size.range}<small>Optimální velikost pro vaši vzdálenost sezení.</small></div>
          </div>
        </div>
        <div class="pg-spec">
          <span class="pg-spec-emoji">🖥️</span>
          <div>
            <div class="pg-spec-label">Technologie panelu</div>
            <div class="pg-spec-value">${r.tech}<small>${r.techWhy}${r.gamingNote ? ' ' + r.gamingNote : ''}</small></div>
          </div>
        </div>
        <div class="pg-spec">
          <span class="pg-spec-emoji">🏷️</span>
          <div>
            <div class="pg-spec-label">Doporučené značky</div>
            <div class="pg-spec-value">${r.brands}</div>
          </div>
        </div>
      </div>

      <div class="pg-reco">
        <div class="pg-reco-label">Doporučený balíček služeb</div>
        <div class="pg-reco-name">${r.pkg.name}</div>
        <div class="pg-reco-price">${r.pkg.price}</div>
        <div class="pg-reco-desc">${r.pkg.desc}</div>
        ${r.pkgNote ? `<div class="pg-reco-note">${r.pkgNote}</div>` : ''}
      </div>

      <div class="pg-result-actions">
        <a href="#kontakt" class="btn-primary" data-guide-go>Objednat / nezávazně poptat →</a>
        <a href="#tarify" class="btn-secondary" data-guide-go>Zobrazit všechny balíčky</a>
      </div>
      <button type="button" class="pg-restart">↺ Spustit průvodce znovu</button>
    `;
    body.scrollTop = 0;

    body.querySelectorAll('[data-guide-go]').forEach((el) => {
      el.addEventListener('click', () => { nextBtn.style.display = ''; close(); });
    });
    const restart = body.querySelector('.pg-restart');
    if (restart) restart.addEventListener('click', () => {
      Object.keys(answers).forEach((k) => delete answers[k]);
      nextBtn.style.display = '';
      step = 0;
      render();
    });
  }
})();
