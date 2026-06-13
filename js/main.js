/* ==========================================================================
   THAI TO WALK — interactions v2
   Header state · overlay nav · entrance choreography · scroll reveals ·
   flame particle canvas (intensity tied to scroll). No dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Entrance choreography ---------- */
  /* html.js is set inline in <head>; .is-loaded releases the hero masks */
  window.requestAnimationFrame(function () {
    document.documentElement.classList.add('is-loaded');
  });

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector('.site-header');
  var headerPinned = header && header.classList.contains('scrolled'); // menu page keeps it solid
  function onScrollHeader() {
    if (!header || headerPinned) return;
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- Mobile overlay nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Hero: zoom progress (--hp) tied to scroll ---------- */
  /* --hp drives the CSS: image scales back to reveal the kitchen, copy fades. */
  var hero = document.querySelector('.hero');
  var heroProgress = 0;
  var heroTicking = false;
  function computeHero() {
    heroTicking = false;
    if (!hero) return;
    // progress = how far we've scrolled through the hero's pinned range (0..1).
    // The hero is taller than the viewport; the pin stays stuck for that surplus.
    var scrollable = hero.offsetHeight - window.innerHeight;
    if (scrollable <= 0) {
      heroProgress = 0;
    } else {
      var top = hero.getBoundingClientRect().top; // 0 at start, negative as we scroll in
      heroProgress = Math.min(1, Math.max(0, -top / scrollable));
    }
    if (!reduceMotion) hero.style.setProperty('--hp', heroProgress.toFixed(4));
  }
  // Coalesce scroll events to one update per animation frame (no layout thrash).
  function onScrollHero() {
    if (!heroTicking) { heroTicking = true; requestAnimationFrame(computeHero); }
  }
  computeHero();
  window.addEventListener('scroll', onScrollHero, { passive: true });

  /* ==========================================================================
     HERO VIDEO — real flame & steam motion, loaded responsibly.
     The poster (hero-wok.jpg) shows instantly; the video fades in over it.
     Skipped entirely for reduced-motion and data-saver users, and if the
     browser blocks autoplay we simply keep the still poster.
     ========================================================================== */
  var heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    var conn = navigator.connection || {};
    var saveData = conn.saveData === true;
    if (!reduceMotion && !saveData) {
      var vsrc = heroVideo.getAttribute('data-src');
      if (vsrc) {
        heroVideo.src = vsrc;
        heroVideo.addEventListener('canplay', function () {
          heroVideo.classList.add('is-ready');
        }, { once: true });
        var tryPlay = function () {
          var p = heroVideo.play();
          if (p && p.catch) p.catch(function () {});
        };
        tryPlay();
        // If autoplay was blocked (e.g. iOS Low Power Mode), start on the
        // first user interaction. Until then the still poster shows.
        if (heroVideo.paused) {
          var kick = function () {
            tryPlay();
            window.removeEventListener('pointerdown', kick);
            window.removeEventListener('touchstart', kick);
            window.removeEventListener('scroll', kick);
          };
          window.addEventListener('pointerdown', kick, { once: true, passive: true });
          window.addEventListener('touchstart', kick, { once: true, passive: true });
          window.addEventListener('scroll', kick, { once: true, passive: true });
        }
      }
    }
  }

  /* ---------- Footer year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
