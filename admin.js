const SUPABASE_URL = "https://qgmpwanxqytoakmnklvy.supabase.co";
const SUPABASE_KEY = "sb_publishable_qlOg73Ee92_uzX9YsaRPIA_dMQX9gub";
const BUCKET = "B. Pharm Notes";

let supabase;

const $ = (id) => document.getElementById(id);

function msg(el, text, ok = false) {
  if (!el) return;
  el.textContent = text || "";
  el.className = "message " + (ok ? "ok" : "error");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[ch]));
}

async function isAdmin(userId) {
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    console.error("Admin check failed:", error);
    throw new Error("Admin check failed: " + error.message);
  }

  return Array.isArray(data) && data.length > 0;
}

async function showSession() {
  const loginView = $("loginView");
  const adminView = $("adminView");
  const loginMsg = $("loginMsg");

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    const session = data?.session;

    if (!session) {
      loginView.classList.remove("hidden");
      adminView.classList.add("hidden");
      return;
    }

    msg(loginMsg, "Checking admin access…", true);

    const allowed = await isAdmin(session.user.id);

    if (!allowed) {
      await supabase.auth.signOut();

      loginView.classList.remove("hidden");
      adminView.classList.add("hidden");

      msg(
        loginMsg,
        "Login succeeded, but this account is not listed as an admin."
      );

      return;
    }

    $("userEmail").textContent = session.user.email || "";

    loginView.classList.add("hidden");
    adminView.classList.remove("hidden");

    msg(loginMsg, "");

    await loadNotes();

  } catch (err) {
    console.error(err);

    loginView.classList.remove("hidden");
    adminView.classList.add("hidden");

    msg(
      loginMsg,
      err?.message || "Unable to check login status."
    );
  }
}

async function login(e) {
  e.preventDefault();

  const loginMsg = $("loginMsg");

  const button =
    e.submitter ||
    $("loginForm")?.querySelector("button[type=submit]");

  if (button) button.disabled = true;

  msg(loginMsg, "Signing in…", true);

  try {
    const email = $("email").value.trim();
    const password = $("password").value;

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    if (!data?.session) {
      throw new Error("Login did not create a session.");
    }

    await showSession();

  } catch (err) {
    console.error("Login error:", err);

    msg(
      loginMsg,
      err?.message || "Login failed."
    );

  } finally {
    if (button) button.disabled = false;
  }
}

async function loadNotes() {
  const box = $("notesList");

  if (!box) return;

  box.innerHTML = "<p class='muted'>Loading…</p>";

  const { data, error } =
    await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

  if (error) {
    box.innerHTML =
      `<p class="message error">${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!data?.length) {
    box.innerHTML =
      "<p class='muted'>No notes published yet.</p>";
    return;
  }

  box.innerHTML = data.map(note => `
    <article class="note-row">
      <div>
        <span class="badge">
          ${escapeHtml(note.semester)}
        </span>

        <h3>
          ${escapeHtml(note.title)}
        </h3>

        <p>
          ${escapeHtml(note.subject)}
          ${note.description
            ? " · " + escapeHtml(note.description)
            : ""}
        </p>
      </div>

      <div class="row-actions">
        <a
          class="btn"
          href="${escapeHtml(note.pdf_url)}"
          target="_blank"
          rel="noopener"
        >
          View
        </a>

        <button
          class="btn danger"
          data-delete="${escapeHtml(note.id)}"
          data-url="${escapeHtml(note.pdf_url)}"
        >
          Delete
        </button>
      </div>
    </article>
  `).join("");

  box
    .querySelectorAll("[data-delete]")
    .forEach(btn => {
      btn.addEventListener(
        "click",
        () => deleteNote(
          btn.dataset.delete,
          btn.dataset.url
        )
      );
    });
}

async function uploadNote(e) {
  e.preventDefault();

  const uploadMsg = $("uploadMsg");

  const button =
    e.submitter ||
    $("uploadForm")?.querySelector("button[type=submit]");

  const file = $("pdf")?.files[0];

  if (!file) {
    msg(uploadMsg, "Choose a PDF first.");
    return;
  }

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    msg(uploadMsg, "Only PDF files are allowed.");
    return;
  }

  if (file.size > 25 * 1024 * 1024) {
    msg(uploadMsg, "PDF must be 25 MB or smaller.");
    return;
  }

  if (button) button.disabled = true;

  msg(uploadMsg, "Uploading…", true);

  try {

    const safeName =
      file.name
        .replace(/\.pdf$/i, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "note";

    const path =
      `notes/${Date.now()}-${safeName}.pdf`;

    const { error: uploadError } =
      await supabase.storage
        .from(BUCKET)
        .upload(
          path,
          file,
          {
            contentType: "application/pdf",
            cacheControl: "3600",
            upsert: false
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicData } =
      supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

    const { error: dbError } =
      await supabase
        .from("notes")
        .insert({
          title: $("title").value.trim(),
          semester: $("semester").value,
          subject: $("subject").value.trim(),
          description: $("description").value.trim(),
          pdf_url: publicData.publicUrl
        });

    if (dbError) {

      await supabase.storage
        .from(BUCKET)
        .remove([path]);

      throw dbError;
    }

    $("uploadForm").reset();

    if ($("fileName")) {
      $("fileName").textContent =
        "No file selected";
    }

    msg(
      uploadMsg,
      "Note published successfully.",
      true
    );

    await loadNotes();

  } catch (err) {

    console.error("Upload error:", err);

    msg(
      uploadMsg,
      err?.message || "Upload failed."
    );

  } finally {

    if (button) button.disabled = false;
  }
}

async function deleteNote(id, pdfUrl) {

  if (!confirm("Delete this note from the library?")) {
    return;
  }

  const marker =
    `/storage/v1/object/public/${encodeURIComponent(BUCKET)}/`;

  let path = null;

  try {

    if (pdfUrl.includes(marker)) {
      path =
        decodeURIComponent(
          pdfUrl.split(marker)[1]
        );
    }

  } catch {}

  if (path) {

    const { error } =
      await supabase.storage
        .from(BUCKET)
        .remove([path]);

    if (error) {
      alert(error.message);
      return;
    }
  }

  const { error } =
    await supabase
      .from("notes")
      .delete()
      .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadNotes();
}

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {

      if (!window.supabase) {
        throw new Error(
          "Supabase library did not load. Refresh the page and try again."
        );
      }

      supabase =
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_KEY
        );

      $("loginForm")?.addEventListener(
        "submit",
        login
      );

      $("logoutBtn")?.addEventListener(
        "click",
        async () => {
          await supabase.auth.signOut();
          await showSession();
        }
      );

      $("uploadForm")?.addEventListener(
        "submit",
        uploadNote
      );

      $("refreshBtn")?.addEventListener(
        "click",
        loadNotes
      );

      $("pdf")?.addEventListener(
        "change",
        () => {
          if ($("fileName")) {
            $("fileName").textContent =
              $("pdf").files[0]?.name ||
              "No file selected";
          }
        }
      );

      supabase.auth.onAuthStateChange(
        () => setTimeout(showSession, 0)
      );

      await showSession();

    } catch (err) {

      console.error(err);

      msg(
        $("loginMsg"),
        err?.message ||
        "Admin page failed to initialize."
      );
    }
  }
);
