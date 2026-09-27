const SUPABASE_URL = "https://qgmpwanxqytoakmnklvy.supabase.co";
const SUPABASE_KEY = "sb_publishable_qlOg73Ee92_uzX9YsaRPIA_dMQX9gub";

const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
script.onload = loadNotes;
document.head.appendChild(script);

function loadNotes() {
  const { createClient } = window.supabase;
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const grid = document.getElementById("notes");
  if (!grid) return;

  const search = document.getElementById("search");
  const semester = document.getElementById("sem");

  let notes = [];

  async function getNotes() {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      grid.innerHTML = "<p>Notes load nahi ho paaye.</p>";
      console.error(error);
      return;
    }

    notes = data || [];
    render();
  }

  function render() {
    const q = (search?.value || "").toLowerCase();
    const s = semester?.value || "";

    const filtered = notes.filter(n =>
      (!s || n.semester === s) &&
      (`${n.title} ${n.subject} ${n.description || ""}`
        .toLowerCase()
        .includes(q))
    );

    grid.innerHTML = filtered.length
      ? filtered.map(n => `
        <article class="note">
          <span>PDF</span>
          <div>
            <small>${n.semester}</small>
            <h3>${n.title}</h3>
            <p>${n.description || ""}</p>
            <b>${n.subject}</b>
          </div>
          <a class="btn" href="${n.pdf_url}" target="_blank">
            View PDF →
          </a>
        </article>
      `).join("")
      : "<div class='empty'>No notes found.</div>";
  }

  search?.addEventListener("input", render);
  semester?.addEventListener("change", render);

  getNotes();
}

// Mobile menu
document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".menu");
  const nav = document.querySelector("nav");

  if (menu && nav) {
    menu.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  }
});
