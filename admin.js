const ADMIN_BUCKET = "B. Pharm Notes";

document.addEventListener("DOMContentLoaded", async () => {
  if (!window.supabase || typeof SUPABASE_URL === "undefined" || typeof SUPABASE_KEY === "undefined") return;

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const loginPanel = document.getElementById("loginPanel");
  const uploadPanel = document.getElementById("uploadPanel");
  const loginForm = document.getElementById("loginForm");
  const uploadForm = document.getElementById("uploadForm");
  const loginMsg = document.getElementById("loginMsg");
  const uploadMsg = document.getElementById("uploadMsg");
  const logoutBtn = document.getElementById("logoutBtn");

  const setLoggedIn = session => {
    loginPanel?.classList.toggle("hidden", Boolean(session));
    uploadPanel?.classList.toggle("hidden", !session);
  };

  const { data: { session } } = await client.auth.getSession();
  setLoggedIn(session);

  client.auth.onAuthStateChange((_event, nextSession) => setLoggedIn(nextSession));

  loginForm?.addEventListener("submit", async event => {
    event.preventDefault();
    loginMsg.textContent = "Signing in…";
    const { error } = await client.auth.signInWithPassword({
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value
    });
    loginMsg.textContent = error ? error.message : "";
  });

  logoutBtn?.addEventListener("click", async () => {
    await client.auth.signOut();
  });

  uploadForm?.addEventListener("submit", async event => {
    event.preventDefault();
    uploadMsg.textContent = "Uploading…";

    const title = document.getElementById("title").value.trim();
    const semester = document.getElementById("semester").value;
    const subject = document.getElementById("subject").value.trim();
    const description = document.getElementById("description").value.trim();
    const file = document.getElementById("pdf").files[0];

    if (!file || file.type !== "application/pdf") {
      uploadMsg.textContent = "Please select a PDF file.";
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      uploadMsg.textContent = "Please keep the PDF under 25 MB.";
      return;
    }

    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `${semester}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await client.storage.from(ADMIN_BUCKET).upload(path, file, {
      contentType: "application/pdf",
      upsert: false
    });

    if (uploadError) {
      uploadMsg.textContent = `Upload failed: ${uploadError.message}`;
      return;
    }

    const { data: publicData } = client.storage.from(ADMIN_BUCKET).getPublicUrl(path);
    const { error: insertError } = await client.from("notes").insert({
      title, semester, subject, description, pdf_url: publicData.publicUrl
    });

    if (insertError) {
      uploadMsg.textContent = `PDF uploaded, but database entry failed: ${insertError.message}`;
      return;
    }

    uploadForm.reset();
    uploadMsg.textContent = "Published successfully. The note is now visible on the Notes page.";
  });
});
