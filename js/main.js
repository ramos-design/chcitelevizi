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

    const svgEl = item.querySelector('svg');
    if (!svgEl) return;

    lightboxInner.innerHTML = svgEl.outerHTML;
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
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Basic validation
      const required = form.querySelectorAll('[required]');
      let valid = true;

      required.forEach((field) => {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = '#ef4444';
          valid = false;
        }
      });

      if (!valid) return;

      // Simulate submission
      const submitBtn = form.querySelector('.form-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Odesílám...';
      }

      setTimeout(() => {
        form.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '✓ Odesláno! Ozveme se do 2 hodin.';
          submitBtn.style.background = '#22c55e';
        }
        setTimeout(() => {
          if (submitBtn) {
            submitBtn.textContent = 'Odeslat poptávku →';
            submitBtn.style.background = '';
          }
        }, 4000);
      }, 1200);
    });

    // Clear red border on input
    form.querySelectorAll('.form-control').forEach((field) => {
      field.addEventListener('input', () => {
        field.style.borderColor = '';
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

});
