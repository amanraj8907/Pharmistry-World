(() => {
  'use strict';
  const SUPABASE_URL = 'https://qgmpwanxqytoakmnklvy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_qlOg73Ee92_uzX9YsaRPIA_dMQX9gub';
  const BUCKET = 'B. Pharm Notes';
  const $ = id => document.getElementById(id);
  let client = null;

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const setMsg = (el, text, ok=false) => { if (!el) return; el.textContent=text||''; el.className='message '+(ok?'ok':'error'); };

  async function isAdmin(uid) {
    const { data, error } = await client.from('admin_users').select('user_id').eq('user_id', uid).maybeSingle();
    if (error) throw error;
    return !!data;
  }

  async function showSession() {
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      const session = data.session;
      if (!session) { $('loginView').classList.remove('hidden'); $('adminView').classList.add('hidden'); return; }
      if (!(await isAdmin(session.user.id))) {
        await client.auth.signOut();
        $('loginView').classList.remove('hidden'); $('adminView').classList.add('hidden');
        setMsg($('loginMsg'), 'This account is not authorized as an admin.');
        return;
      }
      $('userEmail').textContent = session.user.email || '';
      $('loginView').classList.add('hidden'); $('adminView').classList.remove('hidden');
      await loadNotes();
      await loadIndustry();
    } catch (e) {
      console.error(e); setMsg($('loginMsg'), e.message || 'Session check failed.');
    }
  }

  async function login(e) {
    e.preventDefault();
    setMsg($('loginMsg'), 'Signing in…', true);
    try {
      const { error } = await client.auth.signInWithPassword({email:$('email').value.trim(), password:$('password').value});
      if (error) throw error;
      await showSession();
    } catch (e) { console.error(e); setMsg($('loginMsg'), e.message || 'Sign-in failed.'); }
  }

  async function logout() { await client.auth.signOut(); await showSession(); }

  function safeName(name) { return name.replace(/\.pdf$/i,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)||'file'; }
  function publicPath(url, prefix) {
    try { const marker = `/storage/v1/object/public/${encodeURIComponent(BUCKET)}/`; if(url.includes(marker)) return decodeURIComponent(url.split(marker)[1]); const raw=`/storage/v1/object/public/${BUCKET}/`; if(url.includes(raw)) return decodeURIComponent(url.split(raw)[1]); } catch(e){} return null;
  }

  async function uploadFile(file, folder) {
    const path = `${folder}/${Date.now()}-${safeName(file.name)}.pdf`;
    const { error } = await client.storage.from(BUCKET).upload(path, file, {contentType:'application/pdf', cacheControl:'3600', upsert:false});
    if (error) throw error;
    return {path, url:client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl};
  }

  async function uploadNote(e) {
    e.preventDefault(); const file=$('pdf').files[0];
    if(!file) return setMsg($('uploadMsg'),'Choose a PDF first.');
    if(file.size>25*1024*1024) return setMsg($('uploadMsg'),'PDF must be 25 MB or smaller.');
    setMsg($('uploadMsg'),'Uploading…',true); let path=null;
    try {
      ({path}=await uploadFile(file,'notes'));
      const {error}=await client.from('notes').insert({title:$('title').value.trim(),semester:$('semester').value,subject:$('subject').value.trim(),description:$('description').value.trim(),pdf_url:client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl});
      if(error) throw error;
      $('uploadForm').reset(); $('fileName').textContent='No file selected'; setMsg($('uploadMsg'),'Note published successfully.',true); await loadNotes();
    } catch(e) { if(path) await client.storage.from(BUCKET).remove([path]); console.error(e); setMsg($('uploadMsg'),e.message||'Upload failed.'); }
  }

  async function uploadIndustry(e) {
    e.preventDefault(); const file=$('industryPdf').files[0];
    if(file && file.size>25*1024*1024) return setMsg($('industryMsg'),'PDF must be 25 MB or smaller.');
    setMsg($('industryMsg'),'Publishing…',true); let path=null;
    try {
      let pdfUrl=null; if(file) { const result=await uploadFile(file,'industry'); path=result.path; pdfUrl=result.url; }
      const {error}=await client.from('industry_content').insert({title:$('industryTitle').value.trim(),category:$('industryCategory').value,description:$('industryDescription').value.trim(),pdf_url:pdfUrl});
      if(error) throw error;
      $('industryForm').reset(); $('industryFileName').textContent='No PDF selected'; setMsg($('industryMsg'),'Industry resource published successfully.',true); await loadIndustry();
    } catch(e) { if(path) await client.storage.from(BUCKET).remove([path]); console.error(e); setMsg($('industryMsg'),e.message||'Publish failed.'); }
  }

  async function loadNotes() {
    const box=$('notesList'); if(!box)return; box.innerHTML='<p class="muted">Loading…</p>';
    const {data,error}=await client.from('notes').select('*').order('created_at',{ascending:false});
    if(error){box.innerHTML=`<p class="message error">${esc(error.message)}</p>`;return;}
    if(!data?.length){box.innerHTML='<p class="muted">No notes published yet.</p>';return;}
    box.innerHTML=data.map(n=>`<article class="note-row"><div><span class="badge">${esc(n.semester)}</span><h3>${esc(n.title)}</h3><p>${esc(n.subject)}${n.description?' · '+esc(n.description):''}</p></div><div class="row-actions"><a class="btn" href="${esc(n.pdf_url)}" target="_blank" rel="noopener">View</a><button class="btn danger" data-note-delete="${esc(n.id)}" data-url="${esc(n.pdf_url)}">Delete</button></div></article>`).join('');
    box.querySelectorAll('[data-note-delete]').forEach(b=>b.onclick=()=>deleteNote(b.dataset.noteDelete,b.dataset.url));
  }

  async function loadIndustry() {
    const box=$('industryList'); if(!box)return; box.innerHTML='<p class="muted">Loading…</p>';
    const {data,error}=await client.from('industry_content').select('*').order('created_at',{ascending:false});
    if(error){box.innerHTML=`<p class="message error">${esc(error.message)}</p>`;return;}
    if(!data?.length){box.innerHTML='<p class="muted">No industry resources published yet.</p>';return;}
    box.innerHTML=data.map(n=>`<article class="note-row"><div><span class="badge">${esc(n.category)}</span><h3>${esc(n.title)}</h3><p>${esc(n.description||'')}</p></div><div class="row-actions">${n.pdf_url?`<a class="btn" href="${esc(n.pdf_url)}" target="_blank" rel="noopener">View PDF</a>`:''}<button class="btn danger" data-ind-delete="${esc(n.id)}" data-url="${esc(n.pdf_url||'')}">Delete</button></div></article>`).join('');
    box.querySelectorAll('[data-ind-delete]').forEach(b=>b.onclick=()=>deleteIndustry(b.dataset.indDelete,b.dataset.url));
  }

  async function deleteNote(id,url){ if(!confirm('Delete this note?'))return; try{const p=publicPath(url);if(p)await client.storage.from(BUCKET).remove([p]);const {error}=await client.from('notes').delete().eq('id',id);if(error)throw error;await loadNotes();}catch(e){alert(e.message||'Delete failed.');} }
  async function deleteIndustry(id,url){ if(!confirm('Delete this industry resource?'))return; try{const p=publicPath(url);if(p)await client.storage.from(BUCKET).remove([p]);const {error}=await client.from('industry_content').delete().eq('id',id);if(error)throw error;await loadIndustry();}catch(e){alert(e.message||'Delete failed.');} }

  function bind(){
    $('loginForm').onsubmit=login; $('logoutBtn').onclick=logout; $('uploadForm').onsubmit=uploadNote; $('industryForm').onsubmit=uploadIndustry;
    $('refreshBtn').onclick=loadNotes; $('industryRefreshBtn').onclick=loadIndustry;
    $('pdf').onchange=()=>{$('fileName').textContent=$('pdf').files[0]?.name||'No file selected';};
    $('industryPdf').onchange=()=>{$('industryFileName').textContent=$('industryPdf').files[0]?.name||'No PDF selected';};
    $('notesTab').onclick=()=>{ $('notesTab').classList.add('active');$('industryTab').classList.remove('active');$('notesPanel').classList.remove('hidden');$('industryPanel').classList.add('hidden');};
    $('industryTab').onclick=()=>{ $('industryTab').classList.add('active');$('notesTab').classList.remove('active');$('industryPanel').classList.remove('hidden');$('notesPanel').classList.add('hidden');};
  }

  function init(){
    if(!window.supabase?.createClient){setMsg($('loginMsg'),'Supabase library load nahi hui. Refresh karke dobara try karein.');return;}
    client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY); bind(); showSession();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
