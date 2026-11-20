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
    ".ad-top.ad-ph{min-height:120px}.ad-adsense{background:transparent;border:0;min-height:90px}";
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
