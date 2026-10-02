(() => {
  'use strict';

  const URL =
    'https://qgmpwanxqytoakmnklvy.supabase.co';

  const KEY =
    'sb_publishable_qlOg73Ee92_uzX9YsaRPIA_dMQX9gub';

  const app = document.getElementById('notesApp');

  if (!app || !window.supabase) return;

  const client = window.supabase.createClient(URL, KEY);

  const esc = value =>
    String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[c]));

  const subjects = {
    '1st Semester': [
      'Human Anatomy and Physiology I',
      'Pharmaceutical Analysis I',
      'Pharmaceutics I',
      'Pharmaceutical Inorganic Chemistry',
      'Communication Skills',
      'Remedial Biology / Remedial Mathematics'
    ],

    '2nd Semester': [
      'Human Anatomy and Physiology II',
      'Pharmaceutical Organic Chemistry I',
      'Biochemistry',
      'Pathophysiology',
      'Computer Applications in Pharmacy',
      'Environmental Sciences'
    ],

    '3rd Semester': [
      'Pharmaceutical Organic Chemistry II',
      'Physical Pharmaceutics I',
      'Pharmaceutical Microbiology',
      'Pharmaceutical Engineering'
    ],

    '4th Semester': [
      'Pharmaceutical Organic Chemistry III',
      'Medicinal Chemistry I',
      'Physical Pharmaceutics II',
      'Pharmacology I',
      'Pharmacognosy and Phytochemistry I'
    ],

    '5th Semester': [
      'Medicinal Chemistry II',
      'Industrial Pharmacy I',
      'Pharmacology II',
      'Pharmacognosy and Phytochemistry II',
      'Pharmaceutical Jurisprudence'
    ],

    '6th Semester': [
      'Medicinal Chemistry III',
      'Pharmacology III',
      'Herbal Drug Technology',
      'Biopharmaceutics and Pharmacokinetics',
      'Pharmaceutical Biotechnology',
      'Quality Assurance'
    ],

    '7th Semester': [
      'Instrumental Methods of Analysis',
      'Industrial Pharmacy II',
      'Pharmacy Practice',
      'Novel Drug Delivery System'
    ],

    '8th Semester': [
      'Biostatistics and Research Methodology',
      'Social and Preventive Pharmacy',
      'Pharma Marketing Management',
      'Pharmaceutical Regulatory Science',
      'Pharmacovigilance',
      'Quality Control and Standardization of Herbals',
      'Computer Aided Drug Design',
      'Cell and Molecular Biology',
      'Cosmetic Science',
      'Experimental Pharmacology',
      'Advanced Instrumentation Techniques',
      'Dietary Supplements and Nutraceuticals',
      'Project Work'
    ]
  };

  let rows = [];

  const path =
    location.hash
      .replace(/^#/, '')
      .split('/')
      .filter(Boolean);

  let sem = decodeURIComponent(path[0] || '');
  let subj = decodeURIComponent(path[1] || '');
  let unit = decodeURIComponent(path[2] || '');

  /* =========================================================
     STYLES
  ========================================================= */

  function injectStyles() {
    if (document.getElementById('pwMatrixStyles')) return;

    const style = document.createElement('style');

    style.id = 'pwMatrixStyles';

    style.textContent = `
      .pw-matrix-wrap{
        margin:24px 0 34px;
        padding:20px;
        border:1px solid #dbe8e6;
        border-radius:20px;
        background:#fff;
        box-shadow:0 8px 28px rgba(0,0,0,.05);
      }

      .pw-matrix-head{
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:16px;
        margin-bottom:16px;
      }

      .pw-matrix-head h2{
        margin:0 0 5px;
      }

      .pw-matrix-head p{
        margin:0;
        color:#687979;
      }

      .pw-matrix-filters{
        display:grid;
        grid-template-columns:1fr 180px 160px;
        gap:10px;
        margin-bottom:16px;
      }

      .pw-matrix-filters input,
      .pw-matrix-filters select{
        width:100%;
        box-sizing:border-box;
        padding:12px 13px;
        border:1px solid #d5e3e1;
        border-radius:11px;
        background:#fff;
        font:inherit;
      }

      .pw-matrix-table-wrap{
        overflow-x:auto;
        border:1px solid #dbe8e6;
        border-radius:14px;
      }

      .pw-matrix{
        width:100%;
        min-width:760px;
        border-collapse:collapse;
      }

      .pw-matrix th{
        background:#f3f8f7;
        color:#173b39;
        font-weight:800;
        padding:13px 10px;
        border-bottom:1px solid #dbe8e6;
        white-space:nowrap;
      }

      .pw-matrix td{
        padding:10px;
        border-bottom:1px solid #edf2f1;
        text-align:center;
      }

      .pw-matrix td.subject-name{
        text-align:left;
        font-weight:700;
        min-width:250px;
      }

      .pw-unit-btn{
        width:54px;
        height:42px;
        border-radius:10px;
        border:1px solid #cbdad8;
        font-size:20px;
        cursor:pointer;
        background:#fff;
      }

      .pw-unit-btn.available{
        background:#e9f8ef;
        border-color:#86c99e;
        cursor:pointer;
      }

      .pw-unit-btn.available:hover{
        transform:translateY(-1px);
        box-shadow:0 4px 12px rgba(0,0,0,.08);
      }

      .pw-unit-btn.na{
        background:#fafafa;
        border-color:#e1e1e1;
        cursor:not-allowed;
        opacity:.9;
      }

      .pw-matrix-empty{
        padding:20px;
        text-align:center;
        color:#687979;
      }

      .pw-legend{
        display:flex;
        flex-wrap:wrap;
        gap:16px;
        margin-top:13px;
        color:#526664;
        font-size:14px;
      }

      .pw-popup-overlay{
        position:fixed;
        inset:0;
        z-index:99999;
        background:rgba(0,0,0,.42);
        display:flex;
        justify-content:flex-end;
        align-items:flex-start;
        padding:18px;
        box-sizing:border-box;
      }

      .pw-popup{
        width:min(940px,100%);
        max-height:calc(100vh - 36px);
        overflow:auto;
        background:#fff;
        border-radius:20px;
        box-shadow:0 20px 70px rgba(0,0,0,.25);
        position:relative;
        padding:22px;
      }

      .pw-popup-close{
        position:absolute;
        top:12px;
        right:12px;
        width:38px;
        height:38px;
        border:0;
        border-radius:50%;
        background:#f1f5f4;
        font-size:23px;
        cursor:pointer;
        line-height:1;
      }

      .pw-popup-title{
        padding-right:48px;
        margin-bottom:14px;
      }

      .pw-popup-title h2{
        margin:0 0 6px;
      }

      .pw-popup-title p{
        margin:0;
        color:#687979;
      }

      .pw-popup-footer{
        margin-top:18px;
        text-align:center;
        font-weight:700;
        color:#117f78;
      }

      @media(max-width:760px){
        .pw-matrix-filters{
          grid-template-columns:1fr;
        }

        .pw-matrix-wrap{
          padding:14px;
        }

        .pw-popup-overlay{
          padding:8px;
        }

        .pw-popup{
          max-height:calc(100vh - 16px);
          padding:16px;
          border-radius:16px;
        }
      }
    `;

    document.head.appendChild(style);
  }


  /* =========================================================
     URL HELPERS
  ========================================================= */

  function notesHash(semester, subject, unitValue = '') {
    const parts = [
      semester,
      subject,
      unitValue
    ].filter(Boolean);

    return `notes.html#${parts
      .map(encodeURIComponent)
      .join('/')}`;
  }


  /* =========================================================
     NORMALIZATION
  ========================================================= */

  function same(a, b) {
    return String(a || '').trim().toLowerCase() ===
           String(b || '').trim().toLowerCase();
  }

  function isCompleteUnit(value) {
    const v = String(value || '').trim().toLowerCase();

    return (
      !v ||
      v === 'all units / complete notes' ||
      v === 'complete notes'
    );
  }


  /* =========================================================
     NORMAL HIERARCHY
  ========================================================= */

  function card(href, key, title, p = '') {
    return `
      <a class="nav-card" href="${href}">
        <small>${esc(key)}</small>
        <h3>${esc(title)}</h3>
        ${p ? `<p>${esc(p)}</p>` : ''}
      </a>
    `;
  }

  function base() {
    return [
      '<a class="back" href="notes.html">← All Semesters</a>'
    ];
  }


  /* =========================================================
     MATRIX DATA
  ========================================================= */

  function isAvailable(semester, subject, unitNumber) {

    return rows.some(row => {

      if (!same(row.semester, semester)) return false;

      if (!same(row.subject, subject)) return false;

      return same(row.unit, `Unit ${unitNumber}`);
    });
  }


  function matrixRows(filterSemester = '', searchText = '', status = 'all') {

    const result = [];

    Object.entries(subjects).forEach(([semester, list]) => {

      if (
        filterSemester &&
        !same(filterSemester, semester)
      ) {
        return;
      }

      list.forEach(subject => {

        if (
          searchText &&
          !subject.toLowerCase().includes(searchText)
        ) {
          return;
        }

        const availability = [1,2,3,4,5].map(
          number => isAvailable(
            semester,
            subject,
            number
          )
        );

        if (status === 'available' &&
            !availability.some(Boolean)) {
          return;
        }

        if (status === 'na' &&
            !availability.some(v => !v)) {
          return;
        }

        result.push({
          semester,
          subject,
          availability
        });
      });
    });

    return result;
  }


  /* =========================================================
     MATRIX HTML
  ========================================================= */

  function matrixHTML() {

    return `
      <section class="pw-matrix-wrap" id="pwUnitMatrix">

        <div class="pw-matrix-head">

          <div>
            <h2>📚 B.Pharm Unit Availability</h2>

            <p>
              Check which units currently have notes available.
            </p>
          </div>

        </div>


        <div class="pw-matrix-filters">

          <input
            id="pwMatrixSearch"
            type="search"
            placeholder="Search Subject"
          >

          <select id="pwMatrixSemester">

            <option value="">
              All Semesters
            </option>

            ${Object.keys(subjects)
              .map(s =>
                `<option value="${esc(s)}">${esc(s)}</option>`
              )
              .join('')}

          </select>


          <select id="pwMatrixStatus">

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


        <div
          id="pwMatrixTable"
          class="pw-matrix-table-wrap"
        ></div>


        <div class="pw-legend">

          <span>🟢 Available</span>

          <span>🔴 NA</span>

          <span>Click 🟢 to open the exact unit</span>

        </div>

      </section>
    `;
  }


  function renderMatrixTable() {

    const table = document.getElementById(
      'pwMatrixTable'
    );

    if (!table) return;

    const search =
      (
        document.getElementById('pwMatrixSearch')
          ?.value || ''
      )
      .trim()
      .toLowerCase();

    const semester =
      document.getElementById(
        'pwMatrixSemester'
      )?.value || '';

    const status =
      document.getElementById(
        'pwMatrixStatus'
      )?.value || 'all';

    const data = matrixRows(
      semester,
      search,
      status
    );

    if (!data.length) {

      table.innerHTML = `
        <div class="pw-matrix-empty">
          No matching subjects found.
        </div>
      `;

      return;
    }

    table.innerHTML = `

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

          ${data.map(item => `

            <tr>

              <td class="subject-name">
                ${esc(item.subject)}
                <small style="display:block;color:#687979;font-weight:500;margin-top:3px">
                  ${esc(item.semester)}
                </small>
              </td>

              ${item.availability.map(
                (available, index) => {

                  const number = index + 1;

                  if (available) {

                    return `
                      <td>

                        <button
                          type="button"
                          class="pw-unit-btn available"
                          title="Open Unit ${number}"
                          data-semester="${esc(item.semester)}"
                          data-subject="${esc(item.subject)}"
                          data-unit="Unit ${number}"
                        >
                          🟢
                        </button>

                      </td>
                    `;

                  }

                  return `
                    <td>

                      <button
                        type="button"
                        class="pw-unit-btn na"
                        disabled
                        title="Not Available"
                      >
                        🔴
                      </button>

                    </td>
                  `;
                }
              ).join('')}

            </tr>

          `).join('')}

        </tbody>

      </table>
    `;

    table
      .querySelectorAll('.pw-unit-btn.available')
      .forEach(button => {

        button.addEventListener(
          'click',
          () => {

            const semester =
              button.dataset.semester;

            const subject =
              button.dataset.subject;

            const unit =
              button.dataset.unit;

            location.href =
              notesHash(
                semester,
                subject,
                unit
              );
          }
        );

      });
  }


  /* =========================================================
     MATRIX EVENTS
  ========================================================= */

  function bindMatrix() {

    document
      .getElementById('pwMatrixSearch')
      ?.addEventListener(
        'input',
        renderMatrixTable
      );

    document
      .getElementById('pwMatrixSemester')
      ?.addEventListener(
        'change',
        renderMatrixTable
      );

    document
      .getElementById('pwMatrixStatus')
      ?.addEventListener(
        'change',
        renderMatrixTable
      );

    renderMatrixTable();
  }


  /* =========================================================
     POPUP
  ========================================================= */

  function openMatrixPopup() {

    if (document.getElementById('pwMatrixPopup')) {
      return;
    }

    const overlay =
      document.createElement('div');

    overlay.id = 'pwMatrixPopup';

    overlay.className =
      'pw-popup-overlay';

    overlay.innerHTML = `

      <div
        class="pw-popup"
        role="dialog"
        aria-modal="true"
        aria-label="B.Pharm Unit Availability"
      >

        <button
          type="button"
          class="pw-popup-close"
          id="pwPopupClose"
          aria-label="Close"
        >
          ×
        </button>

        <div class="pw-popup-title">

          <h2>📚 B.Pharm Notes Availability</h2>

          <p>
            Check available units before opening your notes.
          </p>

        </div>

        <div id="pwPopupMatrix"></div>

        <div class="pw-popup-footer">
          Thank You 🥰 Please Share 😊
        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    const popupMatrix =
      document.getElementById(
        'pwPopupMatrix'
      );

    popupMatrix.innerHTML =
      matrixHTML();

    bindMatrixInside(
      popupMatrix
    );

    document
      .getElementById('pwPopupClose')
      ?.addEventListener(
        'click',
        () => overlay.remove()
      );

    overlay.addEventListener(
      'click',
      event => {

        if (event.target === overlay) {
          overlay.remove();
        }

      }
    );
  }


  function bindMatrixInside(container) {

    const table =
      container.querySelector(
        '#pwMatrixTable'
      );

    const search =
      container.querySelector(
        '#pwMatrixSearch'
      );

    const semester =
      container.querySelector(
        '#pwMatrixSemester'
      );

    const status =
      container.querySelector(
        '#pwMatrixStatus'
      );

    function renderPopupTable() {

      const searchText =
        (search?.value || '')
          .trim()
          .toLowerCase();

      const semesterValue =
        semester?.value || '';

      const statusValue =
        status?.value || 'all';

      const data =
        matrixRows(
          semesterValue,
          searchText,
          statusValue
        );

      if (!data.length) {

        table.innerHTML = `
          <div class="pw-matrix-empty">
            No matching subjects found.
          </div>
        `;

        return;
      }

      table.innerHTML = `

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

            ${data.map(item => `

              <tr>

                <td class="subject-name">
                  ${esc(item.subject)}
                  <small style="display:block;color:#687979;font-weight:500;margin-top:3px">
                    ${esc(item.semester)}
                  </small>
                </td>

                ${item.availability.map(
                  (available, index) => {

                    const number =
                      index + 1;

                    return `

                      <td>

                        ${
                          available

                          ? `
                            <button
                              type="button"
                              class="pw-unit-btn available"
                              data-semester="${esc(item.semester)}"
                              data-subject="${esc(item.subject)}"
                              data-unit="Unit ${number}"
                            >
                              🟢
                            </button>
                          `

                          : `
                            <button
                              type="button"
                              class="pw-unit-btn na"
                              disabled
                            >
                              🔴
                            </button>
                          `
                        }

                      </td>

                    `;
                  }
                ).join('')}

              </tr>

            `).join('')}

          </tbody>

        </table>
      `;

      table
        .querySelectorAll(
          '.pw-unit-btn.available'
        )
        .forEach(button => {

          button.addEventListener(
            'click',
            () => {

              const semester =
                button.dataset.semester;

                  const subject =
              button.dataset.subject;

            const unit =
              button.dataset.unit;

            location.href =
              notesHash(
                semester,
                subject,
                unit
              );

          }
        );

      });
  }


  /* =========================================================
     POPUP
  ========================================================= */

  function openMatrixPopup() {

    if (document.getElementById('pwMatrixPopup')) {
      return;
    }

    const overlay =
      document.createElement('div');

    overlay.id = 'pwMatrixPopup';

    overlay.className =
      'pw-popup-overlay';

    overlay.innerHTML = `

      <div
        class="pw-popup"
        role="dialog"
        aria-modal="true"
        aria-label="B.Pharm Unit Availability"
      >

        <button
          type="button"
          class="pw-popup-close"
          id="pwPopupClose"
          aria-label="Close"
        >
          ×
        </button>

        <div class="pw-popup-title">

          <h2>📚 B.Pharm Notes Availability</h2>

          <p>
            Check available units before opening your notes.
          </p>

        </div>

        <div id="pwPopupMatrix"></div>

        <div class="pw-popup-footer">
          Thank You 🥰 Please Share 😊
        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    const popupMatrix =
      document.getElementById(
        'pwPopupMatrix'
      );

    popupMatrix.innerHTML =
      matrixHTML();

    bindMatrixInside(
      popupMatrix
    );

    document
      .getElementById('pwPopupClose')
      ?.addEventListener(
        'click',
        () => overlay.remove()
      );

    overlay.addEventListener(
      'click',
      event => {

        if (event.target === overlay) {
          overlay.remove();
        }

      }
    );
  }


  function bindMatrixInside(container) {

    const table =
      container.querySelector(
        '#pwMatrixTable'
      );

    const search =
      container.querySelector(
        '#pwMatrixSearch'
      );

    const semester =
      container.querySelector(
        '#pwMatrixSemester'
      );

    const status =
      container.querySelector(
        '#pwMatrixStatus'
      );

    function renderPopupTable() {

      const searchText =
        (search?.value || '')
          .trim()
          .toLowerCase();

      const semesterValue =
        semester?.value || '';

      const statusValue =
        status?.value || 'all';

      const data =
        matrixRows(
          semesterValue,
          searchText,
          statusValue
        );

      if (!data.length) {

        table.innerHTML = `
          <div class="pw-matrix-empty">
            No matching subjects found.
          </div>
        `;

        return;
      }

      table.innerHTML = `

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

            ${data.map(item => `

              <tr>

                <td class="subject-name">
                  ${esc(item.subject)}
                  <small style="display:block;color:#687979;font-weight:500;margin-top:3px">
                    ${esc(item.semester)}
                  </small>
                </td>

                ${item.availability.map(
                  (available, index) => {

                    const number =
                      index + 1;

                    return `

                      <td>

                        ${
                          available

                          ? `
                            <button
                              type="button"
                              class="pw-unit-btn available"
                              data-semester="${esc(item.semester)}"
                              data-subject="${esc(item.subject)}"
                              data-unit="Unit ${number}"
                            >
                              🟢
                            </button>
                          `

                          : `
                            <button
                              type="button"
                              class="pw-unit-btn na"
                              disabled
                            >
                              🔴
                            </button>
                          `
                        }

                      </td>

                    `;
                  }
                ).join('')}

              </tr>

            `).join('')}

          </tbody>

        </table>
      `;

      table
        .querySelectorAll(
          '.pw-unit-btn.available'
        )
        .forEach(button => {

          button.addEventListener(
            'click',
            () => {

              const semester =
                button.dataset.semester;

              const subject =
                button.dataset.subject;

              const unit =
                button.dataset.unit;

              location.href =
                notesHash(
                  semester,
                  subject,
                  unit
                );

            }
          );

        });
    }

    search?.addEventListener(
      'input',
      renderPopupTable
    );

    semester?.addEventListener(
      'change',
      renderPopupTable
    );

    status?.addEventListener(
      'change',
      renderPopupTable
    );

    renderPopupTable();
  }


  /* =========================================================
     MAIN RENDER
  ========================================================= */

  function render() {

    let html = [];

    html.push(
      matrixHTML()
    );

    html.push(
      ...base()
    );


    /* -------------------------
       SEMESTERS
    ------------------------- */

    if (!sem) {

      html.push(
        '<div class="semester-grid">'
      );

      for (let i = 1; i <= 8; i++) {

        const s =
          `${i}${
            i === 1
              ? 'st'
              : i === 2
              ? 'nd'
              : i === 3
              ? 'rd'
              : 'th'
          } Semester`;

        const count =
          rows.filter(
            r =>
              same(
                r.semester,
                s
              )
          ).length;

        html.push(
          card(
            `notes.html#${encodeURIComponent(s)}`,
            'SEMESTER',
            s,
            `${count} resource${
              count === 1
                ? ''
                : 's'
            }`
          )
        );
      }

      html.push(
        '</div>'
      );

      app.innerHTML =
        html.join('');

      bindMatrix();

      return;
    }


    /* -------------------------
       SUBJECTS
    ------------------------- */

    const semRows =
      rows.filter(
        r =>
          same(
            r.semester,
            sem
          )
      );

    if (!subj) {

      html.push(
        `<div class="crumb">
          ${esc(sem)}
        </div>`
      );

      html.push(
        '<div class="subject-grid">'
      );

      (subjects[sem] || [])
        .forEach(subject => {

          const count =
            semRows.filter(
              r =>
                same(
                  r.subject,
                  subject
                )
            ).length;

          html.push(
            card(
              notesHash(
                sem,
                subject
              ),
              'SUBJECT',
              subject,
              `${count} resource${
                count === 1
                  ? ''
                  : 's'
              }`
            )
          );

        });

      html.push(
        '</div>'
      );

      app.innerHTML =
        html.join('');

      bindMatrix();

      return;
    }


    /* -------------------------
       UNITS
    ------------------------- */

    const subRows =
      semRows.filter(
        r =>
          same(
            r.subject,
            subj
          )
      );

    if (!unit) {

      html.push(
        `<div class="crumb">
          ${esc(sem)} / ${esc(subj)}
        </div>`
      );

      html.push(
        '<div class="unit-grid">'
      );

      for (let i = 1; i <= 5; i++) {

        const u =
          `Unit ${i}`;

        const count =
          subRows.filter(
            r =>
              same(
                r.unit,
                u
              )
          ).length;

        if (count) {

          html.push(
            card(
              notesHash(
                sem,
                subj,
                u
              ),
              'UNIT',
              u,
              `${count} note${
                count === 1
                  ? ''
                  : 's'
              }`
            )
          );

        }

      }


      const complete =
        subRows.filter(
          r =>
            isCompleteUnit(
              r.unit
            )
        );

      if (complete.length) {

        html.push(
          card(
            notesHash(
              sem,
              subj,
              'All Units / Complete Notes'
            ),
            'RESOURCE',
            'Complete Notes',
            `${complete.length} resource${
              complete.length === 1
                ? ''
                : 's'
            }`
          )
        );

      }

      html.push(
        '</div>'
      );

      app.innerHTML =
        html.join('');

      bindMatrix();

      return;
    }


    /* -------------------------
       PDF RESOURCES
    ------------------------- */

    const selected =
      subRows.filter(
        r => {

          if (
            same(
              r.unit,
              unit
            )
          ) {
            return true;
          }

          return (
            unit ===
              'All Units / Complete Notes' &&
            isCompleteUnit(
              r.unit
            )
          );

        }
      );

    html.push(
      `<div class="crumb">
        ${esc(sem)} /
        ${esc(subj)} /
        ${esc(unit)}
      </div>`
    );


    if (!selected.length) {

      html.push(
        '<p class="muted">No notes uploaded for this unit yet.</p>'
      );

    }


    selected.forEach(r => {

      html.push(`

        <article class="resource-card">

          <div>

            <small>
              ${esc(
                r.unit ||
                'Complete Notes'
              )}
            </small>

            <h3>
              ${esc(
                r.title
              )}
            </h3>

            <p>
              ${esc(
                r.description ||
                'B.Pharm study resource.'
              )}
            </p>

          </div>

          <a
            class="resource-btn"
            href="${esc(r.pdf_url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            View PDF →
          </a>

        </article>

      `);

    });


    app.innerHTML =
      html.join('');

    bindMatrix();
  }


  /* =========================================================
     LOAD NOTES
  ========================================================= */

  async function load() {

    injectStyles();

    const {
      data,
      error
    } = await client
      .from('notes')
      .select('*')
      .order(
        'created_at',
        {
          ascending: false
        }
      );

    if (error) {

      app.innerHTML = `

        <p class="message error">
          Notes load nahi ho paaye:
          ${esc(error.message)}
        </p>

      `;

      return;
    }

    rows = data || [];

    render();

    setTimeout(
      openMatrixPopup,
      350
    );
  }


  /* =========================================================
     HASH NAVIGATION
  ========================================================= */

  window.addEventListener(
    'hashchange',
    () => {

      const newPath =
        location.hash
          .replace(/^#/,'')
          .split('/')
          .filter(Boolean);

      sem =
        decodeURIComponent(
          newPath[0] || ''
        );

      subj =
        decodeURIComponent(
          newPath[1] || ''
        );

      unit =
        decodeURIComponent(
          newPath[2] || ''
        );

      render();
    }
  );


  load();

})();
