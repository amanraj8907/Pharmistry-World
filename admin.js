(() => {
  'use strict';

  /* =========================================================
     PHARMISTRY WORLD — ADMIN
     PDF COMPRESSION + WATERMARK + COPYRIGHT + PREVIEW
  ========================================================= */

  const SUPABASE_URL =
    'https://qgmpwanxqytoakmnklvy.supabase.co';

  const SUPABASE_KEY =
    'sb_publishable_qlOg73Ee92_uzX9YsaRPIA_dMQX9gub';

  const BUCKET = 'B. Pharm Notes';

  const LOGO_URL =
    './pharmistry-watermark.png';

  const PDFJS_URL =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';

  const PDFJS_WORKER =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const JSPDF_URL =
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

  const $ = id => document.getElementById(id);

  let client = null;

  let notePreparedPdf = null;
  let industryPreparedPdf = null;

  const SUBJECTS = {
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


  /* =========================================================
     HELPERS
  ========================================================= */

  const esc = value =>
    String(value ?? '').replace(
      /[&<>"']/g,
      c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[c])
    );


  function message(
    element,
    text,
    success = false
  ) {
    if (!element) return;

    element.textContent =
      text || '';

    element.className =
      'message ' +
      (success ? 'ok' : 'error');
  }


  function formatBytes(bytes) {

    if (!bytes || bytes <= 0) {
      return '0 B';
    }

    const units = [
      'B',
      'KB',
      'MB',
      'GB'
    ];

    const i = Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );

    return (
      (
        bytes /
        Math.pow(1024, i)
      ).toFixed(
        i === 0 ? 0 : 2
      ) +
      ' ' +
      units[i]
    );
  }


  function reductionPercent(
    original,
    converted
  ) {
    if (!original) return 0;

    return (
      (
        (original - converted) /
        original
      ) * 100
    );
  }


  function safeName(name) {

    return String(name || 'file')
      .replace(
        /\.pdf$/i,
        ''
      )
      .replace(
        /[^a-zA-Z0-9_-]+/g,
        '-'
      )
      .replace(
        /^-+|-+$/g,
        ''
      )
      .slice(
        0,
        80
      ) || 'file';
  }


  function publicPath(url) {

    try {

      if (!url) return null;

      const encoded =
        `/storage/v1/object/public/${encodeURIComponent(BUCKET)}/`;

      if (url.includes(encoded)) {

        return decodeURIComponent(
          url.split(encoded)[1]
        );
      }

      const raw =
        `/storage/v1/object/public/${BUCKET}/`;

      if (url.includes(raw)) {

        return decodeURIComponent(
          url.split(raw)[1]
        );
      }

    } catch (_) {}

    return null;
  }


  /* =========================================================
     EXTERNAL LIBRARIES
  ========================================================= */

  function loadScript(src) {

    return new Promise(
      (resolve, reject) => {

        const old =
          document.querySelector(
            `script[src="${src}"]`
          );

        if (old) {

          if (
            old.dataset.loaded === 'yes'
          ) {
            resolve();
            return;
          }

          old.addEventListener(
            'load',
            resolve,
            { once: true }
          );

          old.addEventListener(
            'error',
            reject,
            { once: true }
          );

          return;
        }

        const script =
          document.createElement(
            'script'
          );

        script.src = src;

        script.onload = () => {

          script.dataset.loaded =
            'yes';

          resolve();
        };

        script.onerror = () =>
          reject(
            new Error(
              'Required PDF library could not be loaded.'
            )
          );

        document.head.appendChild(
          script
        );
      }
    );
  }


  async function loadPdfJs() {

    await loadScript(
      PDFJS_URL
    );

    if (!window.pdfjsLib) {
      throw new Error(
        'PDF.js could not be loaded.'
      );
    }

    window.pdfjsLib
      .GlobalWorkerOptions
      .workerSrc =
      PDFJS_WORKER;

    return window.pdfjsLib;
  }


  async function loadJsPdf() {

    await loadScript(
      JSPDF_URL
    );

    if (
      !window.jspdf ||
      !window.jspdf.jsPDF
    ) {
      throw new Error(
        'jsPDF could not be loaded.'
      );
    }

    return window.jspdf.jsPDF;
  }


  /* =========================================================
     LOGO
  ========================================================= */

  let logoPromise = null;

  function getLogo() {

    if (logoPromise) {
      return logoPromise;
    }

    logoPromise =
      new Promise(
        (resolve, reject) => {

          const img =
            new Image();

          img.crossOrigin =
            'anonymous';

          img.onload =
            () => resolve(img);

          img.onerror =
            () =>
              reject(
                new Error(
                  'Pharmistry World logo not found. Upload pharmistry-watermark.png to the repository root.'
                )
              );

          img.src =
            LOGO_URL +
            '?v=20261002';
        }
      );

    return logoPromise;
  }


  /* =========================================================
     AUTH
  ========================================================= */

  async function isAdmin(uid) {

    const {
      data,
      error
    } =
      await client
        .from('admin_users')
        .select('user_id')
        .eq(
          'user_id',
          uid
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    return !!data;
  }


  async function showSession() {

    try {

      const {
        data,
        error
      } =
        await client.auth.getSession();

      if (error) {
        throw error;
      }

      const session =
        data.session;

      if (!session) {

        $('loginView')
          ?.classList
          .remove('hidden');

        $('adminView')
          ?.classList
          .add('hidden');

        return;
      }

      const admin =
        await isAdmin(
          session.user.id
        );

      if (!admin) {

        await client.auth.signOut();

        $('loginView')
          ?.classList
          .remove('hidden');

        $('adminView')
          ?.classList
          .add('hidden');

        message(
          $('loginMsg'),
          'This account is not authorized as an admin.'
        );

        return;
      }

      if ($('userEmail')) {

        $('userEmail')
          .textContent =
          session.user.email || '';
      }

      $('loginView')
        ?.classList
        .add('hidden');

      $('adminView')
        ?.classList
        .remove('hidden');

      await loadNotes();
      await loadIndustry();

      if ($('contactList')) {
        await loadContactMessages();
      }

    } catch (error) {

      console.error(error);

      message(
        $('loginMsg'),
        error.message ||
        'Session check failed.'
      );
    }
  }


  async function login(event) {

    event.preventDefault();

    message(
      $('loginMsg'),
      'Signing in…',
      true
    );

    try {

      const email =
        $('email')
          ?.value
          .trim();

      const password =
        $('password')
          ?.value;

      if (!email || !password) {

        throw new Error(
          'Email and password are required.'
        );
      }

      const {
        error
      } =
        await client.auth
          .signInWithPassword({
            email,
            password
          });

      if (error) {
        throw error;
      }

      await showSession();

    } catch (error) {

      console.error(error);

      message(
        $('loginMsg'),
        error.message ||
        'Sign-in failed.'
      );
    }
  }


  async function logout() {

    await client.auth.signOut();

    await showSession();
  }


  /* =========================================================
     PROCESSOR CSS
  ========================================================= */

  function addProcessorStyles() {

    if (
      $('pwProcessorStyles')
    ) {
      return;
    }

    const style =
      document.createElement(
        'style'
      );

    style.id =
      'pwProcessorStyles';

    style.textContent = `

      .pw-tools {
        grid-column: 1 / -1;
        padding: 18px;
        margin-top: 5px;
        border: 1px solid rgba(0,0,0,.12);
        border-radius: 14px;
        background: rgba(0,0,0,.025);
      }

      .pw-tools h3 {
        margin: 0 0 6px;
      }

      .pw-tools p {
        margin: 5px 0;
      }

      .pw-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: end;
        margin-top: 14px;
      }

      .pw-controls label {
        min-width: 130px;
      }

      .pw-result {
        margin-top: 15px;
        padding: 14px;
        border-radius: 12px;
        background: rgba(0,0,0,.045);
      }

      .pw-stats {
        display: grid;
        grid-template-columns:
          repeat(auto-fit,minmax(140px,1fr));
        gap: 10px;
      }

      .pw-stat {
        background: #fff;
        padding: 11px;
        border-radius: 10px;
      }

      .pw-stat strong {
        display: block;
        margin-top: 4px;
        font-size: 17px;
      }

      .pw-preview {
        width: 100%;
        height: 520px;
        margin-top: 14px;
        border: 1px solid rgba(0,0,0,.12);
        border-radius: 12px;
        background: #eee;
      }

      .pw-hidden {
        display: none !important;
      }

      .pw-ok {
        color: #18733d;
      }

      .pw-warning {
        color: #9a6700;
      }

    `;

    document.head.appendChild(
      style
    );
  }


  /* =========================================================
     PROCESSOR UI
  ========================================================= */

  function addProcessor(
    type
  ) {

    const industry =
      type === 'industry';

    const input =
      $(
        industry
          ? 'industryPdf'
          : 'pdf'
      );

    if (!input) {
      return;
    }

    const existing =
      $(
        industry
          ? 'industryPdfTools'
          : 'notesPdfTools'
      );

    if (existing) {
      return;
    }

    addProcessorStyles();

    const box =
      document.createElement(
        'div'
      );

    box.id =
      industry
        ? 'industryPdfTools'
        : 'notesPdfTools';

    box.className =
      'pw-tools';

    box.innerHTML = `

      <h3>
        PDF Compression & Branding
      </h3>

      <p>
        Select a target compression percentage,
        then convert and preview the final PDF.
      </p>

      <div class="pw-controls">

        <label>
          Compression

          <select class="pw-percent">

            <option value="10">10%</option>
            <option value="20">20%</option>
            <option value="30">30%</option>
            <option value="40" selected>40%</option>
            <option value="50">50%</option>
            <option value="60">60%</option>
            <option value="70">70%</option>

          </select>
        </label>

        <button
          type="button"
          class="btn primary pw-convert"
        >
          Convert & Prepare PDF
        </button>

        <button
          type="button"
          class="btn pw-preview-btn pw-hidden"
        >
          Preview Converted PDF
        </button>

      </div>

      <div class="pw-result pw-hidden">

        <div class="pw-stats">

          <div class="pw-stat">
            Original
            <strong class="pw-original">—</strong>
          </div>

          <div class="pw-stat">
            Converted
            <strong class="pw-converted">—</strong>
          </div>

          <div class="pw-stat">
            Actual reduction
            <strong class="pw-reduction">—</strong>
          </div>

        </div>

        <p class="pw-status"></p>

      </div>

      <iframe
        class="pw-preview pw-hidden"
        title="Converted PDF preview"
      ></iframe>

    `;

    input
      .closest('label')
      ?.insertAdjacentElement(
        'afterend',
        box
      );


    const convertButton =
      box.querySelector(
        '.pw-convert'
      );

    const previewButton =
      box.querySelector(
        '.pw-preview-btn'
      );

    const percentSelect =
      box.querySelector(
        '.pw-percent'
      );

    const result =
      box.querySelector(
        '.pw-result'
      );

    const iframe =
      box.querySelector(
        '.pw-preview'
      );

    const status =
      box.querySelector(
        '.pw-status'
      );


    input.addEventListener(
      'change',
      () => {

        if (industry) {
          industryPreparedPdf =
            null;
        } else {
          notePreparedPdf =
            null;
        }

        result.classList.add(
          'pw-hidden'
        );

        previewButton.classList.add(
          'pw-hidden'
        );

        iframe.classList.add(
          'pw-hidden'
        );

        iframe.src =
          'about:blank';

        status.textContent =
          '';
      }
    );


    convertButton.addEventListener(
      'click',
      async () => {

        const file =
          input.files[0];

        if (!file) {

          message(
            industry
              ? $('industryMsg')
              : $('uploadMsg'),
            'Choose a PDF first.'
          );

          return;
        }

        if (
          file.size >
          25 * 1024 * 1024
        ) {

          message(
            industry
              ? $('industryMsg')
              : $('uploadMsg'),
            'PDF must be 25 MB or smaller.'
          );

          return;
        }

        convertButton.disabled =
          true;

        previewButton.disabled =
          true;

        status.textContent =
          'Converting PDF and adding branding…';

        message(
          industry
            ? $('industryMsg')
            : $('uploadMsg'),
          'Processing PDF…',
          true
        );

        try {

          const target =
            Number(
              percentSelect.value
            );

          const prepared =
            await processPdf(
              file,
              target
            );

          if (industry) {
            industryPreparedPdf =
              prepared;
          } else {
            notePreparedPdf =
              prepared;
          }

          const actual =
            reductionPercent(
              file.size,
              prepared.size
            );

          result.classList.remove(
            'pw-hidden'
          );

          box.querySelector(
            '.pw-original'
          ).textContent =
            formatBytes(
              file.size
            );

          box.querySelector(
            '.pw-converted'
          ).textContent =
            formatBytes(
              prepared.size
            );

          box.querySelector(
            '.pw-reduction'
          ).textContent =
            actual.toFixed(1) +
            '%';

          status.textContent =
            `Target: ${target}% • Actual: ${actual.toFixed(1)}%`;

          status.className =
            actual >= target
              ? 'pw-status pw-ok'
              : 'pw-status pw-warning';


          previewButton.classList.remove(
            'pw-hidden'
          );

          previewButton.disabled =
            false;


          previewButton.onclick =
  async () => {

    previewButton.disabled = true;

    previewButton.textContent =
      'Opening Preview…';

    try {

      const pdfjs =
        await loadPdfJs();

      const buffer =
        await prepared.arrayBuffer();

      const pdf =
        await pdfjs
          .getDocument({
            data:
              new Uint8Array(buffer)
          })
          .promise;

      /* Remove old preview */
      const oldPreview =
        box.querySelector(
          '.pw-pages-preview'
        );

      if (oldPreview) {
        oldPreview.remove();
      }

      /* Create preview container */
      const previewBox =
        document.createElement('div');

      previewBox.className =
        'pw-pages-preview';

      previewBox.style.marginTop =
        '14px';

      previewBox.style.maxHeight =
        '700px';

      previewBox.style.overflowY =
        'auto';

      previewBox.style.padding =
        '10px';

      previewBox.style.background =
        '#eee';

      previewBox.style.borderRadius =
        '12px';

      /* Show maximum 10 pages */
      const pageCount =
        Math.min(
          pdf.numPages,
          10
        );

      for (
        let pageNo = 1;
        pageNo <= pageCount;
        pageNo++
      ) {

        const page =
          await pdf.getPage(
            pageNo
          );

        const viewport =
          page.getViewport({
            scale: 1.15
          });

        const canvas =
          document.createElement(
            'canvas'
          );

        const context =
          canvas.getContext(
            '2d'
          );

        canvas.width =
          viewport.width;

        canvas.height =
          viewport.height;

        canvas.style.width =
          '100%';

        canvas.style.height =
          'auto';

        canvas.style.display =
          'block';

        canvas.style.background =
          '#fff';

        canvas.style.marginBottom =
          '12px';

        canvas.style.borderRadius =
          '6px';

        canvas.style.boxShadow =
          '0 1px 5px rgb
