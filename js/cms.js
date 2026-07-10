/* ═══════════════════════════════════════════════════════
   CMS.JS — Sdílená knihovna blogu (Supabase + rendering)
   CHCI TELEVIZI — Premium TV Installation, Prague

   Vyžaduje CDN skript @supabase/supabase-js@2 (window.supabase).
═══════════════════════════════════════════════════════ */

'use strict';

const CMS_CONFIG = {
  url: 'https://gabseroxpqfsktmfxldy.supabase.co',
  key: 'sb_publishable_VFIDwclAdLiVpPoehlAO0g_T6jjz69h',
};

const cmsClient = window.supabase.createClient(CMS_CONFIG.url, CMS_CONFIG.key);

/* ── HELPERY ── */

function cmsEscapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cmsFormatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

function cmsReadingTime(text) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function cmsSafeUrl(url, allowRelative = true) {
  const u = String(url || '').trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (/^mailto:/i.test(u)) return u;
  if (allowRelative && (u.startsWith('/') || u.startsWith('#'))) return u;
  return '';
}

/* ── MARKDOWN RENDERER (bezpečná podmnožina) ──
   Vstup je nejdřív HTML-escapován, teprve potom se aplikuje
   markdown — obsah z DB tedy nemůže vložit vlastní HTML/skripty. */

function cmsInlineMd(escaped) {
  let s = escaped;
  // obrázky ![alt](url)
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) => {
    const safe = cmsSafeUrl(url);
    return safe ? `<img src="${safe}" alt="${alt}" loading="lazy">` : '';
  });
  // odkazy [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
    const safe = cmsSafeUrl(url);
    const ext = /^https?:\/\//i.test(safe) ? ' target="_blank" rel="noopener"' : '';
    return safe ? `<a href="${safe}"${ext}>${text}</a>` : text;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

function cmsRenderMarkdown(md) {
  const lines = cmsEscapeHtml(md).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = null; // { tag: 'ul'|'ol', items: [] }
  let quote = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${cmsInlineMd(para.join(' '))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      out.push(`<${list.tag}>` + list.items.map((i) => `<li>${cmsInlineMd(i)}</li>`).join('') + `</${list.tag}>`);
      list = null;
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      out.push(`<blockquote><p>${cmsInlineMd(quote.join(' '))}</p></blockquote>`);
      quote = [];
    }
  };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) { flushAll(); continue; }

    let m;
    if ((m = trimmed.match(/^(#{2,4})\s+(.*)$/))) {
      flushAll();
      const level = Math.min(m[1].length, 4);
      out.push(`<h${level}>${cmsInlineMd(m[2])}</h${level}>`);
    } else if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flushAll();
      out.push('<hr>');
    } else if ((m = trimmed.match(/^&gt;\s?(.*)$/))) {
      flushPara(); flushList();
      quote.push(m[1]);
    } else if ((m = trimmed.match(/^[-*]\s+(.*)$/))) {
      flushPara(); flushQuote();
      if (!list || list.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] }; }
      list.items.push(m[1]);
    } else if ((m = trimmed.match(/^\d+[.)]\s+(.*)$/))) {
      flushPara(); flushQuote();
      if (!list || list.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] }; }
      list.items.push(m[1]);
    } else if (/^!\[[^\]]*\]\([^)]+\)$/.test(trimmed)) {
      flushAll();
      out.push(cmsInlineMd(trimmed));
    } else {
      flushList(); flushQuote();
      para.push(trimmed);
    }
  }
  flushAll();
  return out.join('\n');
}

/* ── DATA ── */

const CMS_LIST_COLUMNS = 'slug,title,excerpt,cover_url,content,published_at';

async function cmsFetchPublished(limit) {
  let q = cmsClient
    .from('blog_posts')
    .select(CMS_LIST_COLUMNS)
    .eq('published', true)
    .order('published_at', { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function cmsFetchBySlug(slug) {
  const { data, error } = await cmsClient
    .from('blog_posts')
    .select(CMS_LIST_COLUMNS)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ── RENDERING KARET ── */

function cmsCoverHtml(post) {
  const safe = cmsSafeUrl(post.cover_url, false);
  if (safe) {
    return `<div class="blog-card-cover"><img src="${cmsEscapeHtml(safe)}" alt="${cmsEscapeHtml(post.title)}" loading="lazy"></div>`;
  }
  return '<div class="blog-card-cover blog-card-cover--placeholder"></div>';
}

function cmsCardHtml(post, featured = false) {
  const url = `clanek.html?slug=${encodeURIComponent(post.slug)}`;
  const minutes = cmsReadingTime(post.content);
  return `
    <a class="${featured ? 'blog-featured' : 'blog-card'} reveal" href="${url}">
      ${cmsCoverHtml(post)}
      <div class="blog-card-body">
        <div class="blog-card-meta">
          <span class="blog-date">${cmsFormatDate(post.published_at)}</span>
          <span class="blog-dot"></span>
          <span class="blog-date">${minutes} min čtení</span>
        </div>
        <h3 class="blog-card-title">${cmsEscapeHtml(post.title)}</h3>
        <p class="blog-card-excerpt">${cmsEscapeHtml(post.excerpt)}</p>
        <span class="blog-card-link">Číst článek <span aria-hidden="true">→</span></span>
      </div>
    </a>`;
}

function cmsRevealNow(container) {
  container.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
}

/* ── INICIALIZACE PODLE STRÁNKY ── */

document.addEventListener('DOMContentLoaded', () => {

  /* Úvodní strana: 3 nejnovější články */
  const homeGrid = document.getElementById('homeBlogGrid');
  if (homeGrid) {
    cmsFetchPublished(3)
      .then((posts) => {
        if (!posts.length) {
          const section = document.getElementById('blog');
          if (section) section.style.display = 'none';
          return;
        }
        homeGrid.innerHTML = posts.map((p) => cmsCardHtml(p)).join('');
        cmsRevealNow(homeGrid);
      })
      .catch(() => {
        const section = document.getElementById('blog');
        if (section) section.style.display = 'none';
      });
  }

  /* Stránka blogu: featured + grid */
  const listing = document.getElementById('blogListing');
  if (listing) {
    cmsFetchPublished()
      .then((posts) => {
        if (!posts.length) {
          listing.innerHTML = '<div class="blog-state">Zatím tu žádné články nejsou. Brzy se to změní!</div>';
          return;
        }
        const [first, ...rest] = posts;
        let html = cmsCardHtml(first, true);
        if (rest.length) {
          html += `<div class="blog-grid">${rest.map((p) => cmsCardHtml(p)).join('')}</div>`;
        }
        listing.innerHTML = html;
        cmsRevealNow(listing);
      })
      .catch(() => {
        listing.innerHTML = '<div class="blog-state">Články se nepodařilo načíst. Zkuste to prosím za chvíli.</div>';
      });
  }

  /* Detail článku */
  const articleRoot = document.getElementById('articleRoot');
  if (articleRoot) {
    const slug = new URLSearchParams(window.location.search).get('slug')
      || decodeURIComponent(window.location.pathname.replace(/^\/blog\//, '').replace(/\/$/, ''));

    const titleEl = document.getElementById('articleTitle');
    const metaEl = document.getElementById('articleMeta');
    const bodyEl = document.getElementById('articleContent');
    const coverEl = document.getElementById('articleCover');

    const showError = (msg) => {
      if (titleEl) titleEl.textContent = 'Článek nenalezen';
      if (bodyEl) bodyEl.innerHTML = `<div class="blog-state">${cmsEscapeHtml(msg)} <br><br><a class="btn-primary" href="blog.html">← Zpět na blog</a></div>`;
    };

    if (!slug) {
      showError('Adresa článku není úplná.');
    } else {
      cmsFetchBySlug(slug)
        .then((post) => {
          if (!post) {
            showError('Tento článek neexistuje, nebo ještě nebyl publikován.');
            return;
          }
          document.title = `${post.title} – CHCI TELEVIZI Blog`;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) metaDesc.setAttribute('content', post.excerpt || post.title);

          if (titleEl) titleEl.textContent = post.title;
          if (metaEl) {
            metaEl.innerHTML = `
              <span>${cmsFormatDate(post.published_at)}</span>
              <span class="blog-dot"></span>
              <span>${cmsReadingTime(post.content)} min čtení</span>`;
          }
          const safeCover = cmsSafeUrl(post.cover_url, false);
          if (coverEl && safeCover) {
            coverEl.innerHTML = `<img src="${cmsEscapeHtml(safeCover)}" alt="${cmsEscapeHtml(post.title)}">`;
            coverEl.style.display = '';
          }
          if (bodyEl) bodyEl.innerHTML = cmsRenderMarkdown(post.content);

          /* Další články */
          const moreGrid = document.getElementById('moreArticles');
          if (moreGrid) {
            cmsFetchPublished(4).then((posts) => {
              const others = posts.filter((p) => p.slug !== post.slug).slice(0, 3);
              if (!others.length) {
                const section = document.getElementById('dalsi-clanky');
                if (section) section.style.display = 'none';
                return;
              }
              moreGrid.innerHTML = others.map((p) => cmsCardHtml(p)).join('');
              cmsRevealNow(moreGrid);
            }).catch(() => {});
          }
        })
        .catch(() => showError('Článek se nepodařilo načíst. Zkuste to prosím za chvíli.'));
    }
  }

});
