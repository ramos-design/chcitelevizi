/* ═══════════════════════════════════════════════════════
   ADMIN.JS — Administrace blogu (přihlášení + správa článků)
   CHCI TELEVIZI — Premium TV Installation, Prague

   Vyžaduje js/cms.js (cmsClient, cmsRenderMarkdown, helpery).
═══════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const $ = (id) => document.getElementById(id);

  const views = {
    login: $('viewLogin'),
    list: $('viewList'),
    editor: $('viewEditor'),
  };
  const topbarActions = $('topbarActions');
  const toastEl = $('toast');

  let editingId = null;      // uuid upravovaného článku (null = nový)
  let slugTouched = false;   // uživatel slug ručně upravil

  /* ── POMOCNÉ ── */

  function showView(name) {
    Object.entries(views).forEach(([key, el]) => { el.hidden = key !== name; });
  }

  let toastTimer;
  function toast(msg, isError = false) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('error', isError);
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3500);
  }

  function slugify(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function setError(id, msg) {
    const el = $(id);
    el.textContent = msg || '';
    el.classList.toggle('show', Boolean(msg));
  }

  /* ── AUTENTIZACE ── */

  async function refreshAuth() {
    const { data: { session } } = await cmsClient.auth.getSession();
    if (session) {
      topbarActions.hidden = false;
      $('userEmail').textContent = session.user.email;
      showView('list');
      loadPosts();
    } else {
      topbarActions.hidden = true;
      showView('login');
    }
  }

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    setError('loginError', '');
    const btn = $('loginSubmit');
    btn.disabled = true;
    btn.textContent = 'Přihlašuji…';

    const { error } = await cmsClient.auth.signInWithPassword({
      email: $('loginEmail').value.trim(),
      password: $('loginPassword').value,
    });

    btn.disabled = false;
    btn.textContent = 'Přihlásit se →';

    if (error) {
      setError('loginError', 'Přihlášení se nezdařilo. Zkontrolujte e-mail a heslo.');
      return;
    }
    refreshAuth();
  });

  $('btnLogout').addEventListener('click', async () => {
    await cmsClient.auth.signOut();
    refreshAuth();
  });

  /* ── SEZNAM ČLÁNKŮ ── */

  async function loadPosts() {
    const listEl = $('postList');
    const { data, error } = await cmsClient
      .from('blog_posts')
      .select('id,slug,title,published,published_at,created_at,updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      listEl.innerHTML = '<div class="admin-row"><div class="admin-row-main"><div class="admin-row-title" style="color:#f87171">Články se nepodařilo načíst. Máte oprávnění správce?</div></div></div>';
      return;
    }

    const published = data.filter((p) => p.published).length;
    $('postCount').textContent = `${data.length} článků celkem · ${published} publikováno · ${data.length - published} konceptů`;

    if (!data.length) {
      listEl.innerHTML = '<div class="admin-row"><div class="admin-row-main"><div class="admin-row-title" style="color:rgba(255,255,255,.4)">Zatím žádné články. Vytvořte první tlačítkem „+ Nový článek“.</div></div></div>';
      return;
    }

    listEl.innerHTML = '';
    data.forEach((post) => {
      const row = document.createElement('div');
      row.className = 'admin-row';

      const statusPill = post.published
        ? '<span class="status-pill status-pill--live">Publikováno</span>'
        : '<span class="status-pill status-pill--draft">Koncept</span>';

      const dateInfo = post.published && post.published_at
        ? `publikováno ${cmsFormatDate(post.published_at)}`
        : `upraveno ${cmsFormatDate(post.updated_at || post.created_at)}`;

      row.innerHTML = `
        <div class="admin-row-main">
          <div class="admin-row-title">${cmsEscapeHtml(post.title)}</div>
          <div class="admin-row-meta">${cmsEscapeHtml(dateInfo)} · /${cmsEscapeHtml(post.slug)}</div>
        </div>
        ${statusPill}
        <div class="admin-row-actions"></div>`;

      const actions = row.querySelector('.admin-row-actions');

      if (post.published) {
        const view = document.createElement('a');
        view.className = 'admin-btn admin-btn--ghost admin-btn--sm';
        view.textContent = 'Zobrazit';
        view.target = '_blank';
        view.rel = 'noopener';
        view.href = `clanek.html?slug=${encodeURIComponent(post.slug)}`;
        actions.appendChild(view);
      }

      const edit = document.createElement('button');
      edit.className = 'admin-btn admin-btn--ghost admin-btn--sm';
      edit.textContent = 'Upravit';
      edit.addEventListener('click', () => openEditor(post.id));
      actions.appendChild(edit);

      const del = document.createElement('button');
      del.className = 'admin-btn admin-btn--danger admin-btn--sm';
      del.textContent = 'Smazat';
      del.addEventListener('click', () => deletePost(post));
      actions.appendChild(del);

      listEl.appendChild(row);
    });
  }

  async function deletePost(post) {
    if (!window.confirm(`Opravdu smazat článek „${post.title}“? Tato akce je nevratná.`)) return;
    const { error } = await cmsClient.from('blog_posts').delete().eq('id', post.id);
    if (error) {
      toast('Článek se nepodařilo smazat.', true);
      return;
    }
    toast('Článek smazán.');
    loadPosts();
  }

  /* ── EDITOR ── */

  async function openEditor(id = null) {
    editingId = id;
    slugTouched = Boolean(id);
    setError('editorError', '');
    $('previewWrap').hidden = true;
    $('btnPreview').textContent = 'Náhled';

    if (id) {
      const { data, error } = await cmsClient.from('blog_posts').select('*').eq('id', id).single();
      if (error || !data) {
        toast('Článek se nepodařilo načíst.', true);
        return;
      }
      $('editorTitle').textContent = 'Upravit článek';
      $('f-title').value = data.title;
      $('f-slug').value = data.slug;
      $('f-cover').value = data.cover_url || '';
      $('f-excerpt').value = data.excerpt;
      $('f-content').value = data.content;
      $('f-published').checked = data.published;
    } else {
      $('editorTitle').textContent = 'Nový článek';
      $('editorForm').reset();
    }
    showView('editor');
    window.scrollTo({ top: 0 });
  }

  $('btnNew').addEventListener('click', () => openEditor(null));
  $('btnBack').addEventListener('click', () => { showView('list'); loadPosts(); });

  $('f-title').addEventListener('input', () => {
    if (!slugTouched) $('f-slug').value = slugify($('f-title').value);
  });
  $('f-slug').addEventListener('input', () => { slugTouched = true; });

  $('btnPreview').addEventListener('click', () => {
    const wrap = $('previewWrap');
    wrap.hidden = !wrap.hidden;
    $('btnPreview').textContent = wrap.hidden ? 'Náhled' : 'Skrýt náhled';
    if (!wrap.hidden) {
      $('previewContent').innerHTML = cmsRenderMarkdown($('f-content').value);
    }
  });

  $('editorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    setError('editorError', '');

    const record = {
      title: $('f-title').value.trim(),
      slug: slugify($('f-slug').value) || slugify($('f-title').value),
      cover_url: $('f-cover').value.trim() || null,
      excerpt: $('f-excerpt').value.trim(),
      content: $('f-content').value.trim(),
      published: $('f-published').checked,
    };

    if (!record.title || !record.slug || !record.excerpt || !record.content) {
      setError('editorError', 'Vyplňte prosím titulek, perex i obsah článku.');
      return;
    }

    const btn = $('btnSave');
    btn.disabled = true;
    btn.textContent = 'Ukládám…';

    const query = editingId
      ? cmsClient.from('blog_posts').update(record).eq('id', editingId).select('id').single()
      : cmsClient.from('blog_posts').insert(record).select('id').single();

    const { data, error } = await query;

    btn.disabled = false;
    btn.textContent = 'Uložit článek';

    if (error) {
      if (error.code === '23505') {
        setError('editorError', 'Článek s touto adresou (slug) už existuje. Zvolte prosím jinou.');
      } else if (error.code === '42501') {
        setError('editorError', 'Nemáte oprávnění ukládat články. Přihlaste se účtem správce.');
      } else {
        setError('editorError', 'Uložení se nezdařilo. Zkuste to prosím znovu.');
      }
      return;
    }

    editingId = data.id;
    toast(record.published ? 'Článek uložen a publikován. ✓' : 'Koncept uložen. ✓');
  });

  /* ── START ── */
  refreshAuth();
});
