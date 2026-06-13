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
  function onScrollHero() {
    if (!hero) return;
    var h = hero.offsetHeight || 1;
    heroProgress = Math.min(1, Math.max(0, window.scrollY / h));
    if (!reduceMotion) hero.style.setProperty('--hp', heroProgress.toFixed(4));
  }
  onScrollHero();
  window.addEventListener('scroll', onScrollHero, { passive: true });

  /* ==========================================================================
     EMBER FIELD — sparks rising from the wok, over the photoreal hero image.
     Full-bleed canvas, capped particles, pauses when hero off-screen.
     ========================================================================== */
  var canvas = document.querySelector('.hero-embers');
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext('2d', { alpha: true });
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var embers = [];
    var running = true;

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // pause rendering when hero scrolled away (perf)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        running = es[0].isIntersecting;
        if (running) loop();
      }, { threshold: 0 }).observe(canvas);
    }

    function spawn() {
      // bias toward the wok / flame zone (centre-right, lower half of frame)
      var cx = W * 0.62 + (Math.random() - 0.5) * W * 0.5;
      embers.push({
        x: cx,
        y: H * (0.72 + Math.random() * 0.26),
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.3 + Math.random() * 1.1),
        life: 1,
        decay: 0.004 + Math.random() * 0.008,
        size: 0.8 + Math.random() * 2.2,
        wob: Math.random() * Math.PI * 2,
        flick: 0.6 + Math.random() * 0.4
      });
    }

    function tick() {
      // fewer sparks as the camera pulls back into the kitchen
      var rate = Math.max(1, Math.round(3 - heroProgress * 2));
      for (var i = 0; i < rate; i++) spawn();
      if (embers.length > 220) embers.splice(0, embers.length - 220);

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      for (var j = embers.length - 1; j >= 0; j--) {
        var p = embers[j];
        p.wob += 0.05;
        p.x += p.vx + Math.sin(p.wob) * 0.4;
        p.y += p.vy;
        p.vy *= 0.995;
        p.life -= p.decay;
        if (p.life <= 0) { embers.splice(j, 1); continue; }

        var t = p.life;
        var a = t * 0.9 * p.flick;
        var r = p.size * (1.6 + (1 - t));
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, 'rgba(255,214,140,' + a + ')');
        g.addColorStop(0.4, 'rgba(245,130,32,' + a * 0.7 + ')');
        g.addColorStop(1, 'rgba(120,30,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function loop() {
      if (!running) return;
      tick();
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ---------- Footer year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
