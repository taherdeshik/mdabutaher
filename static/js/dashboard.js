/* Dashboard actions: status changes, notes, read flags, user management.
 * Uses the Django session cookie and the CSRF token from the page. */
(function () {
  "use strict";

  function csrf() {
    var m = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  function call(url, method, body) {
    return fetch(url, {
      method: method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrf(), "Accept": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then(function (res) {
      return res.json().catch(function () { return { ok: false, error: "উত্তর পড়া যায়নি" }; })
        .then(function (json) { json.status = res.status; return json; });
    });
  }

  function report(json) {
    if (!json.ok) { alert(json.error || "সমস্যা হয়েছে"); return false; }
    return true;
  }

  Array.prototype.forEach.call(document.querySelectorAll("select[data-patch]"), function (sel) {
    sel.dataset.prev = sel.value;
    sel.addEventListener("change", function () {
      var body = {};
      body[sel.dataset.key] = sel.value;
      call(sel.dataset.patch, "PATCH", body).then(function (json) {
        if (!report(json)) sel.value = sel.dataset.prev;
        else sel.dataset.prev = sel.value;
      });
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll("form[data-note-form]"), function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var note = form.note.value.trim();
      if (!note) return;
      call(form.getAttribute("data-note-form"), "PATCH", { note: note }).then(function (json) {
        if (report(json)) window.location.reload();
      });
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-mark-read]"), function (btn) {
    btn.addEventListener("click", function () {
      call(btn.getAttribute("data-mark-read"), "PATCH", { read: true }).then(function (json) {
        if (report(json)) btn.remove();
      });
    });
  });

  var createForm = document.querySelector("form[data-create-user]");
  if (createForm) {
    createForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var msg = document.querySelector("[data-user-msg]");
      var body = {};
      Array.prototype.forEach.call(createForm.elements, function (el) { if (el.name) body[el.name] = el.value; });
      call(createForm.getAttribute("data-create-user"), "POST", body).then(function (json) {
        msg.textContent = json.ok ? "ব্যবহারকারী তৈরি হয়েছে।" : (json.error || "সমস্যা হয়েছে");
        msg.className = "text-sm " + (json.ok ? "text-emerald" : "text-rose-700");
        if (json.ok) window.location.reload();
      });
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-delete-user]"), function (btn) {
    btn.addEventListener("click", function () {
      if (!confirm("এই ব্যবহারকারীকে মুছে ফেলতে চান?")) return;
      call(btn.getAttribute("data-delete-user"), "DELETE").then(function (json) {
        if (report(json)) window.location.reload();
      });
    });
  });
})();
