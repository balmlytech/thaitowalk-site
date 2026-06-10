/* ==========================================================================
   THAI TO WALK — interactions
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector('.site-header');
  function onScrollHeader() {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.classList.remove('open');
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.16 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Hero: logo lift + wok shift tied to scroll ---------- */
  var hero = document.querySelector('.hero');
  var logo = document.querySelector('.hero-logo');
  var heroState = { progress: 0 };

  function onScrollHero() {
    if (!hero) return;
    var h = hero.offsetHeight;
    var p = Math.min(1, Math.max(0, window.scrollY / h));
    heroState.progress = p;
    if (logo && !reduceMotion) {
      // logo lifts gently as you scroll into the flames
      logo.style.setProperty('--logo-float', (-p * 46) + 'px');
    }
  }
  onScrollHero();
  window.addEventListener('scroll', onScrollHero, { passive: true });

  /* ==========================================================================
     FLAME CANVAS — particle fire that grows on scroll
     Lightweight: capped particle count, pauses when hero off-screen.
     ========================================================================== */
  var canvas = document.querySelector('.flame-canvas');
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext('2d', { alpha: true });
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var particles = [];
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

    function spawn(intensity) {
      // emit from a narrow base near the bottom; spread widens with intensity
      var baseY = H * 0.92;
      var spread = W * (0.10 + intensity * 0.14);
      var cx = W / 2 + (Math.random() - 0.5) * spread;
      particles.push({
        x: cx,
        y: baseY + Math.random() * 6,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(1.8 + Math.random() * 2.6 + intensity * 2.8),
        life: 1,
        decay: 0.011 + Math.random() * 0.014,
        size: 16 + Math.random() * 24 + intensity * 22,
        wob: Math.random() * Math.PI * 2
      });
    }

    function tick() {
      // flame intensity ramps with hero scroll progress, with a living floor.
      var intensity = 0.4 + heroState.progress * 0.85;
      var emit = Math.round(4 + intensity * 7);
      for (var i = 0; i < emit; i++) spawn(intensity);

      // cap
      if (particles.length > 460) particles.splice(0, particles.length - 460);

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      for (var j = particles.length - 1; j >= 0; j--) {
        var p = particles[j];
        p.wob += 0.09;
        p.x += p.vx + Math.sin(p.wob) * 0.7;
        p.y += p.vy;
        p.vy *= 0.987;
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(j, 1); continue; }

        var t = p.life;                 // 1 -> 0
        var r = p.size * (0.45 + (1 - t) * 0.95);
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        // hot white core -> orange -> deep red -> fade. Brand orange #F58220.
        var a = t * 0.55;
        if (t > 0.72)      { g.addColorStop(0, 'rgba(255,248,224,'+a+')'); g.addColorStop(0.38, 'rgba(255,186,66,'+a*0.85+')'); }
        else if (t > 0.42) { g.addColorStop(0, 'rgba(255,176,54,'+a+')');  g.addColorStop(0.5, 'rgba(245,130,32,'+a*0.72+')'); }
        else               { g.addColorStop(0, 'rgba(222,84,18,'+a+')');    g.addColorStop(0.6, 'rgba(150,38,8,'+a*0.5+')'); }
        g.addColorStop(1, 'rgba(0,0,0,0)');
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
