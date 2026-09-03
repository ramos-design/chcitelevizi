/* ═══════════════════════════════════════════════════════
   MAIN.JS — Nav, Mobile Menu, Lightbox, Form
   CHCI TELEVIZI — Premium TV Installation, Prague
═══════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── NAV SCROLL SHADOW ── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── MOBILE MENU ── */
  const hamburger  = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    const toggleMenu = () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    const closeMenu = () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    hamburger.addEventListener('click', toggleMenu);

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ── SMOOTH SCROLL FOR ANCHOR LINKS ── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();

      const navH = navbar ? navbar.offsetHeight : 72;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── LIGHTBOX ── */
  (() => {
    const heroVisual = document.querySelector('#hero .hero-visual');
    if (!heroVisual) return;

    heroVisual.innerHTML = `
      <figure class="hero-photo-frame">
        <img
          src="https://images.pexels.com/photos/34153693/pexels-photo-34153693.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop"
          alt="Moderní domácí kino s velkým TV a reproduktory v obývacím pokoji"
          class="hero-photo"
          width="1200"
          height="900"
          fetchpriority="high"
          loading="eager"
          decoding="async"
        />
      </figure>
    `;
  })();

  (() => {
    const hero = document.getElementById('hero');
    const heroBg = hero ? hero.querySelector('.hero-bg') : null;
    const heroContent = hero ? hero.querySelector('.hero-content') : null;
    const heroVisual = hero ? hero.querySelector('.hero-visual') : null;

    if (!hero || !heroContent || !heroVisual) return;
    if (hero.querySelector('.hero-top') || hero.querySelector('.hero-split')) return;

    const badge = heroContent.querySelector('.hero-badge');
    const title = heroContent.querySelector('h1');
    const proof = heroContent.querySelector('.hero-proof');
    const sub = heroContent.querySelector('.hero-sub');
    const chips = heroContent.querySelector('.hero-chips');
    const actions = heroContent.querySelector('.hero-actions');

    const heroTop = document.createElement('div');
    heroTop.className = 'hero-top';

    const heroSplit = document.createElement('div');
    heroSplit.className = 'hero-split';

    const heroInfo = document.createElement('div');
    heroInfo.className = 'hero-info';

    if (badge) heroTop.appendChild(badge);
    if (title) heroTop.appendChild(title);
    if (chips) heroTop.appendChild(chips);

    if (proof) heroInfo.appendChild(proof);
    if (sub) heroInfo.appendChild(sub);
    if (actions) heroInfo.appendChild(actions);

    // Chips now positioned after heading in HTML, no need to move them to orbit

    // Chips functionality disabled - chips now positioned after heading

    heroSplit.appendChild(heroInfo);
    heroSplit.appendChild(heroVisual);

    heroContent.remove();

    if (heroBg) {
      heroBg.insertAdjacentElement('afterend', heroTop);
      heroTop.insertAdjacentElement('afterend', heroSplit);
    } else {
      hero.prepend(heroTop);
      heroTop.insertAdjacentElement('afterend', heroSplit);
    }
  })();

  const lightbox      = document.getElementById('lightbox');
  const lightboxInner = document.getElementById('lightboxInner');
  const lightboxClose = document.getElementById('lightboxClose');

  const galleryItems = document.querySelectorAll('.gallery-item');

  const openLightbox = (index) => {
    const item = galleryItems[index];
    if (!item || !lightbox || !lightboxInner) return;

    const media = item.querySelector('img, svg');
    if (!media) return;

    lightboxInner.innerHTML = '';

    if (media.tagName.toLowerCase() === 'img') {
      const full = document.createElement('img');
      full.src = media.currentSrc || media.src;
      full.alt = media.alt || '';

      // Náhled se roztahuje podle šířky (na šířku) nebo výšky (na výšku),
      // aby se v obou případech vešel a nezdeformoval se
      const w = media.naturalWidth  || parseInt(media.getAttribute('width'), 10)  || 0;
      const h = media.naturalHeight || parseInt(media.getAttribute('height'), 10) || 0;
      if (h > w) full.classList.add('is-portrait');

      lightboxInner.appendChild(full);

      const caption = item.querySelector('.gallery-caption');
      if (caption) {
        const cap = document.createElement('div');
        cap.className = 'lightbox-caption';
        cap.textContent = caption.textContent;
        lightboxInner.appendChild(cap);
      }
    } else {
      lightboxInner.innerHTML = media.outerHTML;
    }

    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Focus close button for accessibility
    lightboxClose && lightboxClose.focus();
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lightboxInner && (lightboxInner.innerHTML = '');
  };

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index || 0, 10);
      openLightbox(index);
    });
    // Keyboard support
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const index = parseInt(item.dataset.index || 0, 10);
        openLightbox(index);
      }
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });

  /* ── CONTACT FORM ── */
  const form = document.getElementById('contactForm');
  if (form) {
    const tarifChoice = document.getElementById('tarifChoice');
    const gdprWrap = document.getElementById('gdprWrap');
    const gdpr = document.getElementById('gdpr');

    const markError = (field) => { field.style.borderColor = 'var(--red)'; };

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let valid = true;
      let firstInvalid = null;

      form.querySelectorAll('.form-control[required]').forEach((field) => {
        field.style.borderColor = '';
        const empty = !field.value.trim();
        const badEmail = field.type === 'email' && field.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
        if (empty || badEmail) {
          markError(field);
          valid = false;
          if (!firstInvalid) firstInvalid = field;
        }
      });

      // Tarif – musí být vybraná jedna z dlaždic
      if (tarifChoice) {
        const chosen = form.querySelector('input[name="tarif"]:checked');
        tarifChoice.classList.toggle('has-error', !chosen);
        if (!chosen) {
          valid = false;
          if (!firstInvalid) firstInvalid = tarifChoice;
        }
      }

      // Souhlas se zpracováním údajů
      if (gdpr) {
        gdprWrap.classList.toggle('has-error', !gdpr.checked);
        if (!gdpr.checked) {
          valid = false;
          if (!firstInvalid) firstInvalid = gdprWrap;
        }
      }

      if (!valid) {
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof firstInvalid.focus === 'function') firstInvalid.focus({ preventScroll: true });
        }
        return;
      }

      // Simulace odeslání
      const submitBtn = form.querySelector('.form-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Odesílám...';
      }

      setTimeout(() => {
        form.reset();
        if (tarifChoice) tarifChoice.classList.remove('has-error');
        if (gdprWrap) gdprWrap.classList.remove('has-error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '✓ Odesláno! Ozveme se do 2 hodin.';
          submitBtn.style.background = 'var(--green)';
        }
        setTimeout(() => {
          if (submitBtn) {
            submitBtn.textContent = 'Odeslat poptávku →';
            submitBtn.style.background = '';
          }
        }, 4000);
      }, 1200);
    });

    // Chybové zvýraznění zmizí, jakmile uživatel začne opravovat
    form.querySelectorAll('.form-control').forEach((field) => {
      field.addEventListener('input', () => { field.style.borderColor = ''; });
      field.addEventListener('change', () => { field.style.borderColor = ''; });
    });
    if (tarifChoice) {
      tarifChoice.addEventListener('change', () => tarifChoice.classList.remove('has-error'));
    }
    if (gdpr) {
      gdpr.addEventListener('change', () => gdprWrap.classList.remove('has-error'));
    }

    // Tlačítka v ceníku předvyplní odpovídající tarif
    document.querySelectorAll('.pricing-btn[data-tarif]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const wanted = btn.dataset.tarif;
        const radio = [...form.querySelectorAll('input[name="tarif"]')]
          .find((r) => r.value.split(/\s+[–(]/)[0].trim() === wanted);
        if (radio) {
          radio.checked = true;
          if (tarifChoice) tarifChoice.classList.remove('has-error');
        }
      });
    });
  }

  /* ── HERO INFO BADGE ROTATION ── */
  (() => {
    const badgeConfigs = [
      {
        id: 'tvBadge1',
        dot: 'green',
        items: [
          'Montaz TV na zed',
          'Skryti kabelu v liste',
          'Nastaveni obrazu na miru',
          'Bezpecne uchyceni drzakem',
        ],
      },
      {
        id: 'tvBadge2',
        dot: 'gold',
        items: [
          '4.9 hodnoceni zakazniku',
          '450+ realizovanych montazi',
          'Doporuceni od sousedu',
          'Overeni technici v Praze',
        ],
      },
      {
        id: 'tvBadge3',
        dot: 'orange',
        items: [
          'Aplikace pripravene',
          'Netflix, Max, YouTube',
          'Prihlaseni pod vasim uctem',
          'Rychly test pripojeni',
        ],
      },
      {
        id: 'tvBadge4',
        dot: 'blue',
        items: [
          'Praha a okoli do 48h',
          'Prijezd v potvrzenem case',
          'Rychly call pred navstevou',
          'Podpora i po instalaci',
        ],
      },
    ];

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    badgeConfigs.forEach((config, index) => {
      const badge = document.getElementById(config.id);
      if (!badge || !config.items.length) return;

      const legacyIcon = badge.querySelector('span[style]');
      if (legacyIcon) legacyIcon.remove();

      let dot = badge.querySelector('.badge-dot');
      let label = badge.querySelector('.badge-label');

      if (!dot) {
        dot = document.createElement('span');
        dot.className = 'badge-dot';
        badge.prepend(dot);
      }

      if (!label) {
        label = document.createElement('span');
        label.className = 'badge-label';
        badge.append(label);
      }

      dot.classList.remove('green', 'blue', 'orange', 'gold');
      dot.classList.add(config.dot);

      let current = 0;
      label.textContent = config.items[current];

      if (prefersReducedMotion || config.items.length < 2) return;

      const swap = () => {
        badge.classList.add('is-changing');
        setTimeout(() => {
          current = (current + 1) % config.items.length;
          label.textContent = config.items[current];
        }, 170);
        setTimeout(() => {
          badge.classList.remove('is-changing');
        }, 360);
      };

      setTimeout(() => {
        setInterval(swap, 2900);
      }, index * 420);
    });
  })();

  /* ── FAQ ACCORDION ── */
  (() => {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach((item) => {
      const btn = item.querySelector('.faq-q');
      const ans = item.querySelector('.faq-a');
      if (!btn || !ans) return;

      btn.addEventListener('click', () => {
        const isOpen = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        ans.style.maxHeight = isOpen ? `${ans.scrollHeight}px` : '';
      });
    });

    // Recompute height of open answers after resize (text reflows)
    window.addEventListener(
      'resize',
      () => {
        document.querySelectorAll('.faq-item.open .faq-a').forEach((ans) => {
          ans.style.maxHeight = `${ans.scrollHeight}px`;
        });
      },
      { passive: true }
    );
  })();

  /* ── ACTIVE NAV LINK HIGHLIGHT ── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');

  const highlightNav = () => {
    const scrollY = window.scrollY + 120;

    sections.forEach((section) => {
      const top    = section.offsetTop;
      const bottom = top + section.offsetHeight;

      if (scrollY >= top && scrollY < bottom) {
        const id = section.getAttribute('id');
        navLinks.forEach((link) => {
          link.style.opacity = link.getAttribute('href') === `#${id}` ? '1' : '';
        });
      }
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();

  /* ── PRICING CAROUSEL ── */
  const pricingCarousel = document.querySelector('.pricing-carousel');
  if (pricingCarousel) {
    const track    = pricingCarousel.querySelector('.pricing-track');
    const cards    = Array.from(track.children);
    const prevBtn  = pricingCarousel.querySelector('.pricing-arrow.prev');
    const nextBtn  = pricingCarousel.querySelector('.pricing-arrow.next');
    const dotsWrap = pricingCarousel.querySelector('.pricing-dots');

    let positions = [];
    let dots = [];

    /* Snap pozice = začátky karet, oříznuté na max. posun (duplicity pryč) */
    const computePositions = () => {
      const padLeft = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      const maxScroll = track.scrollWidth - track.clientWidth;
      positions = [];
      cards.forEach((card) => {
        const pos = Math.min(Math.max(card.offsetLeft - padLeft, 0), maxScroll);
        if (!positions.length || pos - positions[positions.length - 1] > 2) positions.push(pos);
      });
    };

    const nearestIndex = (x) => {
      let idx = 0;
      positions.forEach((p, i) => {
        if (Math.abs(p - x) < Math.abs(positions[idx] - x)) idx = i;
      });
      return idx;
    };

    const updateState = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const x = track.scrollLeft;
      pricingCarousel.classList.toggle('at-start', x < 4);
      pricingCarousel.classList.toggle('at-end', x > maxScroll - 4);
      const active = nearestIndex(x);
      dots.forEach((dot, i) => dot.classList.toggle('active', i === active));
    };

    const buildDots = () => {
      dotsWrap.innerHTML = '';
      dots = positions.map((pos, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'pricing-dot';
        dot.setAttribute('aria-label', `Posunout tarify na pozici ${i + 1}`);
        dot.addEventListener('click', () => track.scrollTo({ left: pos, behavior: 'smooth' }));
        dotsWrap.appendChild(dot);
        return dot;
      });
    };

    const refresh = () => {
      computePositions();
      buildDots();
      updateState();
    };

    prevBtn.addEventListener('click', () => {
      const target = [...positions].reverse().find((p) => p < track.scrollLeft - 4);
      track.scrollTo({ left: target !== undefined ? target : 0, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      const target = positions.find((p) => p > track.scrollLeft + 4);
      if (target !== undefined) track.scrollTo({ left: target, behavior: 'smooth' });
    });

    /* Tažení myší (na dotyku funguje nativní swipe) */
    let dragging = false;
    let dragMoved = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let snapTimer;

    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true;
      dragMoved = false;
      dragStartX = e.clientX;
      dragStartScroll = track.scrollLeft;
      clearTimeout(snapTimer);
      track.classList.add('dragging');
    });
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 6) dragMoved = true;
      track.scrollLeft = dragStartScroll - dx;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      track.scrollTo({ left: positions[nearestIndex(track.scrollLeft)], behavior: 'smooth' });
      snapTimer = setTimeout(() => track.classList.remove('dragging'), 450);
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    /* Po tažení nespouštět klik na tlačítka v kartách */
    track.addEventListener('click', (e) => {
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
        dragMoved = false;
      }
    }, true);
    track.addEventListener('dragstart', (e) => e.preventDefault());

    track.addEventListener('scroll', () => requestAnimationFrame(updateState), { passive: true });

    let pricingResizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(pricingResizeTimer);
      pricingResizeTimer = setTimeout(refresh, 150);
    });

    refresh();
    window.addEventListener('load', refresh);
  }

});
