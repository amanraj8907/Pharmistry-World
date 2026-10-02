(function () {
  "use strict";

  const SUPABASE_URL =
    "https://qgmpwanxqytoakmnklvy.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_qlOg73Ee92_uzX9YsaRPIA_dMQX9gub";

  const SUBJECTS = {
    "1st Semester": [
      "Human Anatomy and Physiology I",
      "Pharmaceutical Analysis I",
      "Pharmaceutics I",
      "Pharmaceutical Inorganic Chemistry",
      "Communication Skills",
      "Remedial Biology / Remedial Mathematics"
    ],

    "2nd Semester": [
      "Human Anatomy and Physiology II",
      "Pharmaceutical Organic Chemistry I",
      "Biochemistry",
      "Pathophysiology",
      "Computer Applications in Pharmacy",
      "Environmental Sciences"
    ],

    "3rd Semester": [
      "Pharmaceutical Organic Chemistry II",
      "Physical Pharmaceutics I",
      "Pharmaceutical Microbiology",
      "Pharmaceutical Engineering"
    ],

    "4th Semester": [
      "Pharmaceutical Organic Chemistry III",
      "Medicinal Chemistry I",
      "Physical Pharmaceutics II",
      "Pharmacology I",
      "Pharmacognosy and Phytochemistry I"
    ],

    "5th Semester": [
      "Medicinal Chemistry II",
      "Industrial Pharmacy I",
      "Pharmacology II",
      "Pharmacognosy and Phytochemistry II",
      "Pharmaceutical Jurisprudence"
    ],

    "6th Semester": [
      "Medicinal Chemistry III",
      "Pharmacology III",
      "Herbal Drug Technology",
      "Biopharmaceutics and Pharmacokinetics",
      "Pharmaceutical Biotechnology",
      "Quality Assurance"
    ],

    "7th Semester": [
      "Instrumental Methods of Analysis",
      "Industrial Pharmacy II",
      "Pharmacy Practice",
      "Novel Drug Delivery System"
    ],

    "8th Semester": [
      "Biostatistics and Research Methodology",
      "Social and Preventive Pharmacy",
      "Pharma Marketing Management",
      "Pharmaceutical Regulatory Science",
      "Pharmacovigilance",
      "Quality Control and Standardization of Herbals",
      "Computer Aided Drug Design",
      "Cell and Molecular Biology",
      "Cosmetic Science",
      "Experimental Pharmacology",
      "Advanced Instrumentation Techniques",
      "Dietary Supplements and Nutraceuticals",
      "Project Work"
    ]
  };

  const UNITS = [
    "Unit 1",
    "Unit 2",
    "Unit 3",
    "Unit 4",
    "Unit 5"
  ];

  let notesData = [];

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function escapeHTML(value) {
    return String(value || "").replace(
      /[&<>"']/g,
      function (char) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[char];
      }
    );
  }

  function injectCSS() {
    if (document.getElementById("pwMatrixCSS")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "pwMatrixCSS";

    style.textContent = `
      .pw-matrix-section {
        margin: 35px 0 60px;
        padding: 20px;
        border: 1px solid #dce8e6;
        border-radius: 18px;
        background: #fff;
        box-shadow: 0 8px 25px rgba(0,0,0,.05);
      }

      .pw-matrix-title {
        margin-bottom: 18px;
      }

      .pw-matrix-title h2 {
        margin: 0 0 6px;
        font-size: 25px;
      }

      .pw-matrix-title p {
        margin: 0;
        color: #71817f;
      }

      .pw-semester-grid {
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .pw-semester-card {
        width: 100%;
        min-height: 72px;
        padding: 14px;
        border: 1px solid #dce8e6;
        border-radius: 14px;
        background: #fff;
        cursor: pointer;
        text-align: left;
        font: inherit;
        font-weight: 700;
        color: #173b39;
        transition: .2s ease;
      }

      .pw-semester-card:hover {
        transform: translateY(-2px);
        border-color: #117f78;
        box-shadow: 0 7px 18px rgba(0,0,0,.08);
      }

      .pw-semester-card span {
        display: block;
        margin-top: 5px;
        color: #117f78;
        font-size: 13px;
        font-weight: 600;
      }

      .pw-back {
        border: 0;
        background: transparent;
        padding: 0;
        margin-bottom: 15px;
        color: #117f78;
        font-weight: 800;
        cursor: pointer;
        font-size: 14px;
      }

      .pw-selected-semester {
        margin-bottom: 15px;
      }

      .pw-selected-semester h3 {
        margin: 0;
        font-size: 22px;
      }

      .pw-scroll-hint {
        margin-bottom: 10px;
        padding: 8px 10px;
        border-radius: 9px;
        background: #eef8f6;
        color: #117f78;
        text-align: center;
        font-size: 12px;
        font-weight: 700;
      }

      .pw-matrix-filters {
        display: grid;
        grid-template-columns:
          1.5fr 1fr;
        gap: 10px;
        margin-bottom: 15px;
      }

      .pw-matrix-filters input,
      .pw-matrix-filters select {
        width: 100%;
        box-sizing: border-box;
        padding: 11px 12px;
        border: 1px solid #d7e3e1;
        border-radius: 10px;
        background: #fff;
        font: inherit;
        color: #203635;
        outline: none;
      }

      .pw-matrix-wrap {
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
        border: 1px solid #dce8e6;
        border-radius: 13px;
      }

      .pw-matrix {
        width: 100%;
        min-width: 820px;
        border-collapse: collapse;
      }

      .pw-matrix th {
        padding: 12px 10px;
        background: #103b39;
        color: #fff;
        text-align: center;
        white-space: nowrap;
        font-size: 13px;
      }

      .pw-matrix th:first-child {
        text-align: left;
        min-width: 270px;
        position: sticky;
        left: 0;
        z-index: 5;
      }

      .pw-matrix td {
        padding: 9px;
        border-top: 1px solid #e5eceb;
        text-align: center;
        background: #fff;
      }

      .pw-matrix td:first-child {
        position: sticky;
        left: 0;
        z-index: 3;
        min-width: 270px;
        text-align: left;
        background: #fff;
        box-shadow: 4px 0 8px rgba(0,0,0,.05);
      }

      .pw-subject-name {
        font-weight: 700;
        color: #203635;
        line-height: 1.3;
      }

      .pw-subject-semester {
        display: block;
        margin-top: 3px;
        color: #7b8988;
        font-size: 11px;
        font-weight: 500;
      }

      .pw-cell {
        width: 100%;
        min-width: 65px;
        min-height: 38px;
        border: 0;
        border-radius: 9px;
        font: inherit;
        font-size: 12px;
        font-weight: 800;
      }

      .pw-cell.available {
        background: #d9f5df;
        color: #137333;
        cursor: pointer;
      }

      .pw-cell.available:hover {
        background: #bcebc7;
      }

      .pw-cell.na {
        background: #f8dddd;
        color: #c62828;
        cursor: default;
      }

      .pw-empty {
        padding: 25px;
        text-align: center;
        color: #74827f;
      }

      .pw-legend {
        margin-top: 12px;
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        font-size: 12px;
      }

      .pw-green {
        color: #137333;
        font-weight: 800;
      }

      .pw-red {
        color: #c62828;
        font-weight: 800;
      }

      /* POPUP */

      .pw-popup-overlay {
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(0,0,0,.42);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 16px;
        box-sizing: border-box;
      }

      .pw-popup {
        width: min(1050px, 100%);
        max-height: calc(100vh - 32px);
        overflow-y: auto;
        background: #fff;
        border-radius: 20px;
        padding: 22px;
        box-sizing: border-box;
        box-shadow: 0 25px 70px rgba(0,0,0,.3);
        position: relative;
      }

      .pw-popup-close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 50%;
        background: #f1f4f4;
        font-size: 25px;
        cursor: pointer;
      }

      .pw-popup-title {
        padding-right: 45px;
        margin-bottom: 18px;
      }

      .pw-popup-title h2 {
        margin: 0 0 6px;
        font-size: 24px;
      }

      .pw-popup-title p {
        margin: 0;
        color: #71817f;
        font-size: 14px;
      }

      .pw-popup-footer {
        margin-top: 18px;
        padding-top: 17px;
        border-top: 1px solid #e0e9e7;
        text-align: center;
        color: #117f78;
        font-weight: 800;
      }

      @media (max-width: 700px) {

        .pw-matrix-section {
          padding: 15px;
        }

        .pw-semester-grid {
          grid-template-columns: 1fr;
        }

        .pw-matrix-filters {
          grid-template-columns: 1fr;
        }

        .pw-matrix {
          min-width: 800px;
        }

        .pw-matrix th:first-child,
        .pw-matrix td:first-child {
          min-width: 235px;
        }

        .pw-popup-overlay {
          padding: 8px;
        }

        .pw-popup {
          width: 100%;
          max-height: calc(100vh - 16px);
          padding: 16px;
          border-radius: 17px;
        }

        .pw-popup-title h2 {
          font-size: 20px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  async function loadNotes() {
    try {
      let client;

      if (
        window.supabase &&
        window.supabase.createClient
      ) {
        client =
          window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
          );
      } else {
        await loadSupabase();

        client =
          window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
          );
      }

      const result = await client
        .from("notes")
        .select("semester,subject,unit");

      if (result.error) {
        throw result.error;
      }

      notesData = result.data || [];

    } catch (error) {
      console.error(
        "Unit Matrix database error:",
        error
      );

      notesData = [];
    }
  }

  function loadSupabase() {
    return new Promise(
      function (resolve, reject) {

        if (
          window.supabase &&
          window.supabase.createClient
        ) {
          resolve();
          return;
        }

        const script =
          document.createElement(
            "script"
          );

        script.src =
          "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

        script.onload =
          function () {
            if (
              window.supabase &&
              window.supabase.createClient
            ) {
              resolve();
            } else {
              reject(
                new Error(
                  "Supabase unavailable"
                )
              );
            }
          };

        script.onerror =
          function () {
            reject(
              new Error(
                "Supabase failed to load"
              )
            );
          };

        document.head.appendChild(
          script
        );
      }
    );
  }

  function isAvailable(
    semester,
    subject,
    unit
  ) {
    return notesData.some(
      function (note) {
        return (
          normalize(note.semester) ===
            normalize(semester) &&
          normalize(note.subject) ===
            normalize(subject) &&
          normalize(note.unit) ===
            normalize(unit)
        );
      }
    );
  }

  function semesterCards() {
    return `
      <div class="pw-semester-grid">

        ${Object.keys(SUBJECTS)
          .map(
            function (semester) {
              return `
                <button
                  type="button"
                  class="pw-semester-card"
                  data-semester="${escapeHTML(
                    semester
                  )}">

                  ${escapeHTML(
                    semester
                  )}

                  <span>
                    View subjects →
                  </span>

                </button>
              `;
            }
          )
          .join("")}

      </div>
    `;
  }

  function subjectMatrix(
    semester
  ) {
    return `
      <button
        type="button"
        class="pw-back"
        data-back="semesters">
        ← Back to Semesters
      </button>

      <div class="pw-selected-semester">
        <h3>
          ${escapeHTML(semester)}
        </h3>
      </div>

      <div class="pw-matrix-filters">

        <input
          type="search"
          class="pw-search"
          placeholder="Search Subject..."
          autocomplete="off">

        <select class="pw-status">
          <option value="all">
            All
          </option>

          <option value="available">
            Available
          </option>

          <option value="na">
            NA
          </option>
        </select>

      </div>

      <div class="pw-scroll-hint">
        👉 Swipe left/right to view Unit 1–5
      </div>

      <div class="pw-matrix-wrap">
        <table class="pw-matrix">

          <thead>
            <tr>
              <th>Subject</th>
              <th>Unit 1</th>
              <th>Unit 2</th>
              <th>Unit 3</th>
              <th>Unit 4</th>
              <th>Unit 5</th>
            </tr>
          </thead>

          <tbody class="pw-subject-body">
          </tbody>

        </table>
      </div>

      <div class="pw-legend">
        <span>
          <span class="pw-green">🟢 Available</span>
          — Click to open
        </span>

        <span>
          <span class="pw-red">🔴 NA</span>
          — Not available
        </span>
      </div>
    `;
  }

  function renderSubjects(
    container,
    semester
  ) {
    const body =
      container.querySelector(
        ".pw-subject-body"
      );

    if (!body) {
      return;
    }

    const search =
      normalize(
        (
          container.querySelector(
            ".pw-search"
          ) || {}
        ).value
      );

    const status =
      (
        container.querySelector(
          ".pw-status"
        ) || {}
      ).value || "all";

    const subjects =
      SUBJECTS[semester] || [];

    const filtered =
      subjects.filter(
        function (subject) {

          if (
            search &&
            !normalize(subject).includes(
              search
            )
          ) {
            return false;
          }

          const availability =
            UNITS.map(
              function (unit) {
                return isAvailable(
                  semester,
                  subject,
                  unit
                );
              }
            );

          const hasAvailable =
            availability.some(
              Boolean
            );

          const hasNA =
            availability.some(
              function (value) {
                return !value;
              }
            );

          if (
            status === "available" &&
            !hasAvailable
          ) {
            return false;
          }

          if (
            status === "na" &&
            !hasNA
          ) {
            return false;
          }

          return true;
        }
      );

    if (!filtered.length) {
      body.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="pw-empty">
              No subjects found.
            </div>
          </td>
        </tr>
      `;

      return;
    }

    body.innerHTML =
      filtered
        .map(
          function (subject) {

            return `
              <tr>

                <td>
                  <div class="pw-subject-name">
                    ${escapeHTML(
                      subject
                    )}
                  </div>

                  <span class="pw-subject-semester">
                    ${escapeHTML(
                      semester
                    )}
                  </span>
                </td>

                ${UNITS.map(
                  function (unit) {

                    const available =
                      isAvailable(
                        semester,
                        subject,
                        unit
                      );

                    if (!available) {
                      return `
                        <td>
                          <button
                            type="button"
                            class="pw-cell na"
                            disabled>
                            🔴 NA
                          </button>
                        </td>
                      `;
                    }

                    return `
                      <td>
                        <button
                          type="button"
                          class="pw-cell available"
                          data-semester="${escapeHTML(
                            semester
                          )}"
                          data-subject="${escapeHTML(
                            subject
                          )}"
                          data-unit="${escapeHTML(
                            unit
                          )}">
                          🟢
                        </button>
                      </td>
                    `;
                  }
                ).join("")}

              </tr>
            `;
          }
        )
        .join("");

    body
      .querySelectorAll(
        ".pw-cell.available"
      )
      .forEach(
        function (button) {

          button.addEventListener(
            "click",
            function () {

              const sem =
                button.dataset.semester;

              const subject =
                button.dataset.subject;

              const unit =
                button.dataset.unit;

              closePopup();

              if (
                typeof window.showPDFs ===
                "function"
              ) {
                window.showPDFs(
                  sem,
                  subject,
                  unit
                );

                setTimeout(
                  function () {

                    const notes =
                      document.getElementById(
                        "notes"
                      );

                    if (notes) {
                      notes.scrollIntoView({
                        behavior:
                          "smooth",
                        block:
                          "start"
                      });
                    }

                  },
                  150
                );
              }
            }
          );
        }
      );
  }

  function renderSemesterView(
    container,
    semester
  ) {
    container.innerHTML =
      subjectMatrix(
        semester
      );

    renderSubjects(
      container,
      semester
    );

    const search =
      container.querySelector(
        ".pw-search"
      );

    const status =
      container.querySelector(
        ".pw-status"
      );

    if (search) {
      search.addEventListener(
        "input",
        function () {
          renderSubjects(
            container,
            semester
          );
        }
      );
    }

    if (status) {
      status.addEventListener(
        "change",
        function () {
          renderSubjects(
            container,
            semester
          );
        }
      );
    }

    const back =
      container.querySelector(
        '[data-back="semesters"]'
      );

    if (back) {
      back.addEventListener(
        "click",
            function () {

      renderSemesterList(
        container
      );

    }
  );
}
  }

function renderSemesterList(
  container
) {
  container.innerHTML =
    semesterCards();

  container
    .querySelectorAll(
      ".pw-semester-card"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            renderSemesterView(
              container,
              button.dataset.semester
            );

          }
        );

      }
    );
}

function permanentMatrix() {
  return `
    <section
      id="pwPermanentMatrix"
      class="pw-matrix-section">

      <div class="pw-matrix-title">

        <h2>
          📚 Unit Availability
        </h2>

        <p>
          Select a semester to view
          subject-wise unit availability.
        </p>

      </div>

      <div
        id="pwPermanentContent">
      </div>

    </section>
  `;
}

function createPermanentMatrix() {

  if (
    document.getElementById(
      "pwPermanentMatrix"
    )
  ) {
    return;
  }

  const notes =
    document.getElementById(
      "notes"
    );

  if (!notes) {
    return;
  }

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.innerHTML =
    permanentMatrix();

  const section =
    wrapper.firstElementChild;

  notes.parentNode.insertBefore(
    section,
    notes.nextSibling
  );

  const content =
    document.getElementById(
      "pwPermanentContent"
    );

  renderSemesterList(
    content
  );
}

function popupHTML() {
  return `
    <div
      class="pw-popup-overlay"
      id="pwMatrixPopup">

      <div
        class="pw-popup"
        role="dialog"
        aria-modal="true">

        <button
          type="button"
          class="pw-popup-close"
          id="pwMatrixClose"
          aria-label="Close">
          ×
        </button>

        <div class="pw-popup-title">

          <h2>
            📚 B.Pharm Unit Availability
          </h2>

          <p>
            Select a semester to view
            available study units.
          </p>

        </div>

        <div id="pwPopupContent">
        </div>

        <div class="pw-popup-footer">
          Thank You 🥰 Please Share 😊
        </div>

      </div>

    </div>
  `;
}

function createPopup() {

  if (
    document.getElementById(
      "pwMatrixPopup"
    )
  ) {
    return;
  }

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.innerHTML =
    popupHTML();

  document.body.appendChild(
    wrapper.firstElementChild
  );

  const popup =
    document.getElementById(
      "pwMatrixPopup"
    );

  const content =
    document.getElementById(
      "pwPopupContent"
    );

  renderSemesterList(
    content
  );

  const close =
    document.getElementById(
      "pwMatrixClose"
    );

  if (close) {
    close.addEventListener(
      "click",
      closePopup
    );
  }

  popup.addEventListener(
    "click",
    function (event) {

      if (
        event.target === popup
      ) {
        closePopup();
      }

    }
  );

  document.body.style.overflow =
    "hidden";
}

function closePopup() {

  const popup =
    document.getElementById(
      "pwMatrixPopup"
    );

  if (popup) {
    popup.remove();
  }

  document.body.style.overflow =
    "";
}

async function start() {

  try {

    injectCSS();

    /*
      Popup ko database se pehle create karo.
      Isse Supabase delay ki wajah se popup
      disappear nahi hoga.
    */

    createPopup();

    /*
      Permanent matrix bhi immediately create karo.
    */

    createPermanentMatrix();

    /*
      Ab database se availability load karo.
    */

    await loadNotes();

    /*
      Database load hone ke baad popup aur
      permanent matrix ko fresh render karo.
    */

    const popupContent =
      document.getElementById(
        "pwPopupContent"
      );

    if (popupContent) {
      renderSemesterList(
        popupContent
      );
    }

    const permanentContent =
      document.getElementById(
        "pwPermanentContent"
      );

    if (permanentContent) {
      renderSemesterList(
        permanentContent
      );
    }

  } catch (error) {

    console.error(
      "Pharmistry World Unit Matrix error:",
      error
    );

  }

}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    start
  );

} else {

  start();

}


})();
