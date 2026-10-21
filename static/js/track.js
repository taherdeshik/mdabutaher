/* Privacy-first page-view beacon. No cookies; a random per-tab session id lives in sessionStorage.
 * Skipped when Do Not Track is on or the visitor opted out on /privacy. */
(function () {
  "use strict";
  var OPT_OUT = "mat_analytics_optout";
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;
  if (localStorage.getItem(OPT_OUT) === "1") return;
  if (/^\/(admin|django-admin)/.test(location.pathname)) return;

  var sid = sessionStorage.getItem("mat_session");
  if (!sid) {
    sid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
    sessionStorage.setItem("mat_session", sid);
  }

  function send() {
    var body = JSON.stringify({
      path: location.pathname,
      title: document.title.slice(0, 140),
      referrer: document.referrer ? document.referrer.slice(0, 300) : "",
      session: sid,
      lang: navigator.language || "",
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track/", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track/", { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true });
    }
  }
  send();

  // Opt-out toggle on the privacy page.
  var box = document.querySelector("[data-analytics-optout]");
  if (box) {
    box.checked = localStorage.getItem(OPT_OUT) === "1";
    box.addEventListener("change", function () {
      localStorage.setItem(OPT_OUT, box.checked ? "1" : "0");
    });
  }
})();
