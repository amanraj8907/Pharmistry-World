(() => {
  const URL='https://qgmpwanxqytoakmnklvy.supabase.co';
  const KEY='sb_publishable_qlOg73Ee92_uzX9YsaRPIA_dMQX9gub';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const safeUrl=v=>{try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:'#';}catch{return '#';}};
  let rows=[];
  async function load(){
    const box=$('industryResources'); if(!box||!window.supabase?.createClient)return;
    const client=window.supabase.createClient(URL,KEY);
    const {data,error}=await client.from('industry_content').select('*').order('created_at',{ascending:false});
    if(error){console.error(error);box.innerHTML='<div class="empty-industry">Industry resources are temporarily unavailable.</div>';return;}
    rows=data||[]; render();
  }
  function render(){
    const q=($('industrySearch')?.value||'').toLowerCase().trim(); const cat=$('industryFilter')?.value||'';
    const filtered=rows.filter(r=>{const text=`${r.title||''} ${r.category||''} ${r.description||''}`.toLowerCase();return (!q||text.includes(q))&&(!cat||r.category===cat);});
    const box=$('industryResources');
    box.innerHTML=filtered.length?filtered.map(r=>`<article class="industry-resource"><span class="tag">${esc(r.category)}</span><h3>${esc(r.title)}</h3><p>${esc(r.description||'Practical pharma industry resource.')}</p>${r.pdf_url?`<a class="btn primary" href="${safeUrl(r.pdf_url)}" target="_blank" rel="noopener noreferrer">View PDF →</a>`:''}</article>`).join(''):'<div class="empty-industry">No industry resources found.</div>';
  }
  document.addEventListener('DOMContentLoaded',()=>{ $('industrySearch')?.addEventListener('input',render);$('industryFilter')?.addEventListener('change',render);load(); });
})();
