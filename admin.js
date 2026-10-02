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
          '0 1px 5px rgba(0,0,0,.15)';

        previewBox.appendChild(
          canvas
        );

        await page.render({
          canvasContext:
            context,
          viewport:
            viewport
        }).promise;
      }

      if (
        pdf.numPages > 10
      ) {

        const more =
          document.createElement(
            'p'
          );

        more.textContent =
          `Showing first 10 of ${pdf.numPages} pages.`;

        more.style.textAlign =
          'center';

        more.style.fontWeight =
          '600';

        more.style.margin =
          '10px';

        previewBox.appendChild(
          more
        );
      }

      iframe.replaceWith(
        previewBox
      );

      previewButton.textContent =
        'Preview Opened';

    } catch (error) {

      console.error(error);

      alert(
        'Preview open nahi ho paaya: ' +
        error.message
      );

      previewButton.textContent =
        'Preview Converted PDF';

    } finally {

      previewButton.disabled =
        false;

    }

  };


          message(
            industry
              ? $('industryMsg')
              : $('uploadMsg'),
            'PDF converted successfully. Preview it before publishing.',
            true
          );

        } catch (error) {

          console.error(error);

          status.textContent =
            error.message ||
            'PDF conversion failed.';

          message(
            industry
              ? $('industryMsg')
              : $('uploadMsg'),
            error.message ||
            'PDF conversion failed.'
          );

        } finally {

          convertButton.disabled =
            false;
        }

      }
    );
  }


  /* =========================================================
     PDF PROCESSING
  ========================================================= */

  async function processPdf(
    file,
    targetReduction
  ) {

    const pdfjs =
      await loadPdfJs();

    const jsPDF =
      await loadJsPdf();

    const logo =
      await getLogo();

    const buffer =
      await file.arrayBuffer();

    const pdf =
      await pdfjs
        .getDocument({
          data:
            new Uint8Array(
              buffer
            )
        })
        .promise;

    const firstPage =
      await pdf.getPage(1);

    const firstViewport =
      firstPage.getViewport({
        scale: 1
      });

    const width =
      firstViewport.width;

    const height =
      firstViewport.height;

    const orientation =
      width > height
        ? 'landscape'
        : 'portrait';

    const doc =
      new jsPDF({
        orientation,
        unit: 'pt',
        format: [
          width,
          height
        ],
        compress: true
      });


        /*
  FAST PDF PROCESSING
  Optimized for mobile browsers.
*/

const scale =
  targetReduction >= 70
    ? 0.85
    : targetReduction >= 60
      ? 0.90
      : targetReduction >= 50
        ? 0.95
        : targetReduction >= 40
          ? 1.00
          : targetReduction >= 30
            ? 1.05
            : 1.10;

const quality =
  targetReduction >= 70
    ? 0.50
    : targetReduction >= 60
      ? 0.56
      : targetReduction >= 50
        ? 0.62
        : targetReduction >= 40
          ? 0.68
          : targetReduction >= 30
            ? 0.74
            : 0.80;

    for (
      let pageNo = 1;
      pageNo <= pdf.numPages;
      pageNo++
    ) {

      const page =
        await pdf.getPage(pageNo);

      const viewport =
        page.getViewport({
          scale
        });

      const canvas =
        document.createElement('canvas');

      canvas.width =
        Math.ceil(viewport.width);

      canvas.height =
        Math.ceil(viewport.height);

      const ctx =
        canvas.getContext('2d', {
          alpha: false
        });

      ctx.fillStyle = '#ffffff';

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      await page.render({
        canvasContext: ctx,
        viewport
      }).promise;


      /* ==============================
         LIGHT PHARMISTRY WORLD WATERMARK
      ============================== */

      ctx.save();

      ctx.globalAlpha = 0.15;

      const watermarkWidth =
        canvas.width * 0.46;

      const watermarkHeight =
        watermarkWidth *
        (
          logo.naturalHeight /
          logo.naturalWidth
        );

      ctx.drawImage(
  logo,
  (canvas.width - watermarkWidth) / 2,
  (canvas.height - watermarkHeight) / 2,
  watermarkWidth,
  watermarkHeight
);

      ctx.restore();


      /* ==============================
   COPYRIGHT HEADER
============================== */

ctx.save();

ctx.globalAlpha = 1;

ctx.fillStyle = '#d00000';

ctx.font =
  `bold ${Math.max(
    16,
    canvas.width * 0.009
  )}px Arial`;

ctx.textAlign = 'center';

ctx.textBaseline = 'top';

ctx.fillText(
  '© Pharmistry World — All Rights Reserved.',
  canvas.width / 2,
  12
);

ctx.restore();


      /* ==============================
         JPEG COMPRESSION
      ============================== */

      const image =
        canvas.toDataURL(
          'image/jpeg',
          quality
        );


      if (pageNo > 1) {

        doc.addPage(
          [width, height],
          orientation
        );
      }


      doc.addImage(
        image,
        'JPEG',
        0,
        0,
        width,
        height,
        undefined,
        'FAST'
      );
    }


    /* ==============================
       CREATE FINAL PDF
    ============================== */

    const blob =
      doc.output('blob');

    return new File(
      [blob],
      safeName(file.name) +
      '-pharmistry.pdf',
      {
        type: 'application/pdf'
      }
    );
  }


  /* =========================================================
     STORAGE UPLOAD
  ========================================================= */

  async function uploadFile(
    file,
    folder
  ) {

    const path =
      `${folder}/${Date.now()}-${safeName(file.name)}.pdf`;

    const {
      error
    } =
      await client.storage
        .from(BUCKET)
        .upload(
          path,
          file,
          {
            contentType: 'application/pdf',
            cacheControl: '3600',
            upsert: false
          }
        );

    if (error) {
      throw error;
    }

    return {
      path,
      url:
        client.storage
          .from(BUCKET)
          .getPublicUrl(path)
          .data
          .publicUrl
    };
  }


  /* =========================================================
     SUBJECTS / UNITS
  ========================================================= */

  function populateSubjects() {

    const semester =
      $('semester')?.value;

    const subject =
      $('subject');

    const unit =
      $('unit');

    if (!subject || !unit) {
      return;
    }

    subject.innerHTML =
      '<option value="">Select subject</option>';

    unit.innerHTML =
      '<option value="">Select subject first</option>';

    subject.disabled =
      !semester;

    unit.disabled = true;

    if (semester) {

      (
        SUBJECTS[semester] || []
      ).forEach(item => {

        subject.insertAdjacentHTML(
          'beforeend',
          `<option>${esc(item)}</option>`
        );

      });
    }
  }


  function populateUnits() {

    const subject =
      $('subject')?.value;

    const unit =
      $('unit');

    if (!unit) {
      return;
    }

    unit.innerHTML =
      '<option value="">Select unit</option>';

    unit.disabled =
      !subject;

    if (subject) {

      for (
        let i = 1;
        i <= 5;
        i++
      ) {

        unit.insertAdjacentHTML(
          'beforeend',
          `<option>Unit ${i}</option>`
        );
      }

      unit.insertAdjacentHTML(
        'beforeend',
        '<option>All Units / Complete Notes</option>'
      );
    }
  }


  /* =========================================================
     B.PHARM NOTES UPLOAD
  ========================================================= */

  async function uploadNote(event) {

    event.preventDefault();

    if (!notePreparedPdf) {

      return message(
        $('uploadMsg'),
        'Please convert the PDF first.'
      );
    }

    if (
      notePreparedPdf.size >
      25 * 1024 * 1024
    ) {

      return message(
        $('uploadMsg'),
        'Converted PDF must be 25 MB or smaller.'
      );
    }

    message(
      $('uploadMsg'),
      'Uploading processed PDF…',
      true
    );

    let path = null;

    try {

      const result =
        await uploadFile(
          notePreparedPdf,
          'notes'
        );

      path = result.path;

      const {
        error
      } =
        await client
          .from('notes')
          .insert({

            title:
              $('title')
                .value
                .trim(),

            semester:
              $('semester')
                .value,

            subject:
              $('subject')
                .value
                .trim(),

            unit:
              $('unit')
                .value,

            description:
              $('description')
                .value
                .trim(),

            pdf_url:
              result.url
          });

      if (error) {
        throw error;
      }

      $('uploadForm').reset();

      notePreparedPdf = null;

      populateSubjects();

      if ($('fileName')) {

        $('fileName')
          .textContent =
          'No file selected';
      }

      resetProcessor(
        'notesPdfTools'
      );

      message(
        $('uploadMsg'),
        'Note published successfully.',
        true
      );

      await loadNotes();

    } catch (error) {

      if (path) {

        await client.storage
          .from(BUCKET)
          .remove([path]);
      }

      console.error(error);

      message(
        $('uploadMsg'),
        error.message ||
        'Upload failed.'
      );
    }
  }


  /* =========================================================
     LOAD NOTES
  ========================================================= */

  async function loadNotes() {

    const box =
      $('notesList');

    if (!box) {
      return;
    }

    box.innerHTML =
      '<p class="muted">Loading…</p>';

    const {
      data,
      error
    } =
      await client
        .from('notes')
        .select('*')
        .order(
          'created_at',
          {
            ascending: false
          }
        );

    if (error) {

      box.innerHTML =
        `<p class="message error">${esc(error.message)}</p>`;

      return;
    }

    if (!data?.length) {

      box.innerHTML =
        '<p class="muted">No notes published yet.</p>';

      return;
    }

    box.innerHTML =
      data.map(note => `

        <article class="note-row">

          <div>

            <span class="badge">
              ${esc(note.semester)}
            </span>

            <h3>
              ${esc(note.title)}
            </h3>

            <p>

              <strong>
                ${esc(note.subject)}
              </strong>

              ${
                note.unit
                  ? ' · ' + esc(note.unit)
                  : ''
              }

              ${
                note.description
                  ? ' · ' +
                    esc(note.description)
                  : ''
              }

            </p>

          </div>

          <div class="row-actions">

            <a
              class="btn"
              href="${esc(note.pdf_url)}"
              target="_blank"
              rel="noopener"
            >
              View
            </a>

            <button
              class="btn danger"
              data-del="${esc(note.id)}"
              data-url="${esc(note.pdf_url)}"
            >
              Delete
            </button>

          </div>

        </article>

      `).join('');

    box
      .querySelectorAll('[data-del]')
      .forEach(button => {

        button.onclick =
          () =>
            deleteNote(
              button.dataset.del,
              button.dataset.url
            );

      });
  }


  async function deleteNote(
    id,
    url
  ) {

    if (
      !confirm(
        'Delete this note?'
      )
    ) {
      return;
    }

    try {

      const path =
        publicPath(url);

      if (path) {

        await client.storage
          .from(BUCKET)
          .remove([path]);
      }

      const {
        error
      } =
        await client
          .from('notes')
          .delete()
          .eq('id', id);

      if (error) {
        throw error;
      }

      await loadNotes();

    } catch (error) {

      alert(
        error.message ||
        'Delete failed.'
      );
    }
    }  /* =========================================================
     INDUSTRY UPLOAD
  ========================================================= */

  async function uploadIndustry(event) {

    event.preventDefault();

    const originalFile =
      $('industryPdf')?.files[0];

    if (
      originalFile &&
      !industryPreparedPdf
    ) {
      return message(
        $('industryMsg'),
        'Please convert the PDF first.'
      );
    }

    if (
      industryPreparedPdf &&
      industryPreparedPdf.size >
      25 * 1024 * 1024
    ) {
      return message(
        $('industryMsg'),
        'Converted PDF must be 25 MB or smaller.'
      );
    }

    message(
      $('industryMsg'),
      'Publishing…',
      true
    );

    let path = null;

    try {

      let url = null;

      /* PDF is optional for Industry */

      if (industryPreparedPdf) {

        const result =
          await uploadFile(
            industryPreparedPdf,
            'industry'
          );

        path = result.path;
        url = result.url;
      }

      const {
        error
      } =
        await client
          .from('industry_resources')
          .insert({

            title:
              $('industryTitle')
                .value
                .trim(),

            category:
              $('industryCategory')
                .value,

            description:
              $('industryDescription')
                .value
                .trim(),

            pdf_url:
              url
          });

      if (error) {
        throw error;
      }

      $('industryForm').reset();

      industryPreparedPdf = null;

      if ($('industryFileName')) {

        $('industryFileName')
          .textContent =
          'No PDF selected';
      }

      resetProcessor(
        'industryPdfTools'
      );

      message(
        $('industryMsg'),
        'Industry resource published successfully.',
        true
      );

      await loadIndustry();

    } catch (error) {

      if (path) {

        await client.storage
          .from(BUCKET)
          .remove([path]);
      }

      console.error(error);

      message(
        $('industryMsg'),
        error.message ||
        'Publish failed.'
      );
    }
  }


  /* =========================================================
     LOAD INDUSTRY
  ========================================================= */

  async function loadIndustry() {

    const box =
      $('industryList');

    if (!box) {
      return;
    }

    box.innerHTML =
      '<p class="muted">Loading…</p>';

    const {
      data,
      error
    } =
      await client
        .from('industry_resources')
        .select('*')
        .order(
          'created_at',
          {
            ascending: false
          }
        );

        if (error) {

      box.innerHTML =
        `<p class="message error">${esc(error.message)}</p>`;

      return;
    }

    if (!data?.length) {

      box.innerHTML =
        '<p class="muted">No industry resources published yet.</p>';

      return;
    }

    box.innerHTML =
      data.map(item => `

        <article class="note-row">

          <div>

            <span class="badge">
              ${esc(item.category)}
            </span>

            <h3>
              ${esc(item.title)}
            </h3>

            <p>
              ${esc(
                item.description || ''
              )}
            </p>

          </div>

          <div class="row-actions">

            ${
              item.pdf_url
                ? `
                  <a
                    class="btn"
                    href="${esc(item.pdf_url)}"
                    target="_blank"
                    rel="noopener"
                  >
                    View PDF
                  </a>
                `
                : ''
            }

            <button
              class="btn danger"
              data-ind="${esc(item.id)}"
              data-url="${esc(
                item.pdf_url || ''
              )}"
            >
              Delete
            </button>

          </div>

        </article>

      `).join('');

    box
      .querySelectorAll('[data-ind]')
      .forEach(button => {

        button.onclick =
          () =>
            deleteIndustry(
              button.dataset.ind,
              button.dataset.url
            );

      });
  }


  /* =========================================================
     DELETE INDUSTRY
  ========================================================= */

  async function deleteIndustry(
    id,
    url
  ) {

    if (
      !confirm(
        'Delete this industry resource?'
      )
    ) {
      return;
    }

    try {

      const path =
        publicPath(url);

      if (path) {

        await client.storage
          .from(BUCKET)
          .remove([path]);
      }

      const {
        error
      } =
        await client
          .from('industry_resources')
          .delete()
          .eq('id', id);

      if (error) {
        throw error;
      }

      await loadIndustry();

    } catch (error) {

      alert(
        error.message ||
        'Delete failed.'
      );
    }
  }


  /* =========================================================
     CONTACT MESSAGES
  ========================================================= */

  async function loadContactMessages() {

    const box =
      $('contactList');

    if (!box) {
      return;
    }

    box.innerHTML =
      '<p class="muted">Loading messages…</p>';

    const {
      data,
      error
    } =
      await client
        .from('contact_messages')
        .select('*')
        .order(
          'created_at',
          {
            ascending: false
          }
        );

    if (error) {

      box.innerHTML =
        `<p class="message error">${esc(error.message)}</p>`;

      return;
    }

    if (!data?.length) {

      box.innerHTML =
        '<p class="muted">No contact messages yet.</p>';

      return;
    }

    box.innerHTML =
      data.map(item => `

        <article class="note-row">

          <div>

            <span class="badge">
              ${esc(
                item.subject ||
                'General'
              )}
            </span>

            <h3>
              ${esc(item.name)}
            </h3>

            <p>
              <strong>Email:</strong>
              ${esc(item.email)}
            </p>

            <p>
              <strong>Message:</strong>
              ${esc(item.message)}
            </p>

            <small class="muted">
              ${
                item.created_at
                  ? esc(
                      new Date(
                        item.created_at
                      ).toLocaleString()
                    )
                  : ''
              }
            </small>

          </div>

          <div class="row-actions">

            <a
              class="btn"
              href="mailto:${encodeURIComponent(
                item.email
              )}"
            >
              Reply
            </a>

            <button
              class="btn danger"
              data-contact="${esc(item.id)}"
            >
              Delete
            </button>

          </div>

        </article>

      `).join('');

    box
      .querySelectorAll('[data-contact]')
      .forEach(button => {

        button.onclick =
          () =>
            deleteContactMessage(
              button.dataset.contact
            );

      });
  }


  async function deleteContactMessage(id) {

    if (
      !confirm(
        'Delete this contact message?'
      )
    ) {
      return;
    }

    try {

      const {
        error
      } =
        await client
          .from('contact_messages')
          .delete()
          .eq('id', id);

      if (error) {
        throw error;
      }

      await loadContactMessages();

    } catch (error) {

      alert(
        error.message ||
        'Delete failed.'
      );
    }
  }  /* =========================================================
     RESET PDF PROCESSOR
  ========================================================= */

  function resetProcessor(id) {

    const box = $(id);

    if (!box) {
      return;
    }

    const result =
      box.querySelector('.pw-result');

    const preview =
      box.querySelector('.pw-preview');

    const previewButton =
      box.querySelector('.pw-preview-btn');

    const status =
      box.querySelector('.pw-status');

    result?.classList.add(
      'pw-hidden'
    );

    preview?.classList.add(
      'pw-hidden'
    );

    previewButton?.classList.add(
      'pw-hidden'
    );

    if (preview) {
      preview.src = 'about:blank';
    }

    if (status) {
      status.textContent = '';
    }
  }


  /* =========================================================
     TABS
  ========================================================= */

  function showTab(tab) {

    const tabs = [
      $('notesTab'),
      $('industryTab'),
      $('contactTab')
    ];

    const panels = [
      $('notesPanel'),
      $('industryPanel'),
      $('contactPanel')
    ];

    tabs.forEach(item =>
      item?.classList.remove('active')
    );

    panels.forEach(item =>
      item?.classList.add('hidden')
    );


    if (tab === 'notes') {

      $('notesTab')
        ?.classList
        .add('active');

      $('notesPanel')
        ?.classList
        .remove('hidden');
    }


    if (tab === 'industry') {

      $('industryTab')
        ?.classList
        .add('active');

      $('industryPanel')
        ?.classList
        .remove('hidden');
    }


    if (tab === 'contact') {

      $('contactTab')
        ?.classList
        .add('active');

      $('contactPanel')
        ?.classList
        .remove('hidden');

      loadContactMessages();
    }
  }  /* =========================================================
     BIND EVENTS
  ========================================================= */

  function bind() {

    if ($('loginForm')) {
      $('loginForm').onsubmit = login;
    }

    if ($('logoutBtn')) {
      $('logoutBtn').onclick = logout;
    }

    if ($('uploadForm')) {
      $('uploadForm').onsubmit = uploadNote;
    }

    if ($('industryForm')) {
      $('industryForm').onsubmit =
        uploadIndustry;
    }

    if ($('refreshBtn')) {
      $('refreshBtn').onclick =
        loadNotes;
    }

    if ($('industryRefreshBtn')) {
      $('industryRefreshBtn').onclick =
        loadIndustry;
    }

    if ($('contactRefreshBtn')) {
      $('contactRefreshBtn').onclick =
        loadContactMessages;
    }


    if ($('semester')) {

      $('semester').onchange =
        populateSubjects;
    }


    if ($('subject')) {

      $('subject').onchange =
        populateUnits;
    }


    if ($('pdf')) {

      $('pdf').onchange = () => {

        notePreparedPdf = null;

        if ($('fileName')) {

          $('fileName').textContent =
            $('pdf').files[0]?.name ||
            'No file selected';
        }

        resetProcessor(
          'notesPdfTools'
        );
      };
    }


    if ($('industryPdf')) {

      $('industryPdf').onchange = () => {

        industryPreparedPdf = null;

        if ($('industryFileName')) {

          $('industryFileName').textContent =
            $('industryPdf')
              .files[0]?.name ||
            'No PDF selected';
        }

        resetProcessor(
          'industryPdfTools'
        );
      };
    }


    if ($('notesTab')) {

      $('notesTab').onclick =
        () =>
          showTab('notes');
    }


    if ($('industryTab')) {

      $('industryTab').onclick =
        () =>
          showTab('industry');
    }


    if ($('contactTab')) {

      $('contactTab').onclick =
        () =>
          showTab('contact');
    }


    /* PDF PROCESSING CONTROLS */

    addProcessor('notes');

    addProcessor('industry');
  }  /* =========================================================
     INIT
  ========================================================= */

  function init() {

    if (
      !window.supabase ||
      !window.supabase.createClient
    ) {

      message(
        $('loginMsg'),
        'Supabase library load nahi hui. Page refresh karein.'
      );

      return;
    }

    client =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

    bind();

    showSession();
  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init,
      {
        once: true
      }
    );

  } else {

    init();
  }

})();
