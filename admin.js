const SUPABASE_URL = "https://qgmpwanxqytoakmnklvy.supabase.co";
const SUPABASE_KEY = "sb_publishable_qlOg73Ee92_uzX9YsaRPIA_dMQX9gub";
const BUCKET = "B. Pharm Notes";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);
const loginView = $("loginView");
const adminView = $("adminView");
const loginMsg = $("loginMsg");
const uploadMsg = $("uploadMsg");

function msg(el, text, ok = false) {
  el.textContent = text || "";
  el.className = "message " + (ok ? "ok" : "error");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

async function isAdmin(userId) {
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return !error && !!data;
}

async function showSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    loginView.classList.remove("hidden");
    adminView.classList.add("hidden");
    return;
  }

  const allowed = await isAdmin(session.user.id);
  if (!allowed) {
    await supabase.auth.signOut();
    loginView.classList.remove("hidden");
    adminView.classList.add("hidden");
    msg(loginMsg, "This account is not authorized as an admin.");
    return;
  }

  $("userEmail").textContent = session.user.email || "";
  loginView.classList.add("hidden");
  adminView.classList.remove("hidden");
  await loadNotes();
}

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  msg(loginMsg, "Signing in…");
  const { error } = await supabase.auth.signInWithPassword({
    email: $("email").value.trim(),
    password: $("password").value
  });
  if (error) return msg(loginMsg, error.message);
  await showSession();
});

$("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  await showSession();
});

$("pdf").addEventListener("change", () => {
  $("fileName").textContent = $("pdf").files[0]?.name || "No file selected";
});

$("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = $("pdf").files[0];
  if (!file) return msg(uploadMsg, "Choose a PDF first.");
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return msg(uploadMsg, "Only PDF files are allowed.");
  }
  if (file.size > 25 * 1024 * 1024) {
    return msg(uploadMsg, "PDF must be 25 MB or smaller.");
  }

  msg(uploadMsg, "Uploading…");
  const safeName = file.name
    .replace(/\.pdf$/i, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "note";
  const path = `notes/${Date.now()}-${safeName}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: false
    });

  if (uploadError) return msg(uploadMsg, uploadError.message);

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const pdfUrl = publicData.publicUrl;

  const { error: dbError } = await supabase.from("notes").insert({
    title: $("title").value.trim(),
    semester: $("semester").value,
    subject: $("subject").value.trim(),
    description: $("description").value.trim(),
    pdf_url: pdfUrl
  });

  if (dbError) {
    await supabase.storage.from(BUCKET).remove([path]);
    return msg(uploadMsg, dbError.message);
  }

  $("uploadForm").reset();
  $("fileName").textContent = "No file selected";
  msg(uploadMsg, "Note published successfully.", true);
  await loadNotes();
});

$("refreshBtn").addEventListener("click", loadNotes);

async function loadNotes() {
  const box = $("notesList");
  box.innerHTML = "<p class='muted'>Loading…</p>";

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    box.innerHTML = `<p class="message error">${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!data?.length) {
    box.innerHTML = "<p class='muted'>No notes published yet.</p>";
    return;
  }

  box.innerHTML = data.map(note => `
    <article class="note-row">
      <div>
        <span class="badge">${escapeHtml(note.semester)}</span>
        <h3>${escapeHtml(note.title)}</h3>
        <p>${escapeHtml(note.subject)}${note.description ? " · " + escapeHtml(note.description) : ""}</p>
      </div>
      <div class="row-actions">
        <a class="btn" href="${escapeHtml(note.pdf_url)}" target="_blank" rel="noopener">View</a>
        <button class="btn danger" data-delete="${escapeHtml(note.id)}" data-url="${escapeHtml(note.pdf_url)}">Delete</button>
      </div>
    </article>
  `).join("");

  box.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => deleteNote(btn.dataset.delete, btn.dataset.url));
  });
}

function storagePathFromPublicUrl(url) {
  try {
    const marker = `/storage/v1/object/public/${encodeURIComponent(BUCKET)}/`;
    if (url.includes(marker)) return decodeURIComponent(url.split(marker)[1]);
    const fallback = `/storage/v1/object/public/${BUCKET}/`;
    if (url.includes(fallback)) return decodeURIComponent(url.split(fallback)[1]);
  } catch {}
  return null;
}

async function deleteNote(id, pdfUrl) {
  if (!confirm("Delete this note from the library?")) return;

  const path = storagePathFromPublicUrl(pdfUrl);
  if (path) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([path]);
    if (storageError) return alert(storageError.message);
  }

  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) return alert(error.message);

  await loadNotes();
}

supabase.auth.onAuthStateChange(() => {
  setTimeout(showSession, 0);
});

showSession();
