/* ═══════════════════════════════════════════════════════
   PRŮVODCE VÝBĚREM TV — interaktivní kvíz
   Výstup: doporučená televize + konkrétní tarif z ceníku
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

  /* ═══ TARIFY — zrcadlí sekci #tarify v index.html ═══ */
  const TARIFFS = {
    support: {
      id: 'support', anchor: 'tarif-support',
      label: 'Konzultace', name: 'Support', price: '490 Kč', priceNote: 'jednorázově',
      desc: 'Online, e-mailová či telefonická konzultace s doporučením konkrétní televize podle vašeho rozpočtu a představ. Bez nutnosti instalace.',
      includes: [
        'Výběr TV na základě reálných zkušeností z praxe',
        'Doporučení konkrétního modelu k zakoupení',
        'Konzultace online, e-mailem nebo telefonicky',
      ],
    },
    basic: {
      id: 'basic', anchor: 'tarif-basic',
      label: 'Tarif 01', name: 'Basic', price: '2 500 Kč', priceNote: 'jednorázová platba',
      desc: 'Výběr televize, doprava po Praze a běžná instalace na TV stolek včetně připojení k síti.',
      includes: [
        'Výběr TV na základě reálných zkušeností z praxe',
        'Doporučení konkrétního modelu k zakoupení',
        'Základní doprava po Praze',
        'Běžná instalace na TV stolek a připojení k síti',
        'Podpora 7 dní od zakoupení',
        'Televize do úhlopříčky 55"',
      ],
    },
    standard: {
      id: 'standard', anchor: 'tarif-standard',
      label: 'Tarif 02', name: 'Standard', price: '3 500 Kč', priceNote: 'jednorázová platba',
      desc: 'Vše z Basicu navíc s instalací na zeď – připevníme držák, uložíme kabeláž a televizi zprovozníme.',
      includes: [
        'Vše z balíčku Basic',
        'Instalace televize na zeď',
        'Připevnění nástěnného držáku',
        'Uložení kabeláže a zprovoznění',
        'Televize do úhlopříčky 65"',
      ],
    },
    exclusive: {
      id: 'exclusive', anchor: 'tarif-exclusive',
      label: 'Tarif 03', name: 'Exclusive', price: '5 000 Kč', priceNote: 'jednorázová platba',
      desc: 'Kompletní řešení na klíč – instalace, nastavení aplikací, doladění obrazu i zvuku a neomezená podpora.',
      includes: [
        'Vše z balíčku Basic i Standard',
        'Individuální konfigurace pro nejnáročnější',
        'Komplexní přístup s neomezenou podporou',
        'Instalace a nastavení aplikací',
        'Doporučení optimálního nastavení obrazu i zvuku',
        'Televize do úhlopříčky 77"',
      ],
    },
    'exclusive-pro': {
      id: 'exclusive-pro', anchor: 'tarif-exclusive-pro',
      label: 'Tarif 04', name: 'Exclusive PRO', price: '6 500 Kč', priceNote: 'jednorázová platba',
      desc: 'Nejvyšší úroveň služby pro velkoformátové televize – od výběru po finální nastavení a osobní prezentaci všech funkcí.',
      includes: [
        'Vše z balíčku Basic, Standard i Exclusive',
        'Instalace televize na zeď',
        'Kompletní řešení od výběru po finální nastavení',
        'Neomezená podpora a prioritní přístup',
        'Osobní prezentace všech funkcí televize a jejího ovládání',
        'Televize nad úhlopříčku 77"',
      ],
    },
  };

  /* ═══ Otázky ═══
     `when` = otázka se zobrazí jen když predikát vrátí true */
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
      id: 'gaming', q: 'Jak intenzivně na televizi hrajete?',
      hint: 'PS5 / Xbox / herní PC – kvůli 120 Hz a HDMI 2.1.', multi: false, cols: 2,
      when: (a) => Array.isArray(a.use) && a.use.includes('hry'),
      options: [
        { v: 'ano', emoji: '🎮', label: 'Denně, na konzoli či PC' },
        { v: 'obcas', emoji: '🕹️', label: 'Občas pro zábavu' },
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
      id: 'budget', q: 'Jaký je váš rozpočet na televizi?', hint: 'Cena samotné TV – instalaci řešíme zvlášť.', multi: false, cols: 2,
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
      id: 'mount', q: 'Jak chcete televizi umístit?', hint: 'Zásadně ovlivňuje, který tarif budete potřebovat.', multi: false,
      options: [
        { v: 'stolek', emoji: '🪑', label: 'Na stolek', sub: 'Postavit na TV stolek nebo komodu' },
        { v: 'zed_fix', emoji: '🧱', label: 'Na zeď – fixní držák', sub: 'Pevně u stěny' },
        { v: 'zed_pol', emoji: '🔧', label: 'Na zeď – polohovatelný držák', sub: 'Naklápění / vysunutí' },
        { v: 'nevim', emoji: '🤔', label: 'Zatím nevím – poraďte', sub: 'Doporučíme při zaměření' },
      ],
    },
    {
      id: 'audio', q: 'Jak to máte se zvukem?', hint: 'Návrh audio řešení je zdarma, dodávka a instalace za příplatek.', multi: false,
      options: [
        { v: 'tv', emoji: '📺', label: 'Stačí mi reproduktory v TV', sub: 'Zprávy, běžné sledování' },
        { v: 'soundbar', emoji: '🔊', label: 'Zajímá mě soundbar', sub: 'Výrazně lepší zvuk bez kabelů navíc' },
        { v: 'kino', emoji: '🎚️', label: 'Chci domácí kino / AV receiver', sub: 'Prostorový zvuk, více reproduktorů' },
        { v: 'mam', emoji: '✅', label: 'Audio už mám', sub: 'Jen připojit ke stávající sestavě' },
      ],
    },
    {
      id: 'service', q: 'Jakou službu od nás chcete?', hint: 'Poslední otázka – podle ní vybereme tarif.', multi: false,
      options: [
        { v: 'poradit', emoji: '💬', label: 'Jen poradit s výběrem', sub: 'Televizi si koupím a nainstaluji sám' },
        { v: 'instalovat', emoji: '🚚', label: 'Vybrat, dovézt a nainstalovat', sub: 'Doprava po Praze + instalace na místě' },
        { v: 'naklic', emoji: '🌟', label: 'Komplet na klíč', sub: 'Instalace, aplikace, nastavení obrazu i zvuku' },
      ],
    },
  ];

  const answers = {};
  let step = 0;

  /* Aktuálně relevantní otázky (respektuje podmínky `when`) */
  function activeQuestions() {
    return QUESTIONS.filter((Q) => !Q.when || Q.when(answers));
  }

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
    const list = activeQuestions();
    if (step > list.length - 1) step = list.length - 1;
    const total = list.length;
    const Q = list[step];

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
      if (step < activeQuestions().length - 1) {
        step++;
        render();
      } else {
        render();
        setTimeout(showResult, 220);
      }
    }
  }

  function updateNext() {
    const Q = activeQuestions()[step];
    const sel = answers[Q.id];
    const has = Q.multi ? Array.isArray(sel) && sel.length > 0 : !!sel;
    nextBtn.disabled = !has;
  }

  nextBtn.addEventListener('click', () => {
    const list = activeQuestions();
    const Q = list[step];
    const sel = answers[Q.id];
    const has = Q.multi ? Array.isArray(sel) && sel.length > 0 : !!sel;
    if (!has) return;
    if (step < list.length - 1) { step++; render(); }
    else showResult();
  });

  backBtn.addEventListener('click', () => {
    if (step > 0) { step--; render(); }
  });

  /* ═══════════════════════════════════════════════
     VYHODNOCENÍ
  ═══════════════════════════════════════════════ */
  function evaluate() {
    const a = answers;
    const use = Array.isArray(a.use) ? a.use : [];
    const notes = [];

    /* ── 1. Úhlopříčka ── */
    const sizeMap = {
      d1: { min: 40, max: 50 },
      d2: { min: 55, max: 65 },
      d3: { min: 65, max: 75 },
      d4: { min: 75, max: 85 },
    };
    let sz = Object.assign({}, sizeMap[a.distance] || sizeMap.d2);

    // Omezení podle typu místnosti
    if (a.room === 'kuchyne' && sz.max > 43) {
      sz = { min: 32, max: 43 };
      notes.push('Do kuchyně doporučujeme menší úhlopříčku – velká TV zde bývá spíš na překážku.');
    } else if (a.room === 'loznice' && sz.max > 55) {
      sz = { min: 43, max: 55 };
      notes.push('Do ložnice se obvykle sedí blíž, proto doporučujeme menší úhlopříčku než do obýváku.');
    }

    // Omezení podle rozpočtu, aby bylo doporučení reálně koupitelné
    if (a.budget === 'b1' && sz.max > 55) {
      sz = { min: 43, max: 55 };
      notes.push('V rozpočtu do 10 000 Kč je 55" realistický strop – větší televize by šla na úkor kvality obrazu.');
    } else if (a.budget === 'b2' && sz.max > 65) {
      sz = { min: 55, max: 65 };
      notes.push('V rozpočtu do 20 000 Kč doporučujeme raději kvalitnější 65" než největší možnou úhlopříčku.');
    }

    const size = { range: `${sz.min} – ${sz.max}"`, min: sz.min, max: sz.max };

    /* ── 2. Technologie panelu ── */
    let tech, techWhy;
    if (a.budget === 'b1' || a.quality === 'cena') {
      tech = 'Kvalitní LED / základní QLED';
      techWhy = 'Spolehlivý 4K obraz za rozumnou cenu bez zbytečných kompromisů.';
    } else if (a.light === 'svetlo') {
      tech = a.budget === 'b4' ? 'Mini LED (QLED)' : 'QLED, ideálně Mini LED';
      techWhy = 'Vysoký jas, který si poradí se světlou místností a odlesky.';
    } else if (a.quality === 'spicka' && (a.light === 'tma' || use.includes('filmy'))) {
      tech = 'OLED';
      techWhy = 'Dokonalá černá a kontrast pro filmový zážitek v zatemnění.';
    } else if (a.quality === 'spicka') {
      tech = 'OLED nebo Mini LED';
      techWhy = 'Nejvyšší třída obrazu – přesná volba záleží na světle v místnosti.';
    } else {
      tech = 'QLED / Mini LED';
      techWhy = 'Skvělý poměr jasu, barev a ceny pro každodenní sledování.';
    }

    // Doplňkové poznámky podle způsobu sledování
    const techExtra = [];
    if (a.gaming === 'ano') techExtra.push('Pro konzole vyberte model se 120 Hz panelem a HDMI 2.1.');
    else if (a.gaming === 'obcas') techExtra.push('Pro občasné hraní postačí herní režim (ALLM) a nízký input lag.');
    if (use.includes('sport')) techExtra.push('U sportu hlídáme plynulost pohybu – doporučíme 100/120 Hz panel.');
    if (a.room === 'kancelar' || use.includes('prace')) techExtra.push('Pro prezentace zvolíme model s matnějším panelem a snadným zrcadlením obrazu.');

    /* ── 3. Značky ── */
    let brands;
    if (a.brand && a.brand !== 'bez') {
      brands = `${a.brand} – dobrá volba, konkrétní model vybereme podle parametrů výše.`;
    } else if (tech.indexOf('OLED') !== -1) {
      brands = 'LG, Sony nebo Philips – špička mezi OLED panely.';
    } else if (a.budget === 'b1' || a.quality === 'cena') {
      brands = 'TCL nebo Hisense – nejlepší poměr cena/výkon.';
    } else if (a.budget === 'b4') {
      brands = 'Samsung, Sony nebo LG – vlajkové modely s nejvyšším jasem i zpracováním obrazu.';
    } else {
      brands = 'Samsung, TCL nebo Hisense – skvělý jas a barvy za rozumnou cenu.';
    }

    /* ── 4. Zvuk ── */
    let audio;
    let audioPaid = false;
    if (a.audio === 'soundbar') {
      audio = 'Soundbar s vlastním subwooferem';
      audioPaid = true;
    } else if (a.audio === 'kino') {
      audio = 'Domácí kino / AV receiver';
      audioPaid = true;
    } else if (a.audio === 'mam') {
      audio = 'Připojíme vaši stávající sestavu';
    } else {
      audio = (use.includes('filmy') || a.quality === 'spicka')
        ? 'Reproduktory TV postačí – soundbar by ale zážitek výrazně posunul'
        : 'Reproduktory v televizi postačí';
    }

    /* ── 5. Výběr tarifu ──
       Rozhoduje rozsah služby + způsob umístění + limit úhlopříčky tarifu */
    const onWall = a.mount === 'zed_fix' || a.mount === 'zed_pol';
    const undecidedMount = a.mount === 'nevim';
    const s = size.max;
    let key;

    if (a.service === 'poradit') {
      key = 'support';
    } else if (s > 77) {
      key = 'exclusive-pro';
    } else if (a.service === 'naklic') {
      key = 'exclusive';
    } else if (!onWall && !undecidedMount && s <= 55) {
      key = 'basic';
    } else if (s <= 65) {
      key = 'standard';
    } else {
      key = 'exclusive';
    }

    const pkg = TARIFFS[key];

    /* Vysvětlení, PROČ právě tento tarif */
    const reasons = [];
    if (key === 'support') {
      reasons.push('Chcete jen poradit s výběrem – televizi si pořídíte i nainstalujete sami.');
    } else if (key === 'basic') {
      reasons.push('Televize na stolek do 55" spadá přesně do rozsahu tarifu Basic.');
    } else if (key === 'standard') {
      reasons.push(onWall || undecidedMount
        ? 'Instalace na zeď včetně připevnění držáku a uložení kabeláže je součástí tarifu Standard.'
        : 'Doporučená úhlopříčka přesahuje 55", což je limit tarifu Basic – proto Standard.');
    } else if (key === 'exclusive') {
      reasons.push(a.service === 'naklic'
        ? 'Chcete komplet na klíč – nastavení aplikací, obrazu i zvuku a neomezenou podporu.'
        : `Doporučená úhlopříčka až ${size.max}" přesahuje limit 65" tarifu Standard.`);
    } else if (key === 'exclusive-pro') {
      reasons.push(`Televize nad 77" (doporučujeme až ${size.max}") zvládne pouze tarif Exclusive PRO.`);
    }
    if (a.service === 'naklic' && (key === 'exclusive' || key === 'exclusive-pro')) {
      reasons.push('Součástí je i osobní projití nastavení a ovládání televize.');
    }
    if (key !== 'support' && a.gaming === 'ano') {
      reasons.push('V rámci instalace nastavíme i herní režim a správný HDMI vstup pro konzoli.');
    }

    /* Upozornění k tarifu */
    let pkgNote = '';
    if (undecidedMount && key !== 'support') {
      pkgNote = 'Umístění (zeď / stolek) doladíme zdarma při zaměření. Počítáme s instalací na zeď – při postavení na stolek se cena může snížit.';
    } else if (key === 'standard' && !onWall) {
      pkgNote = 'Tarif Basic je limitovaný 55". U větší televize je i při postavení na stolek potřeba tarif Standard.';
    } else if (key === 'exclusive-pro' && a.service === 'instalovat') {
      pkgNote = 'Televize nad 77" pokrývá pouze Exclusive PRO – v ceně tak máte kompletní řešení od výběru po finální nastavení.';
    }

    /* ── 6. Volitelné příplatky ── */
    const extras = [];
    if (onWall || undecidedMount) {
      extras.push({
        emoji: '🧱',
        title: a.mount === 'zed_pol' ? 'Polohovatelný nástěnný držák' : 'Nástěnný držák',
        desc: 'Vybereme a dodáme držák podle hmotnosti televize a typu zdi. Samotná montáž už je v tarifu.',
      });
    }
    if (audioPaid) {
      extras.push({
        emoji: '🔊',
        title: a.audio === 'kino' ? 'Domácí kino / AV receiver' : 'Soundbar',
        desc: 'Návrh řešení máte zdarma v rámci poradenství, dodávka a instalace audia se účtuje zvlášť.',
      });
    }
    if (a.quality === 'spicka' || tech.indexOf('OLED') !== -1 || a.budget === 'b4') {
      extras.push({
        emoji: '🎯',
        title: 'Profesionální kalibrace obrazu',
        desc: 'Přesné seřízení speciální kamerou ve spolupráci s p. Šimkem – u televize této třídy dává největší smysl.',
      });
    }
    extras.push({
      emoji: '🚗',
      title: 'Realizace mimo Prahu',
      desc: 'Do 30 km od Prahy vyjíždíme běžně, vzdálenější lokality naceníme individuálně.',
    });

    return { size, tech, techWhy, techExtra, brands, audio, pkg, reasons, pkgNote, extras, notes };
  }

  /* ═══ Předvyplnění poptávkového formuláře ═══
     Vybere odpovídající tarif a doplní shrnutí do poznámky. */
  function prefillForm(r) {
    const form = document.getElementById('contactForm');
    if (!form) return;

    // Tarif – najdi přepínač, jehož hodnota začíná názvem tarifu (delší název má přednost)
    const radios = Array.from(form.querySelectorAll('input[name="tarif"]'));
    const match = radios
      .filter((el) => el.value.indexOf(r.pkg.name) === 0)
      .sort((a, b) => b.value.length - a.value.length)[0];
    if (match && !match.checked) {
      match.checked = true;
      match.dispatchEvent(new Event('change', { bubbles: true }));
      const group = document.getElementById('tarifChoice');
      if (group) group.classList.remove('has-error');
    }

    // Poznámka – shrnutí z průvodce (uživatelský text nepřepisujeme)
    const note = document.getElementById('poznamka');
    if (!note) return;
    const summary = [
      'Doporučení z chytrého průvodce:',
      `• Úhlopříčka: ${r.size.range}`,
      `• Technologie: ${r.tech}`,
      `• Značky: ${r.brands}`,
      `• Zvuk: ${r.audio}`,
      `• Doporučený tarif: ${r.pkg.name} (${r.pkg.price})`,
    ].join('\n');

    const existing = note.value.trim();
    if (existing.indexOf('Doporučení z chytrého průvodce:') !== -1) {
      note.value = summary;
    } else {
      note.value = existing ? `${existing}\n\n${summary}` : summary;
    }
    note.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* ═══ Přesun na kartu tarifu v ceníku + zvýraznění ═══ */
  function goToTariff(anchor) {
    const card = document.getElementById(anchor);
    const section = document.getElementById('tarify');
    if (!card) {
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const track = card.closest('.pricing-track');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(() => {
      if (track) {
        const padLeft = parseFloat(getComputedStyle(track).paddingLeft) || 0;
        const maxScroll = track.scrollWidth - track.clientWidth;
        const pos = Math.min(Math.max(card.offsetLeft - padLeft, 0), maxScroll);
        track.scrollTo({ left: pos, behavior: 'smooth' });
      }
      card.classList.add('spotlight');
      setTimeout(() => card.classList.remove('spotlight'), 2600);
    }, 620);
  }

  /* ═══ Výsledková obrazovka ═══ */
  function showResult() {
    const r = evaluate();
    progressFill.style.width = '100%';
    stepCount.textContent = 'Hotovo · vaše doporučení';
    backBtn.hidden = false;
    nextBtn.style.display = 'none';

    const techSmall = [r.techWhy].concat(r.techExtra).join(' ');
    const sizeSmall = r.notes.length
      ? r.notes.join(' ')
      : 'Optimální velikost pro vaši vzdálenost sezení.';

    body.innerHTML = `
      <div class="pg-result-head">
        <span class="pg-result-badge">Na míru vám</span>
        <div class="pg-result-title">Naše doporučení</div>
      </div>

      <div class="pg-result-sub">Jakou televizi hledat</div>
      <div class="pg-result-grid">
        <div class="pg-spec">
          <span class="pg-spec-emoji">📐</span>
          <div>
            <div class="pg-spec-label">Úhlopříčka</div>
            <div class="pg-spec-value">${r.size.range}<small>${sizeSmall}</small></div>
          </div>
        </div>
        <div class="pg-spec">
          <span class="pg-spec-emoji">🖥️</span>
          <div>
            <div class="pg-spec-label">Technologie panelu</div>
            <div class="pg-spec-value">${r.tech}<small>${techSmall}</small></div>
          </div>
        </div>
        <div class="pg-spec">
          <span class="pg-spec-emoji">🏷️</span>
          <div>
            <div class="pg-spec-label">Doporučené značky</div>
            <div class="pg-spec-value">${r.brands}</div>
          </div>
        </div>
        <div class="pg-spec">
          <span class="pg-spec-emoji">🔊</span>
          <div>
            <div class="pg-spec-label">Zvuk</div>
            <div class="pg-spec-value">${r.audio}</div>
          </div>
        </div>
      </div>

      <div class="pg-result-sub">Jakou službu si vybrat</div>
      <div class="pg-reco">
        <div class="pg-reco-top">
          <div>
            <div class="pg-reco-label">${r.pkg.label} · doporučeno pro vás</div>
            <div class="pg-reco-name">${r.pkg.name}</div>
          </div>
          <div class="pg-reco-pricebox">
            <div class="pg-reco-price">${r.pkg.price}</div>
            <div class="pg-reco-pricenote">${r.pkg.priceNote}</div>
          </div>
        </div>
        <div class="pg-reco-desc">${r.pkg.desc}</div>
        ${r.reasons.length ? `
        <div class="pg-reco-why">
          <div class="pg-reco-why-label">Proč právě tento tarif</div>
          <ul>${r.reasons.map((x) => `<li>${x}</li>`).join('')}</ul>
        </div>` : ''}
        <div class="pg-reco-incl-label">Co je v ceně</div>
        <ul class="pg-reco-incl">${r.pkg.includes.map((f) => `<li>${f}</li>`).join('')}</ul>
        ${r.pkgNote ? `<div class="pg-reco-note">${r.pkgNote}</div>` : ''}
      </div>

      <div class="pg-extras">
        <div class="pg-extras-label">Volitelně za příplatek</div>
        <div class="pg-extras-sub">Není součástí tarifu – naceníme až po vašem odsouhlasení.</div>
        ${r.extras.map((e) => `
          <div class="pg-extra">
            <span class="pg-extra-emoji">${e.emoji}</span>
            <div>
              <div class="pg-extra-title">${e.title}</div>
              <div class="pg-extra-desc">${e.desc}</div>
            </div>
          </div>`).join('')}
      </div>

      <div class="pg-result-actions">
        <a href="#kontakt" class="btn-primary" data-guide-go>Poptat ${r.pkg.name} nezávazně →</a>
        <a href="#tarify" class="btn-secondary" data-guide-tarif="${r.pkg.anchor}">Zobrazit tarif v ceníku</a>
      </div>
      <button type="button" class="pg-restart">↺ Spustit průvodce znovu</button>
    `;
    body.scrollTop = 0;

    body.querySelectorAll('[data-guide-go]').forEach((el) => {
      el.addEventListener('click', () => {
        nextBtn.style.display = '';
        close();
        prefillForm(r);
      });
    });
    const tarifBtn = body.querySelector('[data-guide-tarif]');
    if (tarifBtn) tarifBtn.addEventListener('click', (e) => {
      e.preventDefault();
      nextBtn.style.display = '';
      close();
      goToTariff(tarifBtn.dataset.guideTarif);
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
