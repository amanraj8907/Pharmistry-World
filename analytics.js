(function () {
  "use strict";

  const SUPABASE_URL =
    "https://qgmpwanxqytoakmnklvy.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_qlOg73Ee92_uzX9YsaRPIA_dMQX9gub";

  const TABLE_URL =
    SUPABASE_URL + "/rest/v1/analytics_events";


  /* =====================================================
     UNIQUE BROWSER ID
  ===================================================== */

  function getVisitorId() {
    const key = "pharmistry_world_visitor_id";

    try {
      let id = localStorage.getItem(key);

      if (!id) {
        id =
          "pw_" +
          Date.now().toString(36) +
          "_" +
          Math.random()
            .toString(36)
            .substring(2, 14);

        localStorage.setItem(key, id);
      }

      return id;

    } catch (error) {

      return (
        "pw_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
          .toString(36)
          .substring(2, 14)
      );

    }
  }


  const visitorId = getVisitorId();


  /* =====================================================
     PAGE NAME
  ===================================================== */

  function getPageName() {

    const path =
      window.location.pathname
        .split("/")
        .pop();

    return path || "index.html";

  }


  /* =====================================================
     RESOURCE TYPE
  ===================================================== */

  function getResourceType() {

    const page =
      getPageName()
        .toLowerCase();

    if (page.includes("industry")) {
      return "industry";
    }

    if (page.includes("notes")) {
      return "notes";
    }

    return null;

  }


  /* =====================================================
     SEND EVENT
  ===================================================== */

  async function sendEvent(
    eventType,
    resourceTitle,
    resourceType
  ) {

    try {

      const payload = {
        event_type: eventType,
        page: getPageName(),
        resource_title:
          resourceTitle || null,
        resource_type:
          resourceType ||
          getResourceType(),
        visitor_id: visitorId
      };


      await fetch(
        TABLE_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "apikey":
              SUPABASE_KEY,

            "Authorization":
              "Bearer " +
              SUPABASE_KEY,

            "Prefer":
              "return=minimal"
          },

          body:
            JSON.stringify(payload),

          keepalive: true
        }
      );

    } catch (error) {

      console.error(
        "Pharmistry World analytics error:",
        error
      );

    }

  }


  /* =====================================================
     PAGE VIEW
  ===================================================== */

  function trackPageView() {

    sendEvent(
      "page_view",
      null,
      getResourceType()
    );

  }


  /* =====================================================
     PDF CLICK
  ===================================================== */

  function trackPDFClick(
    title,
    type
  ) {

    sendEvent(
      "pdf_click",
      title ||
        "PDF",
      type ||
        getResourceType()
    );

  }


  /* =====================================================
     FIND PDF TITLE
  ===================================================== */

  function getPDFTitle(element) {

    let title =
      element.getAttribute(
        "data-title"
      );

    if (title) {
      return title.trim();
    }


    title =
      element.getAttribute(
        "download"
      );

    if (
      title &&
      title !== "true"
    ) {
      return title.trim();
    }


    const card =
      element.closest(
        ".pdf-card, .note-card, .industry-card, .card"
      );


    if (card) {

      const heading =
        card.querySelector(
          "h1, h2, h3, h4, h5, h6, .title"
        );

      if (heading) {
        return heading.textContent.trim();
      }

    }


    return (
      element.textContent ||
      "PDF"
    ).trim();

  }


  /* =====================================================
     PDF LINK TRACKING
  ===================================================== */

  function setupPDFTracking() {

    document.addEventListener(
      "click",
      function (event) {

        const link =
          event.target.closest(
            "a"
          );


        if (!link) {
          return;
        }


        const href =
          link.getAttribute(
            "href"
          ) || "";


        const dataPdf =
          link.getAttribute(
            "data-pdf"
          );


        const looksLikePDF =
          /\.pdf(?:[?#].*)?$/i.test(
            href
          ) ||
          dataPdf === "true";


        if (!looksLikePDF) {
          return;
        }


        const title =
          getPDFTitle(link);


        const type =
          link.getAttribute(
            "data-resource-type"
          ) ||
          getResourceType();


        trackPDFClick(
          title,
          type
        );

      },
      true
    );

  }


  /* =====================================================
     GLOBAL FUNCTION
     Useful when PDF is opened by JavaScript/modal
  ===================================================== */

  window.PharmistryAnalytics = {

    trackPDF: function (
      title,
      type
    ) {

      trackPDFClick(
        title,
        type
      );

    }

  };


  /* =====================================================
     START
  ===================================================== */

  function start() {

    trackPageView();

    setupPDFTracking();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start,
      {
        once: true
      }
    );

  } else {

    start();

  }

})();
