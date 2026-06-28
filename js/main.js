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

  /* ---------- Dish clips: lazy-load + play only in view (perf + reduced motion) ---------- */
  var dishClips = document.querySelectorAll('video.dish-clip');
  if (dishClips.length) {
    // iOS won't paint a video frame until it plays OR seeks — so nudge the
    // playhead once metadata is in, guaranteeing a still frame instead of a
    // black box even when muted autoplay is blocked (Low Power / Low Data).
    var paintFrame = function (v) {
      var seek = function () {
        try { if (v.currentTime < 0.04) v.currentTime = 0.04; } catch (e) {}
        v.removeEventListener('loadedmetadata', seek);
      };
      v.addEventListener('loadedmetadata', seek);
    };
    var loadClip = function (v) {
      if (!v.src && v.dataset.src) { paintFrame(v); v.src = v.dataset.src; }
    };
    var playClip = function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); };

    if (reduceMotion) {
      dishClips.forEach(function (v) { v.preload = 'metadata'; loadClip(v); });
    } else {
      if ('IntersectionObserver' in window) {
        var clipIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            var v = e.target;
            if (e.isIntersecting) { loadClip(v); playClip(v); }
            else if (!v.paused) { v.pause(); }
          });
        }, { rootMargin: '200px 0px', threshold: 0.25 });
        dishClips.forEach(function (v) { clipIO.observe(v); });
      } else {
        dishClips.forEach(function (v) { loadClip(v); playClip(v); });
      }

      // iOS Safari can refuse muted autoplay (Low Power / Low Data Mode).
      // The first real tap anywhere (e.g. dismissing the poster) unlocks
      // media — resume any loaded-but-paused clip that's on screen.
      var inView = function (v) {
        var r = v.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight;
      };
      var kickClips = function () {
        dishClips.forEach(function (v) {
          if (v.paused && inView(v)) { loadClip(v); playClip(v); }
        });
      };
      window.addEventListener('touchend', kickClips, { passive: true });
      window.addEventListener('click', kickClips);
    }
  }

  /* ---------- Footer year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Coming-soon poster (dismissible, remembered) ---------- */
  var cs = document.getElementById('comingSoon');
  if (cs) {
    var CS_KEY = 'ttw-coming-soon-dismissed';
    var seen = false;
    try { seen = localStorage.getItem(CS_KEY) === '1'; } catch (e) {}

    if (!seen) {
      var lastFocus = document.activeElement;
      cs.hidden = false;
      document.body.classList.add('cs-open');
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { cs.classList.add('is-open'); });
      });
      var closeBtn = cs.querySelector('.cs-close');
      if (closeBtn) { try { closeBtn.focus({ preventScroll: true }); } catch (e) { closeBtn.focus(); } }

      var closeCS = function () {
        if (cs.hidden) return;
        try { localStorage.setItem(CS_KEY, '1'); } catch (e) {}
        cs.classList.remove('is-open');
        cs.classList.add('is-closing');
        document.body.classList.remove('cs-open');
        var done = function () {
          cs.hidden = true;
          cs.classList.remove('is-closing');
          cs.removeEventListener('transitionend', done);
        };
        cs.addEventListener('transitionend', done);
        window.setTimeout(done, 650);
        if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
      };

      Array.prototype.forEach.call(cs.querySelectorAll('[data-cs-dismiss]'), function (el) {
        el.addEventListener('click', closeCS);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !cs.hidden) closeCS();
      });
    }
  }
})();
