/* Dashboard content editor: documents (form-based JSON), page copy, media library.
 * Builds every element with DOM APIs and textContent, so admin text is never parsed as HTML. */
(function () {
  "use strict";

  var root = document.getElementById("cms-root");
  if (!root) return;

  var API_DOCS = "/api/admin/content/";
  var API_TEXTS = "/api/admin/texts/";
  var API_MEDIA = "/api/admin/media/";

  var LABELS = {
    title: "শিরোনাম", name: "নাম", nameEn: "ইংরেজি নাম", role: "পদবি", ward: "ওয়ার্ড",
    union: "ইউনিয়ন", upazila: "উপজেলা", district: "জেলা", division: "বিভাগ",
    electionYear: "নির্বাচনের বছর", slogan: "স্লোগান", tagline: "ট্যাগলাইন",
    heroQuote: "হিরো উক্তি", intro: "পরিচিতি", founded: "প্রতিষ্ঠা", phone: "ফোন",
    phoneHref: "ফোন লিংক", email: "ইমেইল", office: "অফিসের ঠিকানা", officeHours: "অফিস সময়",
    officeHoursNote: "সময়ের নোট", mapUrl: "মানচিত্র লিংক", socials: "সোশ্যাল লিংক",
    quickLinks: "দ্রুত লিংক", nav: "মেনু", href: "লিংক", label: "লেবেল", value: "মান",
    number: "সংখ্যা", icon: "আইকন", summary: "সারাংশ", excerpt: "সংক্ষিপ্ত বিবরণ",
    description: "বিবরণ", text: "লেখা", body: "মূল লেখা", bio: "জীবনী", subtitle: "উপশিরোনাম",
    caption: "ক্যাপশন", tag: "ট্যাগ", tags: "ট্যাগসমূহ", date: "তারিখ", time: "সময়",
    location: "স্থান", category: "বিভাগ", status: "অবস্থা", type: "ধরন", items: "তালিকা",
    content: "বিষয়বস্তু", question: "প্রশ্ন", answer: "উত্তর", cite: "উদ্ধৃতি সূত্র",
    author: "লেখক", readTime: "পড়ার সময় (মিনিট)", featured: "বিশেষ (ফিচার্ড)",
    slug: "URL নাম (slug)", id: "আইডি", image: "ছবি", video: "ভিডিও", audio: "অডিও",
    poster: "পোস্টার", photo: "ছবি", portrait: "প্রোফাইল ছবি", hero: "হিরো ছবি",
    signature: "স্বাক্ষর ছবি", cover: "কভার ছবি", key: "ছবির কী"
  };
  var IMAGE_KEYS = ["image", "photo", "poster", "portrait", "hero", "heroPortrait", "signature", "avatar", "thumbnail", "cover", "src"];
  var VIDEO_KEYS = ["video"];
  var AUDIO_KEYS = ["audio"];
  var BLOG_TYPES = ["p", "h2", "quote", "list", "callout"];

  var state = { docs: [], doc: null, dirty: false, assets: [], mediaKind: "", texts: [] };

  // ---------- helpers ----------
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") node.className = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else if (k.indexOf("on") === 0) node.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }
  function csrf() {
    var m = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }
  function request(url, method, body, isForm) {
    var init = { method: method, credentials: "same-origin", headers: { "X-CSRFToken": csrf(), "Accept": "application/json" } };
    if (body !== undefined) {
      if (isForm) init.body = body;
      else { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(body); }
    }
    return fetch(url, init).then(function (res) {
      return res.json().catch(function () {
        return { ok: false, error: "সার্ভার থেকে সঠিক উত্তর আসেনি (HTTP " + res.status + ")। পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন।" };
      })
        .then(function (json) { json.status = res.status; return json; });
    });
  }
  function status(message, good) {
    var box = document.getElementById("cms-status");
    box.textContent = message;
    box.className = "rounded-xl px-4 py-3 text-sm " + (good ? "bg-emerald/10 text-forest" : "bg-rose-50 text-rose-700");
    box.classList.remove("hidden");
    clearTimeout(status._t);
    status._t = setTimeout(function () { box.classList.add("hidden"); }, good ? 4000 : 12000);
  }
  function errorText(json) {
    var msg = json.error || "সমস্যা হয়েছে";
    if (json.errors && json.errors.details && json.errors.details.length) {
      msg += " — " + json.errors.details.join(" · ");
    }
    return msg;
  }
  function labelFor(key) { return LABELS[key] || key; }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function blankLike(v) {
    if (typeof v === "string") return "";
    if (typeof v === "number") return 0;
    if (typeof v === "boolean") return false;
    if (v === null) return "";
    if (Array.isArray(v)) return [];
    var out = {};
    Object.keys(v).forEach(function (k) { out[k] = k === "id" ? "" : blankLike(v[k]); });
    return out;
  }
  function getIn(obj, path) { return path.reduce(function (o, k) { return o[k]; }, obj); }
  function setIn(obj, path, value) {
    var parent = path.slice(0, -1).reduce(function (o, k) { return o[k]; }, obj);
    parent[path[path.length - 1]] = value;
  }
  function removeAt(obj, path) {
    var parent = getIn(obj, path.slice(0, -1));
    var idx = path[path.length - 1];
    parent.splice(idx, 1);
  }
  function moveAt(obj, path, delta) {
    var arr = getIn(obj, path.slice(0, -1));
    var i = path[path.length - 1];
    var j = i + delta;
    if (j < 0 || j >= arr.length) return;
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  function assetsOf(kind) {
    return state.assets.filter(function (a) { return a.kind === kind; });
  }
  function kindFor(key, path, docName) {
    if (path[0] === "imageMap") return "image";
    if (VIDEO_KEYS.indexOf(key) >= 0) return "video";
    if (AUDIO_KEYS.indexOf(key) >= 0) return "audio";
    if (IMAGE_KEYS.indexOf(key) >= 0) return "image";
    if (key === "key" && docName === "gallery") return "image";
    return null;
  }

  // ---------- tabs ----------
  var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-tab]"));
  function showTab(name) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-tab") === name;
      t.classList.toggle("bg-forest", on);
      t.classList.toggle("text-cream", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-panel]"), function (p) {
      p.classList.toggle("hidden", p.getAttribute("data-panel") !== name);
    });
    if (name === "texts" && !state.texts.length) loadTexts();
    if (name === "media") loadMedia(state.mediaKind);
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      if (state.dirty && !window.confirm("সংরক্ষণ না করা পরিবর্তন আছে। না সংরক্ষণ করেই যাবেন?")) return;
      showTab(t.getAttribute("data-tab"));
    });
  });

  // ---------- documents ----------
  function loadDocs() {
    return request(API_DOCS, "GET").then(function (json) {
      if (!json.ok) return status(errorText(json), false);
      state.docs = json.data.documents;
      renderDocList();
    });
  }
  function renderDocList() {
    var list = document.getElementById("cms-doc-list");
    list.textContent = "";
    state.docs.forEach(function (d) {
      var active = state.doc && state.doc.name === d.name;
      list.appendChild(el("button", {
        type: "button",
        class: "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm " + (active ? "bg-forest text-cream" : "text-forest hover:bg-forest/5"),
        onclick: function () { openDoc(d.name); }
      }, [
        el("span", { text: d.label }),
        el("span", { class: "text-xs opacity-70", text: d.isDefault ? "মূল" : "v" + d.version })
      ]));
    });
  }
  function openDoc(name) {
    if (state.dirty && !window.confirm("সংরক্ষণ না করা পরিবর্তন আছে। অন্য তালিকায় যাবেন?")) return;
    request(API_DOCS + name + "/", "GET").then(function (json) {
      if (!json.ok) return status(errorText(json), false);
      state.doc = json.data;
      state.dirty = false;
      renderDocList();
      renderDoc();
    });
  }
  function renderDoc() {
    var box = document.getElementById("cms-doc-editor");
    box.textContent = "";
    var doc = state.doc;
    var head = el("div", { class: "mb-4 flex flex-wrap items-center justify-between gap-3" }, [
      el("div", null, [
        el("h2", { class: "text-lg font-bold text-forest", text: doc.label }),
        el("p", { class: "text-xs text-muted", text: "সংস্করণ " + doc.version + (doc.updatedBy ? " · শেষ বদলেছেন " + doc.updatedBy : " · মূল তথ্য") })
      ]),
      el("div", { class: "flex flex-wrap gap-2" }, [
        el("button", { type: "button", class: "rounded-full border border-forest/20 px-4 py-2 text-sm font-semibold text-forest", text: "কাঁচা JSON", onclick: toggleRaw }),
        el("button", { type: "button", class: "rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700", text: "মূল অবস্থায় ফেরান", onclick: resetDoc }),
        el("button", { type: "button", class: "rounded-full bg-forest px-5 py-2 text-sm font-semibold text-cream", text: "সংরক্ষণ", onclick: saveDoc })
      ])
    ]);
    box.appendChild(head);
    var raw = el("div", { id: "cms-raw", class: "hidden mb-4" }, [
      el("textarea", { id: "cms-raw-text", rows: "18", class: "w-full rounded-xl border border-forest/20 p-3 font-mono text-xs" }),
      el("button", { type: "button", class: "mt-2 rounded-full border border-forest/20 px-4 py-2 text-sm font-semibold text-forest", text: "এই JSON প্রয়োগ করুন", onclick: applyRaw })
    ]);
    box.appendChild(raw);
    box.appendChild(el("div", { id: "cms-form", class: "space-y-6" }));
    renderForm();
  }
  function renderForm() {
    var form = document.getElementById("cms-form");
    if (!form) return;
    form.textContent = "";
    var data = state.doc.data;
    var isObj = data && typeof data === "object" && !Array.isArray(data);
    if (isObj) {
      Object.keys(data).forEach(function (k) {
        form.appendChild(field(k, data[k], [k], state.doc.name));
      });
    } else {
      form.appendChild(field("items", data, [], state.doc.name));
    }
  }
  function markDirty() { state.dirty = true; }
  function field(key, value, path, docName, opts) {
    opts = opts || {};
    var kind = kindFor(key, path, docName);
    if (Array.isArray(value)) return arrayField(key, value, path, docName, opts);
    if (value && typeof value === "object") return objectField(key, value, path, docName, opts);
    var wrap = el("div", { class: "grid gap-1 sm:grid-cols-[180px_1fr] sm:items-start" }, []);
    var id = "f-" + path.join("-");
    wrap.appendChild(el("label", { for: id, class: "pt-2 text-xs font-semibold text-forest/80", text: labelFor(key) }));
    var control;
    if (kind) control = mediaPicker(kind, value, function (ref) { setIn(state.doc.data, path, ref); markDirty(); });
    else if (key === "type" && docName === "blog") control = select(BLOG_TYPES, value, function (v) { setIn(state.doc.data, path, v); markDirty(); });
    else if (typeof value === "boolean") control = el("input", { id: id, type: "checkbox", class: "mt-3 h-4 w-4", onchange: function (e) { setIn(state.doc.data, path, e.target.checked); markDirty(); } });
    else if (typeof value === "number") control = el("input", { id: id, type: "number", step: "any", class: "rounded-xl border border-forest/20 px-3 py-2 text-sm", onchange: function (e) { setIn(state.doc.data, path, e.target.value === "" ? 0 : Number(e.target.value)); markDirty(); } });
    else {
      var text = value === null ? "" : String(value);
      var multi = text.length > 90 || text.indexOf("\n") >= 0;
      var attrs = { id: id, class: "w-full rounded-xl border border-forest/20 px-3 py-2 text-sm leading-relaxed", oninput: function (e) {
        setIn(state.doc.data, path, value === null && e.target.value === "" ? null : e.target.value); markDirty(); } };
      if (multi) { attrs.rows = Math.min(10, Math.max(3, Math.ceil(text.length / 80))); control = el("textarea", attrs, [text]); }
      else { attrs.type = "text"; attrs.value = text; control = el("input", attrs); }
    }
    wrap.appendChild(control);
    return wrap;
  }
  function select(options, current, onchange) {
    var s = el("select", { class: "rounded-xl border border-forest/20 px-3 py-2 text-sm", onchange: function (e) { onchange(e.target.value); } });
    var seen = false;
    options.forEach(function (o) {
      if (o === current) seen = true;
      s.appendChild(el("option", { value: o, text: o, selected: o === current ? "selected" : null }));
    });
    if (!seen) s.appendChild(el("option", { value: current, text: current, selected: "selected" }));
    return s;
  }
  function mediaPicker(kind, current, onchange) {
    var assets = assetsOf(kind);
    var box = el("div", { class: "space-y-2" });
    var preview = el("div");
    function paint(value) {
      preview.textContent = "";
      var asset = null;
      if (typeof value === "string" && value.indexOf("asset:") === 0) {
        asset = state.assets.filter(function (a) { return a.ref === value; })[0] || null;
      }
      var url = asset ? asset.url : (typeof value === "string" && value && value.indexOf("asset:") !== 0 ? value : "");
      if (!url) { preview.appendChild(el("p", { class: "text-xs text-muted", text: "কোনো ফাইল বাছাই করা নেই" })); return; }
      if (kind === "image") preview.appendChild(el("img", { src: url, alt: "", class: "h-24 w-auto rounded-xl object-cover" }));
      else if (kind === "video") preview.appendChild(el("video", { src: url, controls: "controls", preload: "metadata", class: "h-32 rounded-xl bg-night" }));
      else preview.appendChild(el("audio", { src: url, controls: "controls", preload: "none", class: "w-full" }));
      if (!asset) preview.appendChild(el("p", { class: "mt-1 break-all text-xs text-muted", text: "সরাসরি লিংক: " + url }));
    }
    var s = el("select", { class: "w-full rounded-xl border border-forest/20 px-3 py-2 text-sm", onchange: function (e) {
      onchange(e.target.value); paint(e.target.value);
    } });
    s.appendChild(el("option", { value: "", text: "— কিছু নয় —" }));
    var known = false;
    assets.forEach(function (a) {
      if (a.ref === current) known = true;
      s.appendChild(el("option", { value: a.ref, text: a.title || (kind + " #" + a.id), selected: a.ref === current ? "selected" : null }));
    });
    if (current && !known) s.appendChild(el("option", { value: current, text: "সরাসরি লিংক: " + current, selected: "selected" }));
    box.appendChild(s);
    box.appendChild(preview);
    box.appendChild(el("button", { type: "button", class: "text-xs font-semibold text-forest underline", text: "মিডিয়া লাইব্রেরিতে নতুন ফাইল যোগ করুন", onclick: function () {
      if (state.dirty && !window.confirm("সংরক্ষণ না করা পরিবর্তন আছে। মিডিয়া পাতায় যাবেন?")) return;
      state.mediaKind = kind; showTab("media");
    } }));
    paint(current);
    return box;
  }
  function objectField(key, obj, path, docName, opts) {
    var keys = Object.keys(obj);
    var body = el("div", { class: "space-y-3 border-l-2 border-forest/10 pl-4" }, keys.map(function (k) {
      return field(k, obj[k], path.concat([k]), docName);
    }));
    var children = [body];
    if (opts.inArray) {
      var missing = ["video", "audio"].filter(function (m) { return !(m in obj); });
      if (missing.length) {
        var add = el("select", { class: "rounded-xl border border-forest/20 px-2 py-1 text-xs", onchange: function (e) {
          if (!e.target.value) return;
          setIn(state.doc.data, path.concat([e.target.value]), "");
          markDirty(); renderForm();
        } }, [el("option", { value: "", text: "+ মিডিয়া যোগ করুন" })].concat(missing.map(function (m) {
          return el("option", { value: m, text: labelFor(m) });
        })));
        children.push(add);
      }
    }
    if (opts.inArray) return el("div", { class: "space-y-3" }, children);
    return el("fieldset", { class: "rounded-2xl border border-forest/10 bg-cream/40 p-4" }, [
      el("legend", { class: "px-2 text-sm font-bold text-forest", text: opts.title || labelFor(key) })
    ].concat(children));
  }
  function arrayField(key, arr, path, docName, opts) {
    var list = el("div", { class: "space-y-3" });
    arr.forEach(function (item, i) {
      var itemPath = path.concat([i]);
      var isObject = item && typeof item === "object" && !Array.isArray(item);
      var title = isObject ? String(item.title || item.name || item.label || item.question || item.id || "") : "";
      var controls = el("div", { class: "mb-2 flex flex-wrap items-center gap-2 text-xs" }, [
        el("span", { class: "font-semibold text-forest", text: "আইটেম " + (i + 1) + (title ? " — " + title : "") }),
        el("span", { class: "flex-1" }),
        el("button", { type: "button", class: "rounded-full border px-2 py-1", text: "↑", onclick: function () { moveAt(state.doc.data, itemPath, -1); markDirty(); renderForm(); } }),
        el("button", { type: "button", class: "rounded-full border px-2 py-1", text: "↓", onclick: function () { moveAt(state.doc.data, itemPath, 1); markDirty(); renderForm(); } }),
        el("button", { type: "button", class: "rounded-full border border-rose-300 px-2 py-1 text-rose-700", text: "মুছুন", onclick: function () {
          if (!window.confirm("এই আইটেমটি মুছে ফেলবেন?")) return;
          removeAt(state.doc.data, itemPath); markDirty(); renderForm();
        } })
      ]);
      var inner = isObject
        ? objectField(key, item, itemPath, docName, { inArray: true })
        : field(key, item, itemPath, docName);
      list.appendChild(el("div", { class: "rounded-2xl bg-white p-4 shadow-soft" }, [controls, inner]));
    });
    var addBtn = el("button", { type: "button", class: "rounded-full border border-dashed border-forest/40 px-4 py-2 text-sm font-semibold text-forest", text: "+ নতুন আইটেম", onclick: function () {
      var template = arr.length ? blankLike(arr[0]) : "";
      arr.push(template); markDirty(); renderForm();
    } });
    return el("div", { class: "space-y-2" }, [
      el("div", { class: "text-sm font-bold text-forest", text: (opts.title || labelFor(key)) + " (" + arr.length + ")" }),
      list, addBtn
    ]);
  }
  function toggleRaw() {
    var box = document.getElementById("cms-raw");
    var hidden = box.classList.toggle("hidden");
    if (!hidden) document.getElementById("cms-raw-text").value = JSON.stringify(state.doc.data, null, 2);
  }
  function applyRaw() {
    try {
      state.doc.data = JSON.parse(document.getElementById("cms-raw-text").value);
    } catch (err) {
      return status("JSON ঠিক নেই: " + err.message, false);
    }
    markDirty();
    renderForm();
    status("JSON প্রয়োগ হয়েছে। এখন সংরক্ষণ করুন।", true);
  }
  function saveDoc() {
    var body = { data: state.doc.data, version: state.doc.version };
    request(API_DOCS + state.doc.name + "/", "PUT", body).then(function (json) {
      if (json.status === 409) {
        return status("অন্য কেউ এই তথ্য বদলেছেন। পাতাটি আবার খুলুন।", false);
      }
      if (!json.ok) return status(errorText(json), false);
      state.doc = json.data;
      state.dirty = false;
      renderDocList();
      renderDoc();
      status("সংরক্ষিত হয়েছে (সংস্করণ " + json.data.version + ")। ওয়েবসাইটে কিছুক্ষণের মধ্যে দেখা যাবে।", true);
    });
  }
  function resetDoc() {
    if (!window.confirm("এই তথ্যটি মূল (কোডের সাথে আসা) অবস্থায় ফিরবে। বর্তমান সব বদল মুছে যাবে। নিশ্চিত?")) return;
    request(API_DOCS + state.doc.name + "/reset/", "POST").then(function (json) {
      if (!json.ok) return status(errorText(json), false);
      state.doc = json.data;
      state.dirty = false;
      renderDocList();
      renderDoc();
      status("মূল অবস্থায় ফেরানো হয়েছে।", true);
    });
  }
  window.addEventListener("beforeunload", function (e) {
    if (state.dirty) { e.preventDefault(); e.returnValue = ""; }
  });

  // ---------- page copy ----------
  function loadTexts() {
    request(API_TEXTS, "GET").then(function (json) {
      if (!json.ok) return status(errorText(json), false);
      state.texts = json.data.texts;
      renderTexts();
    });
  }
  function renderTexts() {
    var box = document.getElementById("cms-texts");
    var q = (document.getElementById("cms-text-filter").value || "").trim().toLowerCase();
    var onlyChanged = document.getElementById("cms-text-changed").checked;
    box.textContent = "";
    var groups = {};
    state.texts.forEach(function (t) {
      if (onlyChanged && t.value === null) return;
      if (q && (t.key + " " + t.page + " " + t.default + " " + (t.value || "")).toLowerCase().indexOf(q) < 0) return;
      (groups[t.page] = groups[t.page] || []).push(t);
    });
    Object.keys(groups).sort().forEach(function (page) {
      box.appendChild(el("h3", { class: "text-sm font-bold uppercase tracking-wide text-forest/70", text: page + " (" + groups[page].length + ")" }));
      groups[page].forEach(function (t) { box.appendChild(textRow(t)); });
    });
    if (!box.childNodes.length) box.appendChild(el("p", { class: "text-sm text-muted", text: "কোনো লেখা পাওয়া যায়নি।" }));
  }
  function textRow(t) {
    var area = el("textarea", { rows: "2", class: "w-full rounded-xl border border-forest/20 px-3 py-2 text-sm", placeholder: t.default });
    area.value = t.value === null ? "" : t.value;
    var badge = el("span", { class: "text-xs font-semibold " + (t.value === null ? "text-muted" : "text-gold-deep"), text: t.value === null ? "মূল লেখা" : "বদলানো হয়েছে" });
    function save(value) {
      request(API_TEXTS + encodeURIComponent(t.key) + "/", "PUT", { value: value }).then(function (json) {
        if (!json.ok) return status(errorText(json), false);
        t.value = json.data.value;
        area.value = t.value === null ? "" : t.value;
        badge.textContent = t.value === null ? "মূল লেখা" : "বদলানো হয়েছে";
        badge.className = "text-xs font-semibold " + (t.value === null ? "text-muted" : "text-gold-deep");
        status("লেখা সংরক্ষিত হয়েছে।", true);
      });
    }
    return el("div", { class: "rounded-2xl bg-white p-4 shadow-soft space-y-2" }, [
      el("div", { class: "flex flex-wrap items-center justify-between gap-2 text-xs" }, [
        el("code", { class: "text-forest/70", text: t.key }), badge
      ]),
      el("p", { class: "text-xs text-muted", text: "মূল লেখা: " + (t.default || "(খালি)") }),
      area,
      el("div", { class: "flex gap-2" }, [
        el("button", { type: "button", class: "rounded-full bg-forest px-4 py-1.5 text-xs font-semibold text-cream", text: "সংরক্ষণ", onclick: function () { save(area.value); } }),
        el("button", { type: "button", class: "rounded-full border border-forest/20 px-4 py-1.5 text-xs font-semibold text-forest", text: "মূল লেখায় ফেরান", onclick: function () { save(""); } })
      ])
    ]);
  }
  document.getElementById("cms-text-filter").addEventListener("input", renderTexts);
  document.getElementById("cms-text-changed").addEventListener("change", renderTexts);

  // ---------- media ----------
  function loadMedia(kind) {
    state.mediaKind = kind || "";
    return request(API_MEDIA, "GET").then(function (json) {
      if (!json.ok) return status(errorText(json), false);
      state.assets = json.data.assets;
      renderMedia();
    });
  }
  function renderMedia() {
    var grid = document.getElementById("cms-media-grid");
    grid.textContent = "";
    Array.prototype.forEach.call(document.querySelectorAll("#cms-media-filter [data-kind]"), function (b) {
      var on = b.getAttribute("data-kind") === state.mediaKind;
      b.classList.toggle("bg-forest", on);
      b.classList.toggle("text-cream", on);
    });
    var items = state.mediaKind ? state.assets.filter(function (a) { return a.kind === state.mediaKind; }) : state.assets;
    if (!items.length) grid.appendChild(el("p", { class: "text-sm text-muted", text: "এখানে কোনো ফাইল নেই।" }));
    items.forEach(function (a) { grid.appendChild(assetCard(a)); });
  }
  function assetCard(a) {
    var preview;
    if (a.kind === "image") preview = el("img", { src: a.url, alt: a.alt || "", loading: "lazy", class: "h-40 w-full rounded-xl object-cover bg-cream-2" });
    else if (a.kind === "video") {
      var isDirect = !a.external || /\.(mp4|webm)(\?|$)/i.test(a.url);
      preview = isDirect
        ? el("video", { src: a.url, controls: "controls", preload: "metadata", class: "h-40 w-full rounded-xl bg-night" })
        : el("a", { href: a.url, target: "_blank", rel: "noopener", class: "block rounded-xl bg-night p-4 text-sm text-cream", text: "ভিডিও লিংক খুলুন ↗" });
    } else preview = el("audio", { src: a.url, controls: "controls", preload: "none", class: "w-full" });
    var titleInput = el("input", { type: "text", value: a.title || "", maxlength: "200", class: "w-full rounded-lg border border-forest/20 px-2 py-1 text-sm", placeholder: "শিরোনাম" });
    titleInput.addEventListener("change", function () { patch(a, { title: titleInput.value }); });
    var children = [
      preview,
      el("div", { class: "flex items-center justify-between text-xs text-muted" }, [
        el("span", { text: { image: "ছবি", video: "ভিডিও", audio: "অডিও" }[a.kind] + (a.external ? " · লিংক" : "") }),
        el("code", { text: a.ref })
      ]),
      titleInput
    ];
    if (a.kind === "image") {
      var altInput = el("input", { type: "text", value: a.alt || "", maxlength: "300", class: "w-full rounded-lg border border-forest/20 px-2 py-1 text-sm", placeholder: "বিকল্প বর্ণনা (alt)" });
      altInput.addEventListener("change", function () { patch(a, { alt: altInput.value }); });
      children.push(altInput);
    }
    if (a.external) {
      var urlInput = el("input", { type: "url", value: a.externalUrl || "", class: "w-full rounded-lg border border-forest/20 px-2 py-1 text-xs" });
      urlInput.addEventListener("change", function () { patch(a, { externalUrl: urlInput.value }); });
      children.push(urlInput);
    }
    var actions = [el("button", { type: "button", class: "rounded-full border border-forest/20 px-3 py-1 text-xs font-semibold text-forest", text: "কপি: " + a.ref, onclick: function () {
      if (navigator.clipboard) navigator.clipboard.writeText(a.ref);
      status("রেফারেন্স কপি করা হয়েছে: " + a.ref + " (কন্টেন্ট ফর্মে এটি বেছে নিতে পারেন)।", true);
    } })];
    if (a.deletable) actions.push(el("button", { type: "button", class: "rounded-full border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700", text: "মুছুন", onclick: function () {
      if (!window.confirm("এই ফাইলটি মুছে ফেলবেন?")) return;
      request(API_MEDIA + a.id + "/", "DELETE").then(function (json) {
        if (!json.ok) return status(errorText(json), false);
        status("ফাইল মুছে ফেলা হয়েছে।", true);
        loadMedia(state.mediaKind);
      });
    } }));
    children.push(el("div", { class: "flex flex-wrap gap-2" }, actions));
    return el("div", { class: "space-y-2 rounded-2xl bg-white p-3 shadow-soft" }, children);
  }
  function patch(asset, body) {
    request(API_MEDIA + asset.id + "/", "PATCH", body).then(function (json) {
      if (!json.ok) return status(errorText(json), false);
      Object.assign(asset, json.data);
      status("সংরক্ষিত হয়েছে।", true);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll("#cms-media-filter [data-kind]"), function (b) {
    b.addEventListener("click", function () { state.mediaKind = b.getAttribute("data-kind"); renderMedia(); });
  });
  document.getElementById("cms-upload").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target;
    var button = form.querySelector("button[type=submit]");
    button.disabled = true; button.textContent = "আপলোড হচ্ছে…";
    request(API_MEDIA, "POST", new FormData(form), true).then(function (json) {
      button.disabled = false; button.textContent = "আপলোড করুন";
      if (!json.ok) return status(errorText(json), false);
      form.reset();
      status("আপলোড হয়েছে: " + json.data.ref, true);
      loadMedia(state.mediaKind);
    });
  });
  document.getElementById("cms-link").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    var field = function (name) { return f.elements.namedItem(name).value; };
    var body = { kind: field("kind"), title: field("title"), url: field("url") };
    request(API_MEDIA, "POST", body).then(function (json) {
      if (!json.ok) return status(errorText(json), false);
      f.reset();
      status("লিংক যোগ হয়েছে: " + json.data.ref, true);
      loadMedia(state.mediaKind);
    });
  });

  // ---------- boot ----------
  loadMedia("").then(loadDocs);
  showTab("docs");
})();
