(function () {
  "use strict";

  const SUPABASE_URL =
    "https://qgmpwanxqytoakmnklvy.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_qlOg73Ee92_uzX9YsaRPIA_dMQX9gub";

  const ONE_GB = 1073741824;

  let client = null;
  let ready = false;


  function $(id) {
    return document.getElementById(id);
  }


  function esc(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      function (ch) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[ch];
      }
    );
  }


  function formatBytes(bytes) {

    if (!Number.isFinite(bytes) || bytes < 0) {
      return "0 B";
    }

    if (bytes < 1024) {
      return bytes.toFixed(0) + " B";
    }

    const units = ["KB", "MB", "GB"];

    let value = bytes / 1024;
    let unit = 0;

    while (
      value >= 1024 &&
      unit < units.length - 1
    ) {
      value /= 1024;
      unit++;
    }

    return (
      value.toFixed(
        value >= 100 ? 0 : 2
      ) +
      " " +
      units[unit]
    );
  }


  /* =========================================================
     DASHBOARD CSS
  ========================================================= */

  function injectStyles() {

    if ($("pwAdminDashboardStyles")) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "pwAdminDashboardStyles";

    style.textContent = `

      .pw-admin-dashboard {
        margin-top: 24px;
      }

      .pw-admin-dashboard .panel {
        margin-bottom: 18px;
      }

      .pw-dashboard-grid {
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .pw-dashboard-card {
        padding: 16px;
        border: 1px solid #e1e8e7;
        border-radius: 14px;
        background: #fff;
      }

      .pw-dashboard-card small {
        display: block;
        color: #71817f;
        margin-bottom: 6px;
      }

      .pw-dashboard-card strong {
        display: block;
        font-size: 22px;
        color: #173b39;
      }

      .pw-storage-progress {
        height: 12px;
        margin-top: 12px;
        border-radius: 999px;
        overflow: hidden;
        background: #e9efee;
      }

      .pw-storage-progress > span {
        display: block;
        height: 100%;
        width: 0;
        border-radius: inherit;
        background: #117f78;
        transition: width .25s ease;
      }

      .pw-storage-warning {
        margin-top: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        background: #eef8f6;
        color: #117f78;
        font-weight: 700;
      }

      .pw-storage-warning.warn {
        background: #fff4dc;
        color: #9a6700;
      }

      .pw-storage-warning.danger {
        background: #fde8e8;
        color: #b42318;
      }

      .pw-periods {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 14px;
      }

      .pw-periods button {
        border: 1px solid #d5e2df;
        background: #fff;
        border-radius: 10px;
        padding: 9px 12px;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
      }

      .pw-periods button.active {
        background: #117f78;
        color: #fff;
        border-color: #117f78;
      }

      .pw-dashboard-table-wrap {
        overflow-x: auto;
      }

      .pw-dashboard-table {
        width: 100%;
        min-width: 620px;
        border-collapse: collapse;
      }

      .pw-dashboard-table th,
      .pw-dashboard-table td {
        padding: 10px;
        border-bottom: 1px solid #e7eceb;
        text-align: left;
      }

      .pw-dashboard-table th {
        color: #173b39;
        background: #f5f8f7;
      }

      .pw-dashboard-empty {
        padding: 16px;
        color: #71817f;
      }

      @media (max-width: 700px) {

        .pw-dashboard-grid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

      }

      @media (max-width: 480px) {

        .pw-dashboard-grid {
          grid-template-columns: 1fr;
        }

      }

    `;

    document.head.appendChild(style);
  }


  /* =========================================================
     DASHBOARD HTML
  ========================================================= */

  function dashboardHTML() {

    return `

      <div
        id="pwAdminDashboard"
        class="pw-admin-dashboard"
      >

        <!-- STORAGE -->

        <section class="panel">

          <div class="section-head">

            <div>

              <p class="eyebrow">
                STORAGE
              </p>

              <h2>
                E. Storage Usage
              </h2>

            </div>

            <button
              id="pwStorageRefresh"
              class="btn"
              type="button"
            >
              Refresh
            </button>

          </div>


          <div class="pw-dashboard-grid">

            <div class="pw-dashboard-card">

              <small>
                Total storage
              </small>

              <strong
                id="pwStorageTotal"
              >
                —
              </strong>

            </div>


            <div class="pw-dashboard-card">

              <small>
                Used storage
              </small>

              <strong
                id="pwStorageUsed"
              >
                —
              </strong>

            </div>


            <div class="pw-dashboard-card">

              <small>
                Remaining storage
              </small>

              <strong
                id="pwStorageRemaining"
              >
                —
              </strong>

            </div>


            <div class="pw-dashboard-card">

              <small>
                Usage
              </small>

              <strong
                id="pwStoragePercent"
              >
                —
              </strong>

            </div>

          </div>


          <div
            class="pw-storage-progress"
          >

            <span
              id="pwStorageBar"
            ></span>

          </div>


          <div
            id="pwStorageWarning"
            class="pw-storage-warning"
          >
            Loading storage…
          </div>

        </section>


        <!-- ANALYTICS -->

        <section class="panel">

          <div class="section-head">

            <div>

              <p class="eyebrow">
                ANALYTICS
              </p>

              <h2>
                F. Analytics Dashboard
              </h2>

            </div>


            <button
              id="pwAnalyticsRefresh"
              class="btn"
              type="button"
            >
              Refresh
            </button>

          </div>


          <!-- PERIOD FILTER -->

          <div
            class="pw-periods"
            id="pwAnalyticsPeriods"
          >

            <button
              type="button"
              data-period="today"
            >
              Today
            </button>


            <button
              type="button"
              data-period="7d"
            >
              Last 7 days
            </button>


            <button
              type="button"
              data-period="30d"
            >
              Last 30 days
            </button>


            <button
              type="button"
              data-period="all"
              class="active"
            >
              All time
            </button>

          </div>


          <!-- ANALYTICS CARDS -->

          <div class="pw-dashboard-grid">

            <div
              class="pw-dashboard-card"
            >

              <small>
                👁️ Total website visits
              </small>

              <strong
                id="pwVisits"
              >
                —
              </strong>

            </div>


            <div
              class="pw-dashboard-card"
            >

              <small>
                👤 Unique browser visitors
              </small>

              <strong
                id="pwUnique"
              >
                —
              </strong>

            </div>


            <div
              class="pw-dashboard-card"
            >

              <small>
                📥 Total PDF download actions
              </small>

              <strong
                id="pwPdfClicks"
              >
                —
              </strong>

            </div>


            <div
              class="pw-dashboard-card"
            >

              <small>
                📚 Notes downloads
              </small>

              <strong
                id="pwNotesDownloads"
              >
                —
              </strong>

            </div>


            <div
              class="pw-dashboard-card"
            >

              <small>
                🏭 Industry downloads
              </small>

              <strong
                id="pwIndustryDownloads"
              >
                —
              </strong>

            </div>

          </div>


          <!-- TOP PDFs -->

          <h3
            style="margin-top:22px"
          >
            Most downloaded PDFs
          </h3>


          <div
            id="pwTopPdfs"
            class="pw-dashboard-table-wrap"
          ></div>


          <!-- RECENT ACTIVITY -->

          <h3
            style="margin-top:22px"
          >
            Recent activity
          </h3>


          <div
            id="pwRecentActivity"
            class="pw-dashboard-table-wrap"
          ></div>

        </section>

      </div>

    `;
  }


  /* =========================================================
     STORAGE
  ========================================================= */

  async function loadStorage() {

    const {
      data,
      error
    } =
      await client.rpc(
        "get_admin_storage_usage"
      );

    if (error) {
      throw error;
    }


    const total =
      Number(
        data?.total_bytes ||
        ONE_GB
      );


    const used =
      Number(
        data?.used_bytes ||
        0
      );


    const remaining =
      Number(
        data?.remaining_bytes ??
        Math.max(
          total - used,
          0
        )
      );


    const percent =
      Number(
        data?.usage_percent ||
        0
      );


    $("pwStorageTotal")
      .textContent =
      formatBytes(total);


    $("pwStorageUsed")
      .textContent =
      formatBytes(used);


    $("pwStorageRemaining")
      .textContent =
      formatBytes(remaining);


    $("pwStoragePercent")
      .textContent =
      percent.toFixed(2) +
      "%";


    $("pwStorageBar")
      .style.width =
      Math.min(
        percent,
        100
      ) +
      "%";


    const warning =
      $("pwStorageWarning");


    warning.className =
      "pw-storage-warning";


    if (percent >= 90) {

      warning.classList.add(
        "danger"
      );

      warning.textContent =
        "⚠️ Storage is critically high. Consider removing unused files.";

    }

    else if (percent >= 80) {

      warning.classList.add(
        "warn"
      );

      warning.textContent =
        "⚠️ Storage usage is above 80%. Keep an eye on available space.";

    }

    else {

      warning.textContent =
        "✓ Storage usage is within the normal range.";

    }

  }


  /* =========================================================
     TOP PDFs
  ========================================================= */

  function renderTopPdfs(items) {

    const box =
      $("pwTopPdfs");


    if (!items?.length) {

      box.innerHTML =
        '<div class="pw-dashboard-empty">No PDF download actions recorded yet.</div>';

      return;
    }


    box.innerHTML = `

      <table
        class="pw-dashboard-table"
      >

        <thead>

          <tr>

            <th>
              PDF
            </th>

            <th>
              Type
            </th>

            <th>
              Downloads
            </th>

          </tr>

        </thead>


        <tbody>

          ${items.map(
            item => `

            <tr>

              <td>
                ${esc(item.title)}
              </td>

              <td>
                ${esc(
                  item.resource_type ||
                  "—"
                )}
              </td>

              <td>
                ${Number(
                  item.downloads ||
                  0
                )}
              </td>

            </tr>

          `
          ).join("")}

        </tbody>

      </table>

    `;
  }


  /* =========================================================
     RECENT ACTIVITY
  ========================================================= */

  function renderRecent(items) {

    const box =
      $("pwRecentActivity");


    if (!items?.length) {

      box.innerHTML =
        '<div class="pw-dashboard-empty">No activity recorded yet.</div>';

      return;
    }


    box.innerHTML = `

      <table
        class="pw-dashboard-table"
      >

        <thead>

          <tr>

            <th>
              Time
            </th>

            <th>
              Action
            </th>

            <th>
              Page / PDF
            </th>

          </tr>

        </thead>


        <tbody>

          ${items.map(
            item => `

            <tr>

              <td>
                ${esc(
                  new Date(
                    item.created_at
                  ).toLocaleString()
                )}
              </td>

              <td>

                ${
                  item.event_type ===
                  "pdf_click"

                    ? "📥 PDF click"

                    : "👁️ Page visit"
                }

              </td>

              <td>
                ${esc(
                  item.resource_title ||
                  item.page ||
                  "—"
                )}
              </td>

            </tr>

          `
          ).join("")}

        </tbody>

      </table>

    `;
  }


  /* =========================================================
     ANALYTICS
  ========================================================= */

  async function loadAnalytics(
    period
  ) {

    const {
      data,
      error
    } =
      await client.rpc(
        "get_admin_analytics",
        {
          period_key:
            period
        }
      );


    if (error) {
      throw error;
    }


    $("pwVisits")
      .textContent =
      Number(
        data?.total_visits ||
        0
      ).toLocaleString();


    $("pwUnique")
      .textContent =
      Number(
        data?.unique_visitors ||
        0
      ).toLocaleString();


    $("pwPdfClicks")
      .textContent =
      Number(
        data?.total_pdf_clicks ||
        0
      ).toLocaleString();


    $("pwNotesDownloads")
      .textContent =
      Number(
        data?.notes_downloads ||
        0
      ).toLocaleString();


    $("pwIndustryDownloads")
      .textContent =
      Number(
        data?.industry_downloads ||
        0
      ).toLocaleString();


    renderTopPdfs(
      data?.top_pdfs ||
      []
    );


    renderRecent(
      data?.recent_activity ||
      []
    );

  }


  /* =========================================================
     REFRESH
  ========================================================= */

  async function refreshAll(
    period
  ) {

    try {

      await loadStorage();

      await loadAnalytics(
        period
      );

    }

    catch (error) {

      console.error(
        "Admin dashboard error:",
        error
      );


      const warning =
        $("pwStorageWarning");


      if (warning) {

        warning.className =
          "pw-storage-warning danger";


        warning.textContent =
          "Dashboard data could not be loaded. Run the Supabase SQL setup first.";

      }

    }

  }


  /* =========================================================
     BUTTONS
  ========================================================= */

  function bindDashboard() {

    $("pwStorageRefresh")
      ?.addEventListener(
        "click",
        loadStorage
      );


    $("pwAnalyticsRefresh")
      ?.addEventListener(
        "click",
        function () {

          const active =
            document.querySelector(
              "#pwAnalyticsPeriods button.active"
            );


          refreshAll(
            active?.dataset.period ||
            "all"
          );

        }
      );


    document
      .querySelectorAll(
        "#pwAnalyticsPeriods button"
      )
      .forEach(
        function (button) {

          button.addEventListener(
            "click",
            function () {

              document
                .querySelectorAll(
                  "#pwAnalyticsPeriods button"
                )
                .forEach(
                  b =>
                    b.classList.remove(
                      "active"
                    )
                );


              button.classList.add(
                "active"
              );


              refreshAll(
                button.dataset.period
              );

            }
          );

        }
      );

  }


  /* =========================================================
     INITIALIZE
  ========================================================= */

  function init() {

    if (ready) {
      return;
    }


    const adminView =
      $("adminView");


    if (
      !adminView ||
      adminView.classList.contains(
        "hidden"
      )
    ) {

      return;

    }


    if (
      !window.supabase?.createClient
    ) {

      return;

    }


    ready = true;


    injectStyles();


    client =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );


    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.innerHTML =
      dashboardHTML();


    adminView.appendChild(
      wrapper.firstElementChild
    );


    bindDashboard();


    refreshAll(
      "all"
    );

  }


  function watch() {

    init();


    if (!ready) {

      setTimeout(
        watch,
        300
      );

    }

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      watch,
      {
        once: true
      }
    );

  }

  else {

    watch();

  }

})();
