(() => {
  'use strict';

  const SUPABASE_URL = "https://qgmpwanxqytoakmnklvy.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qlOg73Ee92_uzX9YsaRPIA_dMQX9gub";
  const BUCKET = "B. Pharm Notes";

  const $ = (id) => document.getElementById(id);
  const loginView = $('loginView');
  const adminView = $('adminView');
  const loginMsg = $('loginMsg');
  const uploadMsg = $('uploadMsg');
  let client = null;

  function msg(el, text, ok = false) {
    if (!el) return;
    el.textContent = text || '';
    el.className = 'message ' + (ok ? 'ok' : 'error');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    }[ch]));
  }

  function showFatal(text) {
    msg(loginMsg, text || 'Admin page could not start.');
    if (loginView) loginView.classList.remove('hidden');
    if (adminView) adminView.classList.add('hidden');
  }

  function init() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      showFatal('Supabase library load nahi hui. Page refresh karke dobara try karein.');
      return;
    }

    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    bindEvents();
    showSession();
  }

  async function isAdmin(userId) {
    const { data, error } = await client
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.error('admin_users check failed:', error);
      return false;
    }
    return !!data;
  }

  async function showSession() {
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      const session = data?.session;

      if (!session) {
        loginView.classList.remove('hidden');
        adminView.classList.add('hidden');
        return;
      }

      const allowed = await isAdmin(session.user.id);
      if (!allowed) {
        await client.auth.signOut();
        loginView.classList.remove('hidden');
        adminView.classList.add('hidden');
        msg(loginMsg, 'This account is not authorized as an admin.');
        return;
      }

      $('userEmail').textContent = session.user.email || '';
      loginView.classList.add('hidden');
      adminView.classList.remove('hidden');
      await loadNotes();
    } catch (err) {
      console.error(err);
      showFatal('Session check failed: ' + (err?.message || 'Unknown error'));
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email = $('email').value.trim();
    const password = $('password').value;
    msg(loginMsg, 'Signing in…', true);

    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        msg(loginMsg, error.message);
        return;
      }
      await showSession();
    } catch (err) {
      console.error(err);
      msg(loginMsg, err?.message || 'Sign-in failed.');
    }
  }

  async function handleLogout() {
    const { error } = await client.auth.signOut();
    if (error) console.error(error);
    await showSession();
  }

  async function handleUpload(e) {
    e.preventDefault();
    const file = $('pdf').files[0];
    if (!file) return msg(uploadMsg, 'Choose a PDF first.');
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return msg(uploadMsg, 'Only PDF files are allowed.');
    }
    if (file.size > 25 * 1024 * 1024) {
      return msg(uploadMsg, 'PDF must be 25 MB or smaller.');
    }

    msg(uploadMsg, 'Uploading…', true);
    const safeName = file.name
      .replace(/\.pdf$/i, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'note';
    const path = `notes/${Date.now()}-${safeName}.pdf`;

    try {
      const { error: uploadError } = await client.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });
      if (uploadError) throw uploadError;

      const { data: publicData } = client.storage.from(BUCKET).getPublicUrl(path);
      const pdfUrl = publicData.publicUrl;

      const { error: dbError } = await client.from('notes').insert({
        title: $('title').value.trim(),
        semester: $('semester').value,
        subject: $('subject').value.trim(),
        description: $('description').value.trim(),
        pdf_url: pdfUrl
      });
      if (dbError) {
        await client.storage.from(BUCKET).remove([path]);
        throw dbError;
      }

      $('uploadForm').reset();
      $('fileName').textContent = 'No file selected';
      msg(uploadMsg, 'Note published successfully.', true);
      await loadNotes();
    } catch (err) {
      console.error(err);
      msg(uploadMsg, err?.message || 'Upload failed.');
    }
  }

  async function loadNotes() {
    const box = $('notesList');
    box.innerHTML = "<p class='muted'>Loading…</p>";

    try {
      const { data, error } = await client
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      if (!data?.length) {
        box.innerHTML = "<p class='muted'>No notes published yet.</p>";
        return;
      }

      box.innerHTML = data.map(note => `
        <article class="note-row">
          <div>
            <span class="badge">${escapeHtml(note.semester)}</span>
            <h3>${escapeHtml(note.title)}</h3>
            <p>${escapeHtml(note.subject)}${note.description ? ' · ' + escapeHtml(note.description) : ''}</p>
          </div>
          <div class="row-actions">
            <a class="btn" href="${escapeHtml(note.pdf_url)}" target="_blank" rel="noopener">View</a>
            <button class="btn danger" data-delete="${escapeHtml(note.id)}" data-url="${escapeHtml(note.pdf_url)}">Delete</button>
          </div>
        </article>
      `).join('');

      box.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', () => deleteNote(btn.dataset.delete, btn.dataset.url));
      });
    } catch (err) {
      console.error(err);
      box.innerHTML = `<p class="message error">${escapeHtml(err?.message || 'Could not load notes.')}</p>`;
    }
  }

  function storagePathFromPublicUrl(url) {
    try {
      const prefix = `/storage/v1/object/public/${encodeURIComponent(BUCKET)}/`;
      if (url.includes(prefix)) return decodeURIComponent(url.split(prefix)[1]);
      const rawPrefix = `/storage/v1/object/public/${BUCKET}/`;
      if (url.includes(rawPrefix)) return decodeURIComponent(url.split(rawPrefix)[1]);
    } catch (err) {
      console.error(err);
    }
    return null;
  }

  async function deleteNote(id, pdfUrl) {
    if (!confirm('Delete this note from the library?')) return;
    try {
      const path = storagePathFromPublicUrl(pdfUrl);
      if (path) {
        const { error: storageError } = await client.storage.from(BUCKET).remove([path]);
        if (storageError) throw storageError;
      }
      const { error } = await client.from('notes').delete().eq('id', id);
      if (error) throw error;
      await loadNotes();
    } catch (err) {
      console.error(err);
      alert(err?.message || 'Delete failed.');
    }
  }

  function bindEvents() {
    $('loginForm').addEventListener('submit', handleLogin);
    $('logoutBtn').addEventListener('click', handleLogout);
    $('uploadForm').addEventListener('submit', handleUpload);
    $('refreshBtn').addEventListener('click', loadNotes);
    $('pdf').addEventListener('change', () => {
      $('fileName').textContent = $('pdf').files[0]?.name || 'No file selected';
    });
  }

  window.addEventListener('error', (event) => {
    console.error(event.error || event.message);
    if (loginView && !loginView.classList.contains('hidden')) {
      msg(loginMsg, 'Admin script error: ' + (event.message || 'Unknown error'));
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
