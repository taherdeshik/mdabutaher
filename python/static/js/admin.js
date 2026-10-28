/* কমান্ড সেন্টারের ছোট ইন্টারঅ্যাকশন */
(function () {
  "use strict";

  // মিডিয়া লাইব্রেরি থেকে ছবির পাথ কপি
  document.querySelectorAll("[data-copy-url]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var url = btn.getAttribute("data-copy-url") || "";
      var target = document.querySelector(btn.getAttribute("data-target") || "");
      if (target) target.value = url;
      if (navigator.clipboard) navigator.clipboard.writeText(url).catch(function () {});
      btn.textContent = "✓ কপি হয়েছে";
      setTimeout(function () { btn.textContent = "কপি"; }, 1500);
    });
  });

  // ইনলাইন সম্পাদনার জন্য <details> খোলা রাখা
  var openId = document.body.getAttribute("data-open");
  if (openId) {
    var el = document.getElementById("row-" + openId);
    if (el) el.setAttribute("open", "open");
  }

  // মোছার আগে নিশ্চিতকরণ
  document.querySelectorAll("form[data-confirm]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      if (!window.confirm(form.getAttribute("data-confirm"))) event.preventDefault();
    });
  });

  // প্রিভিউ ট্যাব
  document.querySelectorAll("[data-preview]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.querySelector(btn.getAttribute("data-preview"));
      var source = document.querySelector(btn.getAttribute("data-source"));
      if (!target || !source) return;
      target.textContent = source.value;
      target.hidden = !target.hidden;
    });
  });
})();
