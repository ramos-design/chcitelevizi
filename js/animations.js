/* ═══════════════════════════════════════════════════════
   ANIMATIONS.JS — Scroll Reveal & Counter Animations
   CHCI TELEVIZI — Premium TV Installation, Prague
═══════════════════════════════════════════════════════ */

'use strict';

/* ── SCROLL REVEAL ── */
(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger children slightly
          const el = entry.target;
          const delay = parseFloat(el.dataset.delay || 0);
          setTimeout(() => {
            el.classList.add('visible');
          }, delay * 1000);
          observer.unobserve(el);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
})();

/* ── STAGGER REVEALS IN GRID CONTAINERS ── */
(function staggerGridItems() {
  const grids = ['.steps-grid', '.pricing-grid', '.reviews-grid', '.gallery-grid'];

  grids.forEach((selector) => {
    const grid = document.querySelector(selector);
    if (!grid) return;

    const children = Array.from(grid.children);
    children.forEach((child, i) => {
      child.style.transitionDelay = `${i * 0.07}s`;
    });
  });
})();

/* ── COUNTER ANIMATION ── */
(function initCounters() {
  const counters = document.querySelectorAll('.stat-num[data-count]');
  if (!counters.length) return;

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.querySelector('span') ? el.querySelector('span').outerHTML : '';
    const duration = 1800;
    const start = performance.now();

    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const value = Math.round(eased * target);

      el.innerHTML = value + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => observer.observe(counter));
})();
