/* মোঃ আবু তাহের — সাইটের ছোট ইন্টারঅ্যাকশন (vanilla JS) */
(function () {
  "use strict";

  // ---------------------------------------------------- মোবাইল মেনু
  var toggle = document.getElementById("nav-toggle");
  var menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ---------------------------------------------------- ছবি লোড ব্যর্থ হলে
  document.querySelectorAll("[data-smart-image]").forEach(function (wrap) {
    var img = wrap.querySelector("img");
    if (!img) return;
    img.addEventListener("error", function () {
      img.style.display = "none";
      var fallback = wrap.querySelector(".smart-fallback");
      if (fallback) fallback.hidden = false;
    });
  });

  // ---------------------------------------------------- হিরো/কার্ডে স্ক্রল-রিভিল
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) { observer.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("revealed"); });
  }

  // ---------------------------------------------------- জরিপ ফর্ম
  document.querySelectorAll("[data-poll-option]").forEach(function (label) {
    label.addEventListener("click", function () {
      var form = label.closest("form");
      if (!form) return;
      form.querySelectorAll(".poll-option").forEach(function (row) { row.classList.remove("chosen"); });
      label.classList.add("chosen");
      var radio = label.querySelector("input[type=radio]");
      if (radio) radio.checked = true;
    });
  });

  // ---------------------------------------------------- চ্যাট (পোলিং)
  var chatForm = document.getElementById("chat-form");
  if (chatForm) {
    chatForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(chatForm);
      var button = chatForm.querySelector("button[type=submit]");
      if (button) button.disabled = true;
      fetch(chatForm.action, {
        method: "POST",
        body: data,
        headers: { "X-Requested-With": "fetch" },
        credentials: "same-origin",
      })
        .then(function (r) { return r.json(); })
        .then(function (json) {
          if (json && json.ok) window.location.reload();
          else if (button) button.disabled = false;
          if (json && json.errors) {
            var box = document.getElementById("chat-errors");
            if (box) box.textContent = "বার্তা পাঠানো যায়নি — আবার চেষ্টা করুন।";
          }
        })
        .catch(function () { if (button) button.disabled = false; });
    });
  }

  // ---------------------------------------------------- গ্যালারি লাইটবক্স
  document.querySelectorAll("[data-lightbox]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var src = link.getAttribute("href");
      var box = document.createElement("div");
      box.style.cssText =
        "position:fixed;inset:0;z-index:999;background:rgba(5,19,15,.92);display:grid;place-items:center;padding:1.5rem;cursor:zoom-out";
      var img = document.createElement("img");
      img.src = src;
      img.style.cssText = "max-width:min(94vw,1200px);max-height:88vh;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.6)";
      box.appendChild(img);
      box.addEventListener("click", function () { box.remove(); });
      document.addEventListener("keydown", function esc(e) {
        if (e.key === "Escape") { box.remove(); document.removeEventListener("keydown", esc); }
      });
      document.body.appendChild(box);
    });
  });
})();
