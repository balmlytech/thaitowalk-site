/* ==========================================================================
   THAI TO WALK — cookie consent (self-hosted, no third party)
   The only non-essential cookies come from the embedded Google Map, so the
   map stays blocked until the visitor consents. Choice is remembered locally.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'ttw-consent';
  var banner = document.querySelector('.cookie-banner');

  function getConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function setConsent(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  // Inject the real map src only once consent (or an explicit load) is given.
  function loadMaps() {
    var maps = document.querySelectorAll('.loc-map');
    maps.forEach(function (map) {
      var frame = map.querySelector('.gmap');
      if (frame && !frame.src) {
        var src = frame.getAttribute('data-src');
        if (src) frame.src = src;
      }
      map.classList.add('is-loaded');
    });
  }

  function openBanner() { if (banner) banner.classList.add('open'); }
  function closeBanner() { if (banner) banner.classList.remove('open'); }

  function accept() { setConsent('accepted'); loadMaps(); closeBanner(); }
  function reject() { setConsent('rejected'); closeBanner(); }

  if (banner) {
    var a = banner.querySelector('[data-consent="accept"]');
    var r = banner.querySelector('[data-consent="reject"]');
    if (a) a.addEventListener('click', accept);
    if (r) r.addEventListener('click', reject);
  }

  // Footer "Cookie settings" re-opens the banner so a choice can be changed.
  document.querySelectorAll('[data-cookie-settings]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); openBanner(); });
  });

  // Per-map "Load the map" button: explicit, one-off consent to load the map
  // for this visit, without changing a global "reject".
  document.querySelectorAll('[data-load-map]').forEach(function (btn) {
    btn.addEventListener('click', loadMaps);
  });

  // Apply any stored choice on load; prompt only on first visit.
  var choice = getConsent();
  if (choice === 'accepted') loadMaps();
  else if (choice !== 'rejected') openBanner();
})();
