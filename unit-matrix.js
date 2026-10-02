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

  let allNotes = [];
  let currentSemester = "All Semesters";

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function esc(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      function (c) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[c];
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
        padding: 24px;
        border: 1px solid #dbe8e6;
        border-radius: 20px;
        background: #ffffff;
        box-shadow: 0 10px 30px rgba(0,0,0,.05);
      }

      .pw-matrix-head {
        margin-bottom: 20px;
      }

      .pw-matrix-head h2 {
        margin: 0 0 7px;
        font-size: 26px;
      }

      .pw-matrix-head p {
        margin: 0;
        color: #687979;
      }

      .pw-matrix-filters {
        display: grid;
        grid-template-columns: 1.5fr 1fr 1fr;
        gap: 10px;
        margin-bottom: 18px;
      }

      .pw-matrix-filters input,
      .pw-matrix-filters select {
        width: 100%;
        box-sizing: border-box;
        padding: 12px 13px;
        border: 1px solid #d5e2e0;
        border-radius: 11px;
        background: #fff;
        color: #203635;
        font: inherit;
        outline: none;
      }

      .pw-matrix-wrap {
        overflow-x: auto;
        border: 1px solid #dbe8e6;
        border-radius: 14px;
      }

      .pw-matrix {
        width: 100%;
        min-width: 760px;
        border-collapse: collapse;
      }

      .pw-matrix th {
        background: #102f2e;
        color: #fff;
        padding: 13px 10px;
        font-size: 13px;
        text-align: center;
        white-space: nowrap;
      }

      .pw-matrix th:first-child {
        text-align: left;
        min-width: 250px;
      }

      .pw-matrix td {
        border-top: 1px solid #e3eceb;
        padding: 9px;
        text-align: center;
        background: #fff;
      }

      .pw-matrix td:first-child {
        text-align: left;
        font-weight: 600;
        color: #203635;
      }

      .pw-cell {
        width: 100%;
        min-height: 40px;
        border: 0;
        border-radius: 9px;
        font-weight: 800;
        cursor: pointer;
        font-size: 14px;
      }

      .pw-cell.available {
        background: #d9f5df;
        color: #137333;
      }

      .pw-cell.available:hover {
        background: #bcebc7;
      }

      .pw-cell.na {
        background: #f8dddd;
        color: #c62828;
        cursor: default;
      }

      .pw-matrix-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-top: 15px;
        font-size: 13px;
        color: #536563;
      }

      .pw-legend-green {
        color: #137333;
        font-weight: 800;
      }

      .pw-legend-red {
        color: #c62828;
        font-weight: 800;
      }

      .pw-matrix-loading,
      .pw-matrix-empty {
        padding: 25px;
        text-align: center;
        color: #687979;
      }

      /* POPUP */

      .pw-popup-overlay {
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(0,0,0,.38);
        display: flex;
        justify-content: flex-end;
        align-items: flex-start;
        padding: 18px;
        box-sizing: border-box;
      }

      .pw-popup {
        width: min(900px, 100%);
        max-height: calc(100vh - 36px);
        overflow: auto;
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,.28);
        padding: 22px;
        position: relative;
      }

      .pw-popup-close {
        position: absolute;
        right: 14px;
        top: 12px;
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 50%;
        background: #f1f4f4;
        color: #203635;
        font-size: 24px;
        cursor: pointer;
        line-height: 1;
      }

      .pw-popup-title {
        padding-right: 45px;
        margin-bottom: 18px;
      }

      .pw-popup-title h2 {
        margin: 0 0 7px;
        font-size: 24px;
      }

      .pw-popup-title p {
        margin: 0;
        color: #687979;
      }

      .pw-popup-footer {
        text-align: center;
        padding-top: 20px;
        margin-top: 18px;
        border-top: 1px solid #e1e9e8;
        font-weight: 700;
        color: #117f78;
      }

      @media (max-width: 700px) {
        .pw-matrix-section {
          padding: 16px;
        }

        .pw-matrix-filters {
          grid-template-columns: 1fr;
        }

        .pw-popup-overlay {
          padding: 10px;
        }

        .pw-popup {
          max-height: calc(100vh - 20px);
          padding: 17px;
          border-radius: 16px;
        }

        .pw-popup-title h2 {
          font-size: 20px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function getAvailability(semester, subject, unit) {
    return allNotes.some(function (note) {
      return (
        normalize(note.semester) === normalize(semester) &&
        normalize(note.subject) === normalize(subject) &&
        normalize(note.unit) === normalize(unit)
      );
    });
  }

  async function loadNotes() {
    try {
      let client;

      if (
        window.supabase &&
        window.supabase.createClient
      ) {
        client = window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_KEY
        );
      } else {
        await loadSupabaseLibrary();

        client = window.supabase.createClient(
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

      allNotes = result.data || [];
    } catch (error) {
      console.error(
        "Unit Matrix loading error:",
        error
      );

      allNotes = [];
    }
  }

  function loadSupabaseLibrary() {
    return new Promise(function (resolve, reject) {
      if (
        window.supabase &&
        window.supabase.createClient
      ) {
        resolve();
        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

      script.onload = function () {
        if (
          window.supabase &&
          window.supabase.createClient
        ) {
          resolve();
        } else {
          reject(
            new Error("Supabase library unavailable")
          );
        }
      };

      script.onerror = function () {
        reject(
          new Error("Supabase library failed")
        );
      };

      document.head.appendChild(script);
    });
  }

  function getFilteredRows() {
    const search =
      document.getElementById("pwMatrixSearch");

    const semester =
      document.getElementById("pwMatrixSemester");

    const status =
      document.getElementById("pwMatrixStatus");

    const q = normalize(
      search ? search.value : ""
    );

    currentSemester =
      semester
        ? semester.value
        : "All Semesters";

    const statusValue =
      status
        ? status.value
        : "all";

    const rows = [];

    Object.keys(SUBJECTS).forEach(
      function (sem) {
        if (
          currentSemester !== "All Semesters" &&
          sem !== currentSemester
        ) {
          return;
        }

        SUBJECTS[sem].forEach(
          function (subject) {
            if (
              q &&
              !normalize(subject).includes(q)
            ) {
              return;
            }

            const availability =
              UNITS.map(function (unit) {
                return getAvailability(
                  sem,
                  subject,
                  unit
                );
              });

            const hasAvailable =
              availability.some(Boolean);

            const hasNA =
              availability.some(
                function (value) {
                  return !value;
                }
              );

            if (
              statusValue === "available" &&
              !hasAvailable
            ) {
              return;
            }

            if (
              statusValue === "na" &&
              !hasNA
            ) {
              return;
            }

            rows.push({
              semester: sem,
              subject: subject,
              availability: availability
            });
          }
        );
      }
    );

    return rows;
  }

  function matrixHTML() {
    return `
      <div class="pw-matrix-section" id="pwPermanentMatrix">

        <div class="pw-matrix-head">
          <h2>📚 Unit Availability</h2>
          <p>
            Check which study units are currently available.
            Green cells open the exact study material.
          </p>
        </div>

        <div class="pw-matrix-filters">

          <input
            id="pwMatrixSearch"
            type="search"
            placeholder="Search Subject..."
            autocomplete="off"
          >

          <select id="pwMatrixSemester">
            <option value="All Semesters">
              All Semesters
            </option>

            ${Object.keys(SUBJECTS)
              .map(function (sem) {
                return `
                  <option value="${esc(sem)}">
                    ${esc(sem)}
                  </option>
                `;
              })
              .join("")}
          </select>

          <select id="pwMatrixStatus">
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="na">NA</option>
          </select>

        </div>

        <div
          id="pwMatrixTable"
          class="pw-matrix-wrap">
        </div>

        <div class="pw-matrix-legend">
          <span>
            <span class="pw-legend-green">🟢 Available</span>
            — Click to open
          </span>

          <span>
            <span class="pw-legend-red">🔴 NA</span>
            — No PDF uploaded
          </span>
        </div>

      </div>
    `;
  }

  function renderMatrix(container) {
    if (!container) {
      return;
    }

    const rows = getFilteredRows();

    if (!rows.length) {
      container.innerHTML =
        `<div class="pw-matrix-empty">
          No subjects found.
        </div>`;

      return;
    }

    container.innerHTML = `
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

        <tbody>
          ${rows
            .map(function (row) {
              return `
                <tr>

                  <td>
                    ${esc(row.subject)}
                    <small style="
                      display:block;
                      color:#7a8987;
                      font-weight:500;
                      margin-top:3px;
                    ">
                      ${esc(row.semester)}
                    </small>
                  </td>

                  ${row.availability
                    .map(function (available, index) {
                      const unit =
                        UNITS[index];

                      if (available) {
                        return `
                          <td>
                            <button
                              type="button"
                              class="pw-cell available"
                              data-semester="${esc(row.semester)}"
                              data-subject="${esc(row.subject)}"
                              data-unit="${esc(unit)}">
                              🟢
                            </button>
                          </td>
                        `;
                      }

                      return `
                        <td>
                          <button
                            type="button"
                            class="pw-cell na"
                            type="button"
                            disabled>
                            🔴 NA
                          </button>
                        </td>
                      `;
                    })
                    .join("")}

                </tr>
              `;
            })
            .join("")}
        </tbody>

      </table>
    `;

    container
      .querySelectorAll(".pw-cell.available")
      .forEach(function (button) {
        button.addEventListener(
          "click",
          function () {
            const semester =
              button.dataset.semester;

            const subject =
              button.dataset.subject;

            const unit =
              button.dataset.unit;

            closePopup();

            /*
              Use the existing Notes navigation.
              We do NOT replace or modify it.
            */

            if (
              typeof window.showPDFs ===
              "function"
            ) {
              window.showPDFs(
                semester,
                subject,
                unit
              );

              const notes =
                document.getElementById(
                  "notes"
                );

              if (notes) {
                setTimeout(function () {
                  notes.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                  });
                }, 100);
              }
            }
          }
        );
      });
  }

  function bindFilters(container) {
    const search =
      document.getElementById(
        "pwMatrixSearch"
      );

    const semester =
      document.getElementById(
        "pwMatrixSemester"
      );

    const status =
      document.getElementById(
        "pwMatrixStatus"
      );

    if (search) {
      search.addEventListener(
        "input",
        function () {
          renderMatrix(container);
        }
      );
    }

    if (semester) {
      semester.addEventListener(
        "change",
        function () {
          renderMatrix(container);
        }
      );
    }

    if (status) {
      status.addEventListener(
        "change",
        function () {
          renderMatrix(container);
        }
      );
    }
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
      document.getElementById("notes");

    if (!notes) {
      return;
    }

    const section =
      document.createElement("section");

    section.innerHTML =
      matrixHTML();

    const matrix =
      section.firstElementChild;

    /*
      Keep the matrix outside #notes.
      Existing showHome/showSubjects/showUnits/
      showPDFs replace only #notes content.
    */

    notes.parentNode.insertBefore(
      matrix,
      notes.nextSibling
    );

    const table =
      document.getElementById(
        "pwMatrixTable"
      );

    bindFilters(table);
    renderMatrix(table);
  }

  function createPopup() {
    if (
      document.getElementById(
        "pwMatrixPopup"
      )
    ) {
      return;
    }

    const overlay =
      document.createElement("div");

    overlay.id =
      "pwMatrixPopup";

    overlay.className =
      "pw-popup-overlay";

    overlay.innerHTML = `
      <div
        class="pw-popup"
        role="dialog"
        aria-modal="true"
        aria-label="Unit Availability">

        <button
          type="button"
          class="pw-popup-close"
          id="pwMatrixClose"
          aria-label="Close">
          ×
        </button>

        <div class="pw-popup-title">
          <h2>📚 Unit Availability</h2>
          <p>
            See which B.Pharm units are currently available.
            Tap 🟢 to open the exact PDF section.
          </p>
        </div>

        <div class="pw-matrix-filters">

          <input
            id="pwPopupSearch"
            type="search"
            placeholder="Search Subject..."
            autocomplete="off"
          >

          <select id="pwPopupSemester">
            <option value="All Semesters">
              All Semesters
            </option>

            ${Object.keys(SUBJECTS)
              .map(function (sem) {
                return `
                  <option value="${esc(sem)}">
                    ${esc(sem)}
                  </option>
                `;
              })
              .join("")}
          </select>

          <select id="pwPopupStatus">
            <option value="all">All</option>
            <option value="available">
              Available
            </option>
            <option value="na">
              NA
            </option>
          </select>

        </div>

        <div
          id="pwPopupTable"
          class="pw-matrix-wrap">
          <div class="pw-matrix-loading">
            Loading availability...
          </div>
        </div>

        <div class="pw-popup-footer">
          Thank You 🥰 Please Share 😊
        </div>

      </div>
    `;

    document.body.appendChild(
      overlay
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

    overlay.addEventListener(
      "click",
      function (event) {
        if (
          event.target === overlay
        ) {
          closePopup();
        }
      }
    );

    const popupTable =
      document.getElementById(
        "pwPopupTable"
      );

    const popupSearch =
      document.getElementById(
        "pwPopupSearch"
      );

    const popupSemester =
      document.getElementById(
        "pwPopupSemester"
      );

    const popupStatus =
      document.getElementById(
        "pwPopupStatus"
      );

    function renderPopup() {
      renderMatrixFor(
        popupTable,
        popupSearch.value,
        popupSemester.value,
        popupStatus.value
      );
    }

    function bindPopupFilter(element) {
      if (!element) {
        return;
      }

      element.addEventListener(
        "input",
        renderPopup
      );

      element.addEventListener(
        "change",
        renderPopup
      );
    }

    bindPopupFilter(
      popupSearch
    );

    bindPopupFilter(
      popupSemester
    );

    bindPopupFilter(
      popupStatus
    );

    renderPopup();
  }

  function renderMatrixFor(
    container,
    searchValue,
    semesterValue,
    statusValue
  ) {
    const q =
      normalize(searchValue);

    const rows = [];

    Object.keys(SUBJECTS).forEach(
      function (sem) {

        if (
          semesterValue !==
            "All Semesters" &&
          sem !== semesterValue
        ) {
          return;
        }

        SUBJECTS[sem].forEach(
          function (subject) {

            if (
              q &&
              !normalize(subject)
                .includes(q)
            ) {
              return;
            }

            const availability =
              UNITS.map(
                function (unit) {
                  return getAvailability(
                    sem,
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
                function (x) {
                  return !x;
                }
              );

            if (
              statusValue ===
                "available" &&
              !hasAvailable
            ) {
              return;
            }

            if (
              statusValue === "na" &&
              !hasNA
            ) {
              return;
            }

            rows.push({
              semester: sem,
              subject: subject,
              availability:
                availability
            });
          }
        );
      }
    );

    if (!rows.length) {
      container.innerHTML =
        `
        <div class="pw-matrix-empty">
          No subjects found.
        </div>
        `;

      return;
    }

    container.innerHTML = `
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

        <tbody>

          ${rows
            .map(function (row) {
              return `
                <tr>

                  <td>
                    ${esc(row.subject)}

                    <small style="
                      display:block;
                      color:#7a8987;
                      font-weight:500;
                      margin-top:3px;
                    ">
                      ${esc(row.semester)}
                    </small>
                  </td>

                  ${row.availability
                    .map(
                      function (
                        available,
                        index
                      ) {

                        const unit =
                          UNITS[index];

                        if (available) {
                          return `
                            <td>
                              <button
                                type="button"
                                class="pw-cell available"
                                data-semester="${esc(row.semester)}"
                                data-subject="${esc(row.subject)}"
                                data-unit="${esc(unit)}">
                                🟢
                              </button>
                            </td>
                          `;
                        }

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
                    )
                    .join("")}

                </tr>
              `;
            })
            .join("")}

        </tbody>

      </table>
    `;

    container
      .querySelectorAll(
        ".pw-cell.available"
      )
      .forEach(
        function (button) {

          button.addEventListener(
            "click",
            function () {

              const semester =
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
                  semester,
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

      await loadNotes();

      createPermanentMatrix();

      createPopup();

      document.body.style.overflow =
        "hidden";

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
