(() => {
  'use strict';

  const SUPABASE_URL =
    'https://qgmpwanxqytoakmnklvy.supabase.co';

  const SUPABASE_KEY =
    'sb_publishable_qlOg73Ee92_uzX9YsaRPIA_dMQX9gub';

  const BUCKET = 'B. Pharm Notes';

  const $ = id => document.getElementById(id);

  let client = null;


  /* =========================
     SUBJECTS
  ========================= */

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


  /* =========================
     HELPERS
  ========================= */

  const esc = value =>
    String(value ?? '').replace(
      /[&<>"']/g,
      char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[char])
    );


  const msg = (
    element,
    text,
    ok = false
  ) => {

    if (!element) return;

    element.textContent = text || '';

    element.className =
      'message ' +
      (ok ? 'ok' : 'error');
  };


  /* =========================
     ADMIN CHECK
  ========================= */

  async function isAdmin(uid) {

    const {
      data,
      error
    } = await client
      .from('admin_users')
      .select('user_id')
      .eq('user_id', uid)
      .maybeSingle();

    if (error) throw error;

    return !!data;
  }


  /* =========================
     SESSION
  ========================= */

  async function showSession() {

    try {

      const {
        data,
        error
      } = await client.auth.getSession();

      if (error) throw error;

      const session = data.session;

      if (!session) {

        $('loginView').classList.remove('hidden');
        $('adminView').classList.add('hidden');

        return;
      }


      if (!(await isAdmin(session.user.id))) {

        await client.auth.signOut();

        $('loginView').classList.remove('hidden');
        $('adminView').classList.add('hidden');

        msg(
          $('loginMsg'),
          'This account is not authorized as an admin.'
        );

        return;
      }


      $('userEmail').textContent =
        session.user.email || '';

      $('loginView').classList.add('hidden');
      $('adminView').classList.remove('hidden');

      await loadNotes();
      await loadIndustry();
      await loadContactMessages();

    } catch (error) {

      console.error(error);

      msg(
        $('loginMsg'),
        error.message || 'Session check failed.'
      );
    }
  }


  /* =========================
     LOGIN
  ========================= */

  async function login(event) {

    event.preventDefault();

    msg(
      $('loginMsg'),
      'Signing in…',
      true
    );

    try {

      const {
        error
      } = await client.auth.signInWithPassword({

        email:
          $('email').value.trim(),

        password:
          $('password').value

      });

      if (error) throw error;

      await showSession();

    } catch (error) {

      console.error(error);

      msg(
        $('loginMsg'),
        error.message || 'Sign-in failed.'
      );
    }
  }


  /* =========================
     LOGOUT
  ========================= */

  async function logout() {

    await client.auth.signOut();

    await showSession();
  }


  /* =========================
     FILE HELPERS
  ========================= */

  function safeName(name) {

    return name
      .replace(/\.pdf$/i, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'file';
  }


  function publicPath(url) {

    try {

      const marker =
        `/storage/v1/object/public/${encodeURIComponent(BUCKET)}/`;

      if (url && url.includes(marker)) {

        return decodeURIComponent(
          url.split(marker)[1]
        );
      }


      const raw =
        `/storage/v1/object/public/${BUCKET}/`;

      if (url && url.includes(raw)) {

        return decodeURIComponent(
          url.split(raw)[1]
        );
      }

    } catch (error) {}

    return null;
  }


  async function uploadFile(file, folder) {

    const path =
      `${folder}/${Date.now()}-${safeName(file.name)}.pdf`;

    const {
      error
    } = await client
      .storage
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

    if (error) throw error;

    return {
      path,
      url:
        client
          .storage
          .from(BUCKET)
          .getPublicUrl(path)
          .data
          .publicUrl
    };
  }


  /* =========================
     NOTES
  ========================= */

  function populateSubjects() {

    const semester =
      $('semester').value;

    const subject =
      $('subject');

    const unit =
      $('unit');


    subject.innerHTML =
      '<option value="">Select subject</option>';

    unit.innerHTML =
      '<option value="">Select subject first</option>';

    unit.disabled = true;

    subject.disabled = !semester;


    if (semester) {

      (SUBJECTS[semester] || [])
        .forEach(item => {

          subject.insertAdjacentHTML(
            'beforeend',
            `<option>${esc(item)}</option>`
          );

        });
    }
  }


  function populateUnits() {

    const subject =
      $('subject').value;

    const unit =
      $('unit');


    unit.innerHTML =
      '<option value="">Select unit</option>';

    unit.disabled = !subject;


    if (subject) {

      for (let i = 1; i <= 5; i++) {

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


  async function uploadNote(event) {

    event.preventDefault();

    const file =
      $('pdf').files[0];


    if (!file) {

      return msg(
        $('uploadMsg'),
        'Choose a PDF first.'
      );
    }


    if (file.size > 25 * 1024 * 1024) {

      return msg(
        $('uploadMsg'),
        'PDF must be 25 MB or smaller.'
      );
    }


    msg(
      $('uploadMsg'),
      'Uploading…',
      true
    );


    let path = null;


    try {

      const result =
        await uploadFile(file, 'notes');

      path = result.path;


      const payload = {

        title:
          $('title').value.trim(),

        semester:
          $('semester').value,

        subject:
          $('subject').value.trim(),

        unit:
          $('unit').value,

        description:
          $('description').value.trim(),

        pdf_url:
          result.url
      };


      const {
        error
      } = await client
        .from('notes')
        .insert(payload);


      if (error) throw error;


      $('uploadForm').reset();

      populateSubjects();

      $('fileName').textContent =
        'No file selected';


      msg(
        $('uploadMsg'),
        'Note published successfully.',
        true
      );


      await loadNotes();

    } catch (error) {

      if (path) {

        await client
          .storage
          .from(BUCKET)
          .remove([path]);
      }

      console.error(error);

      msg(
        $('uploadMsg'),
        error.message || 'Upload failed.'
      );
    }
  }


  async function loadNotes() {

    const box =
      $('notesList');

    box.innerHTML =
      '<p class="muted">Loading…</p>';


    const {
      data,
      error
    } = await client
      .from('notes')
      .select('*')
      .order(
        'created_at',
        { ascending: false }
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

              ${note.unit
                ? ' · ' + esc(note.unit)
                : ''}

              ${note.description
                ? ' · ' + esc(note.description)
                : ''}

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

        button.onclick = () =>
          deleteNote(
            button.dataset.del,
            button.dataset.url
          );

      });
  }


  async function deleteNote(id, url) {

    if (!confirm('Delete this note?')) return;


    try {

      const path =
        publicPath(url);


      if (path) {

        await client
          .storage
          .from(BUCKET)
          .remove([path]);
      }


      const {
        error
      } = await client
        .from('notes')
        .delete()
        .eq('id', id);


      if (error) throw error;

      await loadNotes();

    } catch (error) {

      alert(
        error.message ||
        'Delete failed.'
      );
    }
  }


  /* =========================
     INDUSTRY
  ========================= */

  async function uploadIndustry(event) {

    event.preventDefault();

    const file =
      $('industryPdf').files[0];


    if (
      file &&
      file.size > 25 * 1024 * 1024
    ) {

      return msg(
        $('industryMsg'),
        'PDF must be 25 MB or smaller.'
      );
    }


    msg(
      $('industryMsg'),
      'Publishing…',
      true
    );


    let path = null;


    try {

      let url = null;


      if (file) {

        const result =
          await uploadFile(
            file,
            'industry'
          );

        path = result.path;
        url = result.url;
      }


      const {
        error
      } = await client
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


      if (error) throw error;


      $('industryForm').reset();

      $('industryFileName').textContent =
        'No PDF selected';


      msg(
        $('industryMsg'),
        'Industry resource published successfully.',
        true
      );


      await loadIndustry();

    } catch (error) {

      if (path) {

        await client
          .storage
          .from(BUCKET)
          .remove([path]);
      }

      console.error(error);

      msg(
        $('industryMsg'),
        error.message ||
        'Publish failed.'
      );
    }
  }


  async function loadIndustry() {

    const box =
      $('industryList');

    box.innerHTML =
      '<p class="muted">Loading…</p>';


    const {
      data,
      error
    } = await client
      .from('industry_resources')
      .select('*')
      .order(
        'created_at',
        { ascending: false }
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
              ${esc(item.description || '')}
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
              data-url="${esc(item.pdf_url || '')}"
            >
              Delete
            </button>

          </div>

        </article>

      `).join('');


    box
      .querySelectorAll('[data-ind]')
      .forEach(button => {

        button.onclick = () =>
          deleteIndustry(
            button.dataset.ind,
            button.dataset.url
          );

      });
  }


  async function deleteIndustry(id, url) {

    if (
      !confirm(
        'Delete this industry resource?'
      )
    ) return;


    try {

      const path =
        publicPath(url);


      if (path) {

        await client
          .storage
          .from(BUCKET)
          .remove([path]);
      }


      const {
        error
      } = await client
        .from('industry_resources')
        .delete()
        .eq('id', id);


      if (error) throw error;

      await loadIndustry();

    } catch (error) {

      alert(
        error.message ||
        'Delete failed.'
      );
    }
  }


  /* =========================
     CONTACT MESSAGES
  ========================= */

  async function loadContactMessages() {

    const box =
      $('contactList');

    box.innerHTML =
      '<p class="muted">Loading messages…</p>';


    const {
      data,
      error
    } = await client
      .from('contact_messages')
      .select('*')
      .order(
        'created_at',
        { ascending: false }
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
      data.map(item => {

        const date =
          item.created_at
            ? new Date(
                item.created_at
              ).toLocaleString()
            : '';


        return `

          <article class="note-row">

            <div>

              <span class="badge">
                ${esc(item.subject || 'General')}
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
                ${esc(date)}
              </small>

            </div>


            <div class="row-actions">

              <a
                class="btn"
                href="mailto:${encodeURIComponent(item.email)}"
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

        `;

      }).join('');


    box
      .querySelectorAll('[data-contact]')
      .forEach(button => {

        button.onclick = () =>
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
    ) return;


    try {

      const {
        error
      } = await client
        .from('contact_messages')
        .delete()
        .eq('id', id);


      if (error) throw error;


      await loadContactMessages();

    } catch (error) {

      alert(
        error.message ||
        'Delete failed.'
      );
    }
  }


  /* =========================
     TAB MANAGEMENT
  ========================= */

  function showTab(tab) {

    const notesTab =
      $('notesTab');

    const industryTab =
      $('industryTab');

    const contactTab =
      $('contactTab');


    const notesPanel =
      $('notesPanel');

    const industryPanel =
      $('industryPanel');

    const contactPanel =
      $('contactPanel');


    notesTab.classList.remove('active');
    industryTab.classList.remove('active');
    contactTab.classList.remove('active');


    notesPanel.classList.add('hidden');
    industryPanel.classList.add('hidden');
    contactPanel.classList.add('hidden');


    if (tab === 'notes') {

      notesTab.classList.add('active');
      notesPanel.classList.remove('hidden');

    }


    if (tab === 'industry') {

      industryTab.classList.add('active');
      industryPanel.classList.remove('hidden');

    }


    if (tab === 'contact') {

      contactTab.classList.add('active');
      contactPanel.classList.remove('hidden');

      loadContactMessages();

    }
  }


  /* =========================
     BIND EVENTS
  ========================= */

  function bind() {

    $('loginForm').onsubmit =
      login;


    $('logoutBtn').onclick =
      logout;


    $('uploadForm').onsubmit =
      uploadNote;


    $('industryForm').onsubmit =
      uploadIndustry;


    $('refreshBtn').onclick =
      loadNotes;


    $('industryRefreshBtn').onclick =
      loadIndustry;


    $('contactRefreshBtn').onclick =
      loadContactMessages;


    $('semester').onchange =
      populateSubjects;


    $('subject').onchange =
      populateUnits;


    $('pdf').onchange
