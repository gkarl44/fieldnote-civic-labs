(function () {
  "use strict";

  if (navigator.doNotTrack === "1" || window.doNotTrack === "1") {
    return;
  }

  var analyticsFlag = document.querySelector('meta[name="fieldnote-analytics"]');

  if (!analyticsFlag || analyticsFlag.getAttribute("content") !== "enabled") {
    return;
  }

  if (window.location.protocol !== "http:" && window.location.protocol !== "https:") {
    return;
  }

  if (window.location.hostname !== "fieldnoteciviclabs.com") {
    return;
  }

  function postEvent(name, detail) {
    var payload = JSON.stringify({
      name: name,
      detail: detail || {},
      path: window.location.pathname,
      referrer: document.referrer || "",
      title: document.title,
      ts: new Date().toISOString()
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/__event", new Blob([payload], { type: "application/json" }));
      return;
    }

    fetch("/__event", {
      body: payload,
      headers: { "content-type": "application/json" },
      keepalive: true,
      method: "POST"
    }).catch(function () {});
  }

  postEvent("page_view", {
    hash: window.location.hash || ""
  });

  document.addEventListener("click", function (event) {
    var link = event.target.closest("[data-track]");

    if (!link) {
      return;
    }

    postEvent("site_click", {
      label: link.getAttribute("data-track"),
      href: link.getAttribute("href") || "",
      text: link.textContent.trim().slice(0, 80)
    });
  });
})();
