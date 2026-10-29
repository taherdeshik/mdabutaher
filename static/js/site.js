/* Public site interactions. Vanilla JS, no framework.
 * Every form posts JSON to the Django API and shows the Bengali message it returns. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- helpers ---------- */
  var BN = "০১২৩৪৫৬৭৮৯";
  function bn(value) {
    return String(value).replace(/[0-9]/g, function (d) { return BN[+d]; });
  }

  /* Messages come from the server (cms.context_processors.site_copy) so editors can change them. */
  var COPY = {};
  var copyEl = document.getElementById("site-copy");
  if (copyEl) { try { COPY = JSON.parse(copyEl.textContent); } catch (e) { COPY = {}; } }
  function t(key) { return Object.prototype.hasOwnProperty.call(COPY, key) ? COPY[key] : key; }
  function tf(key, vars) {
    return t(key).replace(/\{(\w+)\}/g, function (m, name) { return vars[name] !== undefined ? vars[name] : m; });
  }

  function api(url, options) {
    options = options || {};
    var init = {
      method: options.method || "GET",
      headers: { "Accept": "application/json" },
      credentials: "same-origin",
    };
    if (options.body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(options.body);
    }
    return fetch(url, init).then(function (res) {
      return res.json().catch(function () { return { ok: false, error: t("js.api.no_reply") }; })
        .then(function (json) { json.status = res.status; return json; });
    });
  }

  function errorText(json) {
    if (json.errors) {
      var first = Object.keys(json.errors).map(function (k) { return json.errors[k]; })[0];
      if (first) return first;
    }
    return json.error || t("js.api.generic");
  }

  function setMsg(el, text, kind) {
    if (!el) return;
    el.textContent = text;
    el.className = el.className.replace(/\btext-(emerald|rose-700|forest)\b/g, "").trim();
    el.classList.add(kind === "error" ? "text-rose-700" : "text-emerald");
  }

  function fingerprint() {
    var key = "mat_fp";
    var fp = localStorage.getItem(key);
    if (!fp) {
      fp = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
      localStorage.setItem(key, fp);
    }
    return fp;
  }

  /* Collect a form into a plain object. Radios → checked value, checkboxes → boolean. */
  function formData(form) {
    var out = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      if (el.type === "radio") { if (el.checked) out[el.name] = el.value; return; }
      if (el.type === "checkbox") { out[el.name] = el.checked; return; }
      if (el.type === "file") return;
      if (el.type === "number") { out[el.name] = el.value === "" ? 0 : Number(el.value); return; }
      out[el.name] = el.value;
    });
    return out;
  }

  /* ---------- header / mobile menu ---------- */
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-mobile-menu]");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("hidden") === false;
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
  }

  var header = document.querySelector("[data-site-header]");
  if (header) {
    var onScroll = function () { header.classList.toggle("shadow-soft", window.scrollY > 24); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- generic JSON forms: data-api-form="/api/..." ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("form[data-api-form]"), function (form) {
    var target = document.getElementById(form.getAttribute("data-success-target") || "");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var button = form.querySelector("button[type=submit]");
      if (button) button.disabled = true;
      var body = formData(form);
      api(form.getAttribute("data-api-form"), { method: "POST", body: body }).then(function (json) {
        if (json.ok) {
          setMsg(target, (json.data && json.data.message) || t("js.form.success"), "ok");
          form.reset();
        } else {
          setMsg(target, errorText(json), "error");
        }
      }).catch(function () {
        setMsg(target, t("js.net.error"), "error");
      }).finally(function () { if (button) button.disabled = false; });
    });
  });

  /* ---------- appointment: slot availability ---------- */
  var apptForm = document.querySelector("[data-appointment-form]");
  if (apptForm) {
    var dateInput = apptForm.querySelector("[data-date-input]");
    var today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    if (dateInput) dateInput.min = today.toISOString().slice(0, 10);

    var loadSlots = function () {
      if (!dateInput || !dateInput.value) return;
      api("/api/appointments/?date=" + encodeURIComponent(dateInput.value)).then(function (json) {
        if (!json.ok) return;
        json.data.slots.forEach(function (s) {
          var input = apptForm.querySelector('[data-slot][value="' + s.slot + '"]');
          if (!input) return;
          input.disabled = !s.available;
          input.parentElement.title = s.available ? "" : t("js.appt.slot_full");
          if (!s.available && input.checked) input.checked = false;
        });
      });
    };
    if (dateInput) dateInput.addEventListener("change", loadSlots);

    apptForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var target = document.getElementById("appt-msg");
      var body = formData(apptForm);
      body.notes = body.notes || "";
      api("/api/appointments/", { method: "POST", body: body }).then(function (json) {
        if (json.ok) { setMsg(target, json.data.message, "ok"); apptForm.reset(); }
        else { setMsg(target, errorText(json), "error"); }
        loadSlots();
      });
    });
  }

  /* ---------- appointment status lookup ---------- */
  var statusForm = document.querySelector("[data-status-form]");
  if (statusForm) {
    statusForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var msg = document.querySelector("[data-status-msg]");
      var list = document.querySelector("[data-status-list]");
      list.innerHTML = "";
      api("/api/appointments/?phone=" + encodeURIComponent(statusForm.phone.value.trim())).then(function (json) {
        if (!json.ok) { setMsg(msg, errorText(json), "error"); return; }
        var items = json.data.appointments;
        setMsg(msg, items.length ? tf("js.status.found", { n: bn(items.length) }) : t("js.status.none"), "ok");
        items.forEach(function (a) {
          var li = document.createElement("li");
          li.className = "card-surface rounded-2xl p-5";
          li.innerHTML = '<p class="font-mono text-xs text-muted"></p><p class="mt-1 font-semibold text-forest"></p><p class="mt-1 text-sm text-muted"></p><p class="mt-2 text-xs font-semibold"></p>';
          li.children[0].textContent = t("js.status.ref") + ": " + a.reference;
          li.children[1].textContent = a.date + " · " + a.slot + " · " + a.topic;
          li.children[2].textContent = a.type + " · " + t("js.board.ward") + " " + a.ward;
          li.children[3].textContent = t("js.status.label") + ": " + t("js.appt." + a.status);
          list.appendChild(li);
        });
      });
    });
  }

  /* ---------- feedback: anonymity & photo ---------- */
  var fbForm = document.querySelector("[data-feedback-form]");
  if (fbForm) {
    var anon = fbForm.querySelector("[data-anon-toggle]");
    var dependents = fbForm.querySelectorAll("[data-anon-dependent]");
    var syncAnon = function () {
      Array.prototype.forEach.call(dependents, function (el) { el.disabled = anon.checked; });
    };
    anon.addEventListener("change", syncAnon);
    syncAnon();

    var photo = fbForm.querySelector("[data-photo-input]");
    var photoData = "";
    photo.addEventListener("change", function () {
      var file = photo.files && photo.files[0];
      photoData = "";
      if (!file) return;
      if (file.size > 1500000) { setMsg(document.getElementById("fb-msg"), t("js.photo.too_big"), "error"); photo.value = ""; return; }
      var reader = new FileReader();
      reader.onload = function () { photoData = reader.result; };
      reader.readAsDataURL(file);
    });

    fbForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var target = document.getElementById("fb-msg");
      var body = formData(fbForm);
      body.photo = photoData || "";
      api("/api/feedback/", { method: "POST", body: body }).then(function (json) {
        if (json.ok) { setMsg(target, json.data.message, "ok"); fbForm.reset(); photoData = ""; syncAnon(); }
        else { setMsg(target, errorText(json), "error"); }
      });
    });

    var myForm = document.querySelector("[data-my-reports]");
    if (myForm) {
      myForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var list = document.querySelector("[data-my-list]");
        api("/api/feedback/?phone=" + encodeURIComponent(myForm.phone.value.trim())).then(function (json) {
          list.innerHTML = "";
          if (!json.ok) { list.innerHTML = '<li class="text-rose-700"></li>'; list.firstChild.textContent = errorText(json); return; }
          if (!json.data.items.length) { list.innerHTML = '<li class="text-muted"></li>'; list.firstChild.textContent = t("js.my.none"); return; }
          json.data.items.forEach(function (f) {
            var li = document.createElement("li");
            li.className = "rounded-xl bg-cream-2/60 p-3";
            li.textContent = f.trackingId + " · " + f.title + " · " + f.status;
            list.appendChild(li);
          });
        });
      });
    }
  }

  /* ---------- feedback board ---------- */
  var board = document.querySelector("[data-board-list]");
  if (board) {
    var stats = document.querySelector("[data-board-stats]");
    var load = function (ward) {
      api("/api/feedback/" + (ward && ward !== "all" ? "?ward=" + encodeURIComponent(ward) : "")).then(function (json) {
        if (!json.ok) { board.innerHTML = '<li class="text-rose-700"></li>'; board.firstChild.textContent = errorText(json); return; }
        var s = json.data.stats;
        stats.innerHTML = [[t("js.stat.total"), s.total], [t("js.stat.resolved"), s.resolved], [t("js.stat.in_progress"), s.inProgress], [t("js.stat.threats"), s.threats], [t("js.stat.avg_support"), s.avgSupport]]
          .map(function (p) { return '<div class="card-surface rounded-2xl p-4"><p class="text-xs text-muted">' + p[0] + '</p><p class="mt-1 font-display text-2xl font-bold text-forest">' + bn(p[1]) + "</p></div>"; })
          .join("");
        board.innerHTML = "";
        if (!json.data.items.length) { board.innerHTML = '<li class="text-muted"></li>'; board.firstChild.textContent = t("js.board.none"); return; }
        json.data.items.forEach(function (f) {
          var li = document.createElement("li");
          li.className = "card-surface rounded-3xl p-6";
          li.innerHTML = '<p class="text-xs font-semibold uppercase tracking-wider text-gold-deep"></p><h3 class="mt-2 font-bold text-forest"></h3><p class="mt-2 text-sm text-muted"></p><p class="mt-4 text-xs text-muted"></p>';
          li.children[0].textContent = t("js.board.kind." + f.kind) + " · " + t("js.board.ward") + " " + bn(f.ward) + " · " + f.trackingId;
          li.children[1].textContent = f.title;
          li.children[2].textContent = f.details.length > 160 ? f.details.slice(0, 160) + "…" : f.details;
          li.children[3].textContent = t("js.board.status_label") + ": " + t("js.board.state." + f.status.replace(/-/g, "_")) + " · " + f.name + " · " + t("js.board.support") + " " + bn(f.supports);
          board.appendChild(li);
        });
      });
    };
    Array.prototype.forEach.call(document.querySelectorAll("[data-ward-filter]"), function (btn) {
      btn.addEventListener("click", function () { load(btn.getAttribute("data-ward-filter")); });
    });
    load("all");
  }

  /* ---------- polls ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-poll]"), function (card) {
    var pollId = card.getAttribute("data-poll-id");
    var msg = card.querySelector("[data-poll-msg]");
    Array.prototype.forEach.call(card.querySelectorAll("[data-option-id]"), function (btn) {
      btn.addEventListener("click", function () {
        api("/api/polls/" + encodeURIComponent(pollId) + "/vote/", {
          method: "POST",
          body: { optionId: btn.getAttribute("data-option-id"), fingerprint: fingerprint() },
        }).then(function (json) {
          if (json.ok || json.status === 409) {
            setMsg(msg, json.ok ? json.data.message : errorText(json), json.ok ? "ok" : "error");
            api("/api/polls/").then(function (fresh) {
              if (!fresh.ok) return;
              var poll = fresh.data.polls.filter(function (p) { return p.id === pollId; })[0];
              if (poll) renderPoll(card, poll);
            });
          } else {
            setMsg(msg, errorText(json), "error");
          }
        });
      });
    });
  });

  function renderPoll(card, poll) {
    var total = poll.totalVotes || 0;
    poll.options.forEach(function (opt) {
      var btn = card.querySelector('[data-option-id="' + opt.id + '"]');
      if (!btn) return;
      btn.querySelector("[data-option-pct]").textContent = total ? bn(opt.votes) : "০";
      btn.querySelector("[data-option-bar]").style.width = total ? Math.round((opt.votes / total) * 100) + "%" : "0";
    });
    var totalEl = card.querySelector("[data-total]");
    if (totalEl) totalEl.textContent = bn(total.toLocaleString("en-US"));
  }

  /* ---------- chat ---------- */
  var chatLog = document.querySelector("[data-chat-log]");
  if (chatLog) {
    var rulesEl = document.getElementById("chat-rules");
    var rules = rulesEl ? JSON.parse(rulesEl.textContent) : { rules: [], default: "" };
    var reply = function (input) {
      for (var i = 0; i < rules.rules.length; i++) {
        if (new RegExp(rules.rules[i].pattern).test(input)) return rules.rules[i].reply;
      }
      return rules.default;
    };
    var add = function (role, text) {
      var li = document.createElement("li");
      li.className = role === "user" ? "ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-forest px-4 py-2.5 text-sm text-cream" : "max-w-[80%] rounded-2xl rounded-bl-sm bg-cream-2 px-4 py-2.5 text-sm text-forest";
      li.textContent = text;
      chatLog.appendChild(li);
      chatLog.scrollTop = chatLog.scrollHeight;
    };
    add("agent", t("js.chat.greeting"));
    var chatForm = document.querySelector("[data-chat-form]");
    var send = function (text) {
      text = (text || "").trim();
      if (!text) return;
      add("user", text);
      api("/api/chat/", { method: "POST", body: { message: text } }).then(function (json) {
        if (!json.ok) add("agent", errorText(json));
        else add("agent", reply(text));
      });
    };
    chatForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = chatForm.message;
      send(input.value);
      input.value = "";
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-suggest]"), function (btn) {
      btn.addEventListener("click", function () { send(btn.getAttribute("data-suggest")); });
    });
  }

  /* ---------- event seats (refresh on load) ---------- */
  var seatsBox = document.querySelector("[data-event-id]");
  if (seatsBox) {
    api("/api/events/" + encodeURIComponent(seatsBox.getAttribute("data-event-id")) + "/").then(function (json) {
      if (!json.ok) return;
      var left = document.querySelector("[data-seats-left]");
      var total = document.querySelector("[data-seats]");
      if (left) left.textContent = bn(json.data.seatsLeft);
      if (total) total.textContent = bn(json.data.registered);
    });
  }

  /* ---------- blog reactions (local only, per browser) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-reaction]"), function (btn) {
    var key = "mat_react_" + location.pathname + "_" + btn.getAttribute("data-reaction");
    if (localStorage.getItem(key)) btn.setAttribute("aria-pressed", "true");
    btn.addEventListener("click", function () {
      var on = localStorage.getItem(key) !== "1";
      localStorage.setItem(key, on ? "1" : "0");
      btn.setAttribute("aria-pressed", String(on));
    });
  });

  /* ---------- gallery lightbox ---------- */
  var lightboxItems = document.querySelectorAll("[data-lightbox-src]");
  if (lightboxItems.length) {
    var box = document.createElement("div");
    box.className = "fixed inset-0 z-[90] hidden items-center justify-center bg-night/90 p-6";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.innerHTML = '<figure class="max-h-full max-w-5xl"><img alt="" class="max-h-[80vh] rounded-2xl object-contain"><figcaption class="mt-3 text-center text-sm text-cream"></figcaption></figure><button type="button" class="absolute right-5 top-5 rounded-full bg-white/10 px-4 py-2 text-cream" aria-label="' + t("js.lightbox.close") + '">✕</button>';
    document.body.appendChild(box);
    var boxImg = box.querySelector("img");
    var boxCap = box.querySelector("figcaption");
    var close = function () { box.classList.add("hidden"); box.classList.remove("flex"); };
    box.addEventListener("click", function (e) { if (e.target === box || e.target.tagName === "BUTTON") close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    Array.prototype.forEach.call(lightboxItems, function (btn) {
      btn.addEventListener("click", function () {
        boxImg.src = btn.getAttribute("data-lightbox-src");
        boxImg.alt = btn.getAttribute("data-lightbox-caption") || "";
        boxCap.textContent = btn.getAttribute("data-lightbox-caption") || "";
        box.classList.remove("hidden");
        box.classList.add("flex");
        box.querySelector("button").focus();
      });
    });
  }

  if (reduceMotion) document.documentElement.style.scrollBehavior = "auto";
})();
