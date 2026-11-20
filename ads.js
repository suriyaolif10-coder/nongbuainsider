/* Ad slots for LEAF POST and หนองบัว INSIDER.
 *
 * Each site has its own ads.json next to its index.html. Edit that file on
 * GitHub to add, change or switch off ads; the page does not need changing.
 *
 *   slot: "top"     - wide banner under the big headline slider
 *         "feed"    - between stories in the news list (every 4 stories)
 *         "section" - between category sections on the TOP tab
 *         "reader"  - under a community story when it is opened
 *   type: "image"   - your own banner: image + link (local shops, sponsors)
 *         "adsense" - Google AdSense: client (ca-pub-...) + adslot
 *   enabled: false  - keep an ad in the file but hide it
 * placeholder: true shows "พื้นที่โฆษณา" boxes where a slot has no ad.
 * Several image ads in one slot rotate automatically (one every 5 seconds,
 * dots + swipe); AdSense units are never hidden in a rotation.
 */
(function () {
  "use strict";
  var cfg = { placeholder: true, contact: "", contactText: "ติดต่อลงโฆษณา", ads: [] };
  var adsenseLoaded = false;

  function esc(s) { return String(s || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  var css = document.createElement("style");
  css.textContent =
    ".ad{display:block;margin:10px 16px;border-radius:10px;overflow:hidden;position:relative;background:var(--bg2);border:1px solid var(--line);color:var(--fg);text-decoration:none}" +
    ".ad img{display:block;width:100%;height:auto}" +
    ".ad-l{position:absolute;top:6px;right:6px;z-index:1;font-size:11px;padding:1px 7px;border-radius:8px;background:rgba(0,0,0,.55);color:#fff}" +
    ".ad-txt{padding:14px 16px}.ad-txt b{display:block;font-size:17px;margin-bottom:4px}.ad-txt span{color:var(--muted);font-size:14px}" +
    ".ad-ph{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border:2px dashed var(--line);background:transparent;color:var(--muted);min-height:90px;padding:12px}" +
    ".ad-ph b{font-size:16px;color:var(--fg)}.ad-ph small{margin-top:4px;color:var(--accent);font-weight:700}" +
    ".ad-top.ad-ph{min-height:120px}.ad-adsense{background:transparent;border:0;min-height:90px}" +
    ".ad-rot{position:relative;margin:10px 16px;border-radius:10px;overflow:hidden;touch-action:pan-y}" +
    ".ad-rot .ad-track{display:flex;transition:transform .5s ease}" +
    ".ad-rot .ad-track>.ad{flex:0 0 100%;margin:0;border-radius:0;display:flex;flex-direction:column;justify-content:center}" +
    ".ad-dots{position:absolute;left:0;right:0;bottom:6px;display:flex;justify-content:center;gap:5px;z-index:2}" +
    ".ad-dots button{width:7px;height:7px;padding:0;border:0;border-radius:4px;background:rgba(255,255,255,.5);cursor:pointer;transition:width .3s}" +
    ".ad-dots button.on{width:18px;background:#ff6a00}" +
    "@media (prefers-reduced-motion:reduce){.ad-rot .ad-track{transition:none}}";
  document.head.appendChild(css);

  function one(a, name) {
    var label = '<span class="ad-l">โฆษณา</span>';
    if (a.type === "adsense" && a.client && a.adslot) {
      return '<div class="ad ad-adsense ad-' + esc(name) + '">' + label +
        '<ins class="adsbygoogle" style="display:block" data-ad-client="' + esc(a.client) + '" data-ad-slot="' + esc(a.adslot) +
        '" data-ad-format="auto" data-full-width-responsive="true"></ins></div>';
    }
    var inner = a.image
      ? '<img src="' + esc(a.image) + '" alt="' + esc(a.title || "โฆษณา") + '" loading="lazy">'
      : '<div class="ad-txt"><b>' + esc(a.title) + "</b><span>" + esc(a.text) + "</span></div>";
    return a.link
      ? '<a class="ad ad-' + esc(name) + '" href="' + esc(a.link) + '" target="_blank" rel="sponsored noopener">' + label + inner + "</a>"
      : '<div class="ad ad-' + esc(name) + '">' + label + inner + "</div>";
  }

  // ---------- เลื่อนโฆษณาอัตโนมัติ (ตัวจับเวลาเดียวทั้งหน้า ใช้ได้แม้หน้าเรนเดอร์ใหม่) ----------
  function show(box, i) {
    var n = +box.getAttribute("data-n");
    i = ((i % n) + n) % n;
    box.setAttribute("data-i", i);
    box.querySelector(".ad-track").style.transform = "translateX(-" + i * 100 + "%)";
    var b = box.querySelectorAll(".ad-dots button");
    for (var k = 0; k < b.length; k++) b[k].className = k === i ? "on" : "";
  }
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  setInterval(function () {
    if (document.hidden || reduce) return;
    var boxes = document.querySelectorAll(".ad-rot");
    for (var k = 0; k < boxes.length; k++) {
      var box = boxes[k];
      if (box.matches(":hover") || box._touch) continue;
      show(box, +box.getAttribute("data-i") + 1);
    }
  }, 5000);
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest(".ad-dots button");
    if (!t) return;
    e.preventDefault();
    show(t.closest(".ad-rot"), +t.getAttribute("data-go"));
  });
  document.addEventListener("touchstart", function (e) {
    var box = e.target.closest && e.target.closest(".ad-rot");
    if (box) { box._touch = true; box._x = e.touches[0].clientX; }
  }, { passive: true });
  document.addEventListener("touchend", function (e) {
    var box = e.target.closest && e.target.closest(".ad-rot");
    if (!box) return;
    var dx = e.changedTouches[0].clientX - (box._x || 0);
    if (Math.abs(dx) > 40) show(box, +box.getAttribute("data-i") + (dx < 0 ? 1 : -1));
    setTimeout(function () { box._touch = false; }, 4000);
  }, { passive: true });

  window.LPAds = {
    load: function (url) {
      return fetch(url + "?t=" + Math.floor(Date.now() / 600000))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (c) { if (c) for (var k in c) cfg[k] = c[k]; })
        .catch(function () {});
    },
    // n = how many times this slot was used on the page, to rotate several ads
    slot: function (name, n) {
      var list = (cfg.ads || []).filter(function (a) { return a.slot === name && a.enabled !== false; });
      // โฆษณาภาพ/ข้อความหลายชิ้น: เลื่อนวนตามจำนวน เริ่มคนละชิ้นในแต่ละช่อง
      var own = list.filter(function (a) { return a.type !== "adsense"; });
      if (own.length > 1) {
        var start = (n || 0) % own.length, slides = "", dots = "";
        own.forEach(function (a, i) {
          slides += one(a, name);
          dots += '<button type="button" aria-label="โฆษณาที่ ' + (i + 1) + '"' + (i === start ? ' class="on"' : "") + ' data-go="' + i + '"></button>';
        });
        return '<div class="ad-rot ad-' + esc(name) + '" data-i="' + start + '" data-n="' + own.length + '" aria-roledescription="carousel" aria-label="โฆษณา">' +
          '<div class="ad-track" style="transform:translateX(-' + start * 100 + '%)">' + slides + '</div><div class="ad-dots">' + dots + "</div></div>";
      }
      if (own.length) return one(own[0], name);
      if (list.length) return one(list[(n || 0) % list.length], name);
      if (!cfg.placeholder) return "";
      var link = cfg.contact ? ' href="' + esc(cfg.contact) + '" target="_blank" rel="noopener"' : "";
      return "<a class=\"ad ad-ph ad-" + esc(name) + "\"" + link + "><b>พื้นที่โฆษณา</b><small>" + esc(cfg.contactText) + " ›</small></a>";
    },
    // call after the ads are in the page
    activate: function () {
      var slots = document.querySelectorAll("ins.adsbygoogle:not([data-adsbygoogle-status])");
      if (!slots.length) return;
      if (!adsenseLoaded) {
        adsenseLoaded = true;
        var s = document.createElement("script");
        s.async = true; s.crossOrigin = "anonymous";
        s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(slots[0].getAttribute("data-ad-client"));
        document.head.appendChild(s);
      }
      for (var i = 0; i < slots.length; i++) { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {} }
    }
  };
})();
